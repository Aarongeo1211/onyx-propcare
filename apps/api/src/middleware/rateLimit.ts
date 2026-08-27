import { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import jwt from "jsonwebtoken";
import { redisClient } from "../lib/redis";
import { env } from "../config/env";

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

// Keys authenticated requests by user ID rather than IP, so users sharing an
// IP (mobile carrier NAT, offices, VPNs) each draw from their own quota
// instead of one shared bucket -- root cause of the false CORS-looking 429s
// real browsing traffic was hitting. Falls back to IP (via express-rate-limit's
// own IPv6-safe helper) for anonymous requests. Only wired into limiters that
// see authenticated traffic; login/register/forgot-password stay IP-only
// since there's no user yet to key on, and keying brute-force protection by a
// self-reported token would defeat the point of it.
function userOrIpKey(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), env.JWT_SECRET) as { id?: string };
      if (decoded?.id) return `user:${decoded.id}`;
    } catch {
      // invalid/expired token -- fall through to IP-based keying
    }
  }
  return ipKeyGenerator(req.ip ?? "unknown");
}

// General: 400 req / 15 min per user (or per IP if unauthenticated). Applies
// to every request across the whole API (browsing, not just mutations), and
// Next.js prefetches every visible link in the background on top of normal
// filter/sort/pagination fetches -- 100 was getting exhausted by ordinary
// browsing, especially from shared IPs where many users draw from one bucket.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 400 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("general"),
  keyGenerator: userOrIpKey,
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

// Upload: 60 req / 15 min per user (or per IP if unauthenticated, though every
// upload route requires auth in practice). Was 20 -- real sellers uploading
// images for several properties in one sitting (higher-tier plans allow 15+
// images per listing) were hitting that within a single session and getting
// throttled.
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 60 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("upload"),
  keyGenerator: userOrIpKey,
  message: { success: false, error: "Too many upload requests, please try again later" },
});

// Password reset: 3 req / hour per IP (cost protection from email flooding)
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 3 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("forgot-password"),
  message: { success: false, error: "Too many password reset requests, please try again later" },
});
