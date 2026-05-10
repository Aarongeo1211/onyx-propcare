import { doubleCsrf } from "csrf-csrf";
import type { Request } from "express";
import { env, isProd } from "../config/env";

const {
  doubleCsrfProtection,
  generateCsrfToken,
  invalidCsrfTokenError,
} = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  getSessionIdentifier: (req: Request) => {
    return req.user?.id || req.ip || "anonymous";
  },
  cookieName: isProd ? "__Host-onyx.csrf" : "onyx.csrf",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
  },
  size: 32,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req) =>
    (req.headers["x-csrf-token"] as string) || (req.body && req.body._csrf),
});

export { doubleCsrfProtection, generateCsrfToken, invalidCsrfTokenError };
