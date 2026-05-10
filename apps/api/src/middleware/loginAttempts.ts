const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface Attempt {
  count: number;
  firstAt: number;
  lockedUntil?: number;
}

const attempts = new Map<string, Attempt>();

function key(email: string) {
  return email.toLowerCase().trim();
}

export function isLocked(email: string): { locked: boolean; retryAfterSec?: number } {
  const entry = attempts.get(key(email));
  if (!entry?.lockedUntil) return { locked: false };
  if (Date.now() < entry.lockedUntil) {
    return { locked: true, retryAfterSec: Math.ceil((entry.lockedUntil - Date.now()) / 1000) };
  }
  attempts.delete(key(email));
  return { locked: false };
}

export function recordFailure(email: string) {
  const k = key(email);
  const now = Date.now();
  const entry = attempts.get(k);

  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(k, { count: 1, firstAt: now });
    return;
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + WINDOW_MS;
  }
}

export function clearFailures(email: string) {
  attempts.delete(key(email));
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of attempts.entries()) {
    if ((v.lockedUntil && v.lockedUntil < now) || now - v.firstAt > WINDOW_MS * 2) {
      attempts.delete(k);
    }
  }
}, WINDOW_MS).unref();
