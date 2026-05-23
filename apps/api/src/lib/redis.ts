import Redis from "ioredis";
import { logger } from "./logger";

// ─── Redis client (shared across cache, rate limiters, lockout) ──────────────

export let redisClient: Redis | null = null;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redisClient.on("connect", () => logger.info("Redis connected"));
  redisClient.on("error", (err) => logger.error({ err }, "Redis error"));
  redisClient.on("close", () => logger.warn("Redis connection closed"));
} else {
  logger.warn("REDIS_URL not set — using in-memory fallback (not suitable for multi-replica deployments)");
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memStore = new Map<string, CacheEntry<unknown>>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memStore.entries()) {
      if (entry.expiresAt <= now) memStore.delete(key);
    }
  }, 60_000);
  cleanupTimer.unref();
}

// ─── Unified cache API ────────────────────────────────────────────────────────

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (redisClient) {
      const raw = await redisClient.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    const entry = memStore.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) { memStore.delete(key); return null; }
    return entry.data;
  },

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    if (redisClient) {
      await redisClient.set(key, JSON.stringify(data), "EX", ttlSeconds);
      return;
    }
    ensureCleanup();
    memStore.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  async del(key: string): Promise<void> {
    if (redisClient) { await redisClient.del(key); return; }
    memStore.delete(key);
  },

  async invalidatePrefix(prefix: string): Promise<void> {
    if (redisClient) {
      // Use SCAN to avoid blocking the server with KEYS
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redisClient.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) await redisClient.del(...keys);
      } while (cursor !== "0");
      return;
    }
    for (const key of memStore.keys()) {
      if (key.startsWith(prefix)) memStore.delete(key);
    }
  },
};
