import { env, isProd } from "./config/env";
import express from "express";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import { propertyRoutes } from "./routes/properties";
import { userRoutes } from "./routes/users";
import { inquiryRoutes } from "./routes/inquiries";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { planRoutes } from "./routes/plans";
import { subscriptionRoutes } from "./routes/subscriptions";
import { favoriteRoutes } from "./routes/favorites";
import { uploadRoutes } from "./routes/upload";
import { contactRoutes } from "./routes/contact";
import { callbackRoutes } from "./routes/callbacks";
import { auditRoutes } from "./routes/audit";
import { refundRoutes } from "./routes/refunds";
import { locationRoutes } from "./routes/location";
import { generalLimiter, authLimiter, registerLimiter, uploadLimiter, forgotPasswordLimiter } from "./middleware/rateLimit";
import { sanitizeInputs } from "./middleware/sanitize";
import {
  doubleCsrfProtection,
  generateCsrfToken,
  invalidCsrfTokenError,
} from "./middleware/csrf";
import { optionalAuth } from "./middleware/auth";
import { configureBucketCors } from "./lib/storage";

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith(path.join("apps", "api")) ? path.resolve(cwd, "..", "..") : cwd;
}

function getUploadRoot() {
  if (!env.UPLOAD_DIR) {
    return path.join(getWorkspaceRoot(), "uploads");
  }

  return path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.join(getWorkspaceRoot(), env.UPLOAD_DIR);
}

const app = express();

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3100",
  "http://localhost:3101",
];
const configuredOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(/[\s,]+/).map((o) => o.trim()).filter(Boolean)
  : defaultAllowedOrigins;

app.set("trust proxy", 1);
app.use(generalLimiter);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (configuredOrigins.includes(origin)) return callback(null, true);
      if (!isProd && /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(pinoHttp({ logger }));
app.use(cookieParser(env.CSRF_SECRET));

// Razorpay webhook needs raw body — mount BEFORE express.json so it isn't parsed
app.use("/api/v1/subscriptions/webhook", subscriptionRoutes);

app.use(express.json({ limit: "10mb" }));
app.use(sanitizeInputs);
app.use("/uploads", express.static(getUploadRoot()));

// Health check (no auth)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// CSRF token issuance — caller must be authenticated (or anonymous via session id)
app.get("/api/v1/csrf-token", optionalAuth, (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ success: true, data: { csrfToken: token } });
});

// CSRF protection currently OFF: API auth uses Bearer tokens (not cookies),
// so cross-origin requests can't forge the Authorization header. CORS allowlist
// is the primary defense. Re-enable doubleCsrfProtection if/when moving to
// cookie-based auth.
void doubleCsrfProtection;

// API routes
app.use("/api/v1/auth/register", registerLimiter);
app.use("/api/v1/auth/forgot-password", forgotPasswordLimiter);
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/properties", propertyRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/inquiries", inquiryRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/plans", planRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/favorites", favoriteRoutes);
app.use("/api/v1/upload", uploadLimiter, uploadRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/callbacks", callbackRoutes);
app.use("/api/v1/refunds", refundRoutes);
app.use("/api/v1/location", locationRoutes);
app.use("/api/v1/admin/audit-logs", auditRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    if (err === invalidCsrfTokenError || err.message === "invalid csrf token") {
      return res.status(403).json({ success: false, error: "Invalid CSRF token" });
    }
    logger.error({ err }, "Unhandled error");
    res.status(500).json({ success: false, error: "Internal server error" });
  }
);

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "API server started");

  // Configure bucket CORS so browsers can PUT files directly via presigned URLs.
  // Runs asynchronously — startup is not blocked if this fails.
  const corsOrigins = configuredOrigins.length > 0 ? configuredOrigins : ["*"];
  configureBucketCors(corsOrigins).catch(() => {/* already logged inside */});
});

export default app;
