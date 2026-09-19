import crypto from "node:crypto";
import net from "node:net";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export const INTERNAL_KEY_HEADER = "x-internal-key";
export const CLIENT_IP_HEADER = "x-client-ip";

function matchesInternalSecret(provided: string | undefined): boolean {
  const secret = env.INTERNAL_API_SECRET;
  if (!secret || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * The web app's server calls this API on behalf of every visitor -- logins,
 * token refreshes, server-rendered page data -- and all of those calls arrive
 * from the web container's single egress IP. Keyed by that IP, the per-IP rate
 * limits (10 logins / 15 min, 400 requests / 15 min) would be shared by the
 * whole site and start failing as soon as traffic grows.
 *
 * When a request carries the shared INTERNAL_API_SECRET:
 *  - with X-Client-IP (the visitor's IP, from Railway's edge X-Real-IP on the
 *    web side), req.ip becomes that visitor, so rate limits, audit logs and
 *    anything else IP-based apply per visitor again;
 *  - without it, the call is the web server's own work (ISR / sitemap renders
 *    of public data) and is marked so the general limiters skip it.
 * Without a valid secret both headers are ignored, so public callers can't
 * spoof either. The headers are stripped so the secret never reaches logs.
 */
export function internalCaller(req: Request, res: Response, next: NextFunction) {
  const provided = req.get(INTERNAL_KEY_HEADER);
  const clientIp = req.get(CLIENT_IP_HEADER)?.trim();
  delete req.headers[INTERNAL_KEY_HEADER];
  delete req.headers[CLIENT_IP_HEADER];

  if (matchesInternalSecret(provided)) {
    if (clientIp && net.isIP(clientIp)) {
      Object.defineProperty(req, "ip", { value: clientIp, configurable: true, enumerable: true });
    } else {
      res.locals.internalService = true;
    }
  }
  next();
}

export function isInternalServiceCall(res: Response): boolean {
  return res.locals.internalService === true;
}
