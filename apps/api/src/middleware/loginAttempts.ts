import { redisClient } from "../lib/redis";

// ─── Config ───────────────────────────────────────────────────────────────────
const WINDOW_MS = 15 * 60 * 1000;         // 15 minutes
const WINDOW_SEC = WINDOW_MS / 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_SEC = WINDOW_SEC;            // same 15-min lockout

// ─── Redis key helpers ────────────────────────────────────────────────────────
function attemptKey(email: string) { return `login:attempts:${email.toLowerCase().trim()}`; }
function lockKey(email: string)    { return `login:lock:${email.toLowerCase().trim()}`; }

// ─── In-memory fallback (single-replica only) ─────────────────────────────────
interface Attempt { count: number; firstAt: number; lockedUntil?: number; }
const memAttempts = new Map<string, Attempt>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of memAttempts.entries()) {
    if ((v.lockedUntil && v.lockedUntil < now) || now - v.firstAt > WINDOW_MS * 2) {
      memAttempts.delete(k);
    }
  }
}, WINDOW_MS).unref();

// ─── Public API ───────────────────────────────────────────────────────────────

export async function isLocked(email: string): Promise<{ locked: boolean; retryAfterSec?: number }> {
  if (redisClient) {
    const ttl = await redisClient.ttl(lockKey(email));
    if (ttl > 0) return { locked: true, retryAfterSec: ttl };
    return { locked: false };
  }

  // in-memory fallback
  const entry = memAttempts.get(attemptKey(email));
  if (!entry?.lockedUntil) return { locked: false };
  if (Date.now() < entry.lockedUntil) {
    return { locked: true, retryAfterSec: Math.ceil((entry.lockedUntil - Date.now()) / 1000) };
  }
  memAttempts.delete(attemptKey(email));
  return { locked: false };
}

export async function recordFailure(email: string): Promise<void> {
  if (redisClient) {
    const aKey = attemptKey(email);
    const count = await redisClient.incr(aKey);
    if (count === 1) {
      // First failure — start the window TTL
      await redisClient.expire(aKey, WINDOW_SEC);
    }
    if (count >= MAX_ATTEMPTS) {
      // Lock the account; the attempt counter's TTL keeps running independently
      await redisClient.set(lockKey(email), "1", "EX", LOCKOUT_SEC);
    }
    return;
  }

  // in-memory fallback
  const k = attemptKey(email);
  const now = Date.now();
  const entry = memAttempts.get(k);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    memAttempts.set(k, { count: 1, firstAt: now });
    return;
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) entry.lockedUntil = now + WINDOW_MS;
}

export async function clearFailures(email: string): Promise<void> {
  if (redisClient) {
    await redisClient.del(attemptKey(email), lockKey(email));
    return;
  }
  memAttempts.delete(attemptKey(email));
}
