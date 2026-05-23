import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@onyx/db";
import { env } from "../config/env";
import { redisClient } from "../lib/redis";

export const JWT_SECRET = env.JWT_SECRET;

// TTL for the deactivation blocklist entry — must be >= JWT expiry (7 days)
const BLOCKLIST_TTL_SEC = 7 * 24 * 60 * 60;

/** Call this when an admin deactivates a user so their current JWT stops working immediately. */
export async function blockUserToken(userId: string): Promise<void> {
  if (redisClient) {
    await redisClient.set(`blocked:user:${userId}`, "1", "EX", BLOCKLIST_TTL_SEC);
  }
  // In-memory mode: no cross-replica blocklist, but single-replica setups will still work
  // via the isActive DB check on next sensitive operation.
}

/** Remove a user from the blocklist (e.g. when an admin re-activates them). */
export async function unblockUserToken(userId: string): Promise<void> {
  if (redisClient) {
    await redisClient.del(`blocked:user:${userId}`);
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];

  let decoded: AuthUser;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }

  // Check deactivation blocklist (async — run the check, proceed only when resolved)
  const checkBlocklist = redisClient
    ? redisClient.get(`blocked:user:${decoded.id}`)
    : Promise.resolve(null);

  checkBlocklist
    .then((blocked) => {
      if (blocked) {
        return res.status(401).json({ success: false, error: "Account has been deactivated" });
      }
      req.user = decoded;
      next();
    })
    .catch(() => {
      // Redis unavailable — fail open (don't block legitimate users due to Redis outage)
      req.user = decoded;
      next();
    });
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as AuthUser;
    const checkBlocklist = redisClient
      ? redisClient.get(`blocked:user:${decoded.id}`)
      : Promise.resolve(null);
    checkBlocklist
      .then((blocked) => { if (!blocked) req.user = decoded; })
      .catch(() => { req.user = decoded; })
      .finally(() => next());
  } catch {
    next();
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Insufficient permissions" });
    }

    next();
  };
}

export const requireAdmin = requireRole("ADMIN", "SUPER_ADMIN");
