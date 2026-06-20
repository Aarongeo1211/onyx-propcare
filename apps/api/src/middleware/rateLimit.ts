import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../lib/redis";

const isProduction = process.env.NODE_ENV === "production";

function makeStore(prefix: string) {
  if (!redisClient) return undefined; // falls back to express-rate-limit's in-memory store
  return new RedisStore({
    sendCommand: (...args: string[]) => {
      const [cmd, ...rest] = args;
      return redisClient!.call(cmd, ...rest) as Promise<number>;
    },
    prefix: `rl:${prefix}:`,
  });
}

// General: 100 req / 15 min per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("general"),
  message: { success: false, error: "Too many requests, please try again later" },
});

// Auth: 10 req / 15 min per IP (login, register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("auth"),
  message: { success: false, error: "Too many authentication attempts, please try again later" },
});

// Registration: 3 req / hour per IP (tighter than authLimiter)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 3 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("register"),
  message: { success: false, error: "Too many registration attempts, please try again later" },
});

// Upload: 20 req / 15 min per IP
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("upload"),
  message: { success: false, error: "Too many upload requests, please try again later" },
});
