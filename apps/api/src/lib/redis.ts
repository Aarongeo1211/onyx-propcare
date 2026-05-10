import { logger } from "./logger";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.expiresAt <= now) store.delete(key);
    }
  }, 60_000);
  cleanupTimer.unref();
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.data;
  },

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    ensureCleanup();
    store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  async del(key: string): Promise<void> {
    store.delete(key);
  },

  async invalidatePrefix(prefix: string): Promise<void> {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },
};

logger.info("In-memory cache initialized (swap to Redis via REDIS_URL when ready)");
