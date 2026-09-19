import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Minimal env so config/env.ts validates; storage.ts reads the AWS_* vars at
// import time, so bucket mode points at the fake S3 server started below.
process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
process.env.JWT_SECRET = "x".repeat(32);
process.env.CSRF_SECRET = "y".repeat(32);
process.env.AWS_ACCESS_KEY_ID = "test-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
process.env.AWS_S3_BUCKET_NAME = "test-bucket";
process.env.AWS_URL_STYLE = "path";
delete process.env.REDIS_URL;

vi.mock("@onyx/db", () => ({ prisma: {} }));
// redisClient: null makes the rate limiters fall back to their in-memory store.
vi.mock("../lib/redis", () => ({ cache: { del: vi.fn() }, redisClient: null }));
vi.mock("../middleware/auth", () => ({
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as any).user = { id: "user-1", role: "SELLER" };
    next();
  },
  optionalAuth: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  requireRole: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

// multer's disk storage names spool files with 32 random hex chars.
function multerTempFiles() {
  return fs.readdirSync(os.tmpdir()).filter((f) => /^[0-9a-f]{32}$/.test(f));
}

// A stream Body makes the SDK send `aws-chunked` framing with a trailing
// checksum ("<hex-size>\r\n<data>\r\n ... 0\r\n<trailer>\r\n\r\n").
function decodeAwsChunked(raw: Buffer) {
  const out: Buffer[] = [];
  let i = 0;
  while (i < raw.length) {
    const lineEnd = raw.indexOf("\r\n", i);
    const size = parseInt(raw.subarray(i, lineEnd).toString().split(";")[0], 16);
    if (!size) break;
    out.push(raw.subarray(lineEnd + 2, lineEnd + 2 + size));
    i = lineEnd + 2 + size + 2;
  }
  return Buffer.concat(out);
}

type PutRecord = { path: string; contentLength: string | undefined; body: Buffer };
const puts: PutRecord[] = [];
let s3: http.Server;
let api: http.Server;
let apiUrl: string;
let limitedApi: http.Server;
let limitedUrl: string;
const MEDIA_BYTES = Buffer.from("fake-jpeg-bytes");

beforeAll(async () => {
  s3 = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      if (req.method === "PUT") {
        const raw = Buffer.concat(chunks);
        const chunked = req.headers["content-encoding"] === "aws-chunked";
        puts.push({
          path: req.url ?? "",
          contentLength: (req.headers["x-amz-decoded-content-length"] ?? req.headers["content-length"]) as string | undefined,
          body: chunked ? decodeAwsChunked(raw) : raw,
        });
      }
      if (req.method === "GET") {
        res.writeHead(200, { ETag: '"etag"', "Content-Type": "image/jpeg", "Content-Length": String(MEDIA_BYTES.length) });
        res.end(MEDIA_BYTES);
        return;
      }
      res.writeHead(200, { ETag: '"etag"' });
      res.end();
    });
  });
  await new Promise<void>((r) => s3.listen(0, "127.0.0.1", r));
  process.env.AWS_ENDPOINT_URL = `http://127.0.0.1:${(s3.address() as AddressInfo).port}`;

  const { uploadRoutes } = await import("./upload");
  const app = express();
  app.use("/upload", uploadRoutes);
  api = app.listen(0, "127.0.0.1");
  await new Promise((r) => api.once("listening", r));
  apiUrl = `http://127.0.0.1:${(api.address() as AddressInfo).port}`;

  // Limiters stacked exactly as in src/index.ts; /ping stands in for any
  // ordinary API route so generalLimiter's remaining quota can be read back.
  const { generalLimiter, mediaReadLimiter, uploadLimiter } = await import("../middleware/rateLimit");
  const limitedApp = express();
  limitedApp.use(generalLimiter);
  limitedApp.use(mediaReadLimiter);
  limitedApp.get("/api/v1/ping", (_req, res) => res.json({ ok: true }));
  limitedApp.use("/api/v1/upload", uploadLimiter, uploadRoutes);
  limitedApi = limitedApp.listen(0, "127.0.0.1");
  await new Promise((r) => limitedApi.once("listening", r));
  limitedUrl = `http://127.0.0.1:${(limitedApi.address() as AddressInfo).port}/api/v1/upload`;
});

afterAll(() => {
  s3?.close();
  api?.close();
  limitedApi?.close();
});

describe("POST /upload/images (disk-spooled)", () => {
  it("streams each file to the bucket byte-for-byte and removes the temp files", async () => {
    const storage = await import("../lib/storage");
    expect(storage.storageMode).toBe("railway-bucket");

    const before = multerTempFiles();

    const a = Buffer.alloc(3 * 1024 * 1024, 0xab);
    const b = Buffer.from("small-png-bytes");
    const form = new FormData();
    form.append("images", new Blob([a], { type: "image/jpeg" }), "a.jpg");
    form.append("images", new Blob([b], { type: "image/png" }), "b.png");

    const res = await fetch(`${apiUrl}/upload/images`, { method: "POST", body: form });
    const json = (await res.json()) as { success: boolean; data: { url: string; size: number }[] };

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].url).toContain("/api/v1/upload/files/onyx-propcare%2Fproperties%2F");

    const bySize = [...puts].sort((x, y) => y.body.length - x.body.length);
    expect(bySize[0].body.equals(a)).toBe(true);
    expect(bySize[0].contentLength).toBe(String(a.length));
    expect(bySize[1].body.equals(b)).toBe(true);

    // Spooled temp files are deleted once the response has gone out.
    await new Promise((r) => setTimeout(r, 100));
    expect(multerTempFiles().filter((f) => !before.includes(f))).toEqual([]);
  });

  it("rejects unsupported types without leaving temp files behind", async () => {
    const before = multerTempFiles();
    const form = new FormData();
    form.append("images", new Blob([Buffer.alloc(1024 * 1024, 1)], { type: "image/jpeg" }), "ok.jpg");
    form.append("images", new Blob([Buffer.from("x")], { type: "application/zip" }), "a.zip");
    const res = await fetch(`${apiUrl}/upload/images`, { method: "POST", body: form });
    expect(res.status).toBeGreaterThanOrEqual(400);
    await new Promise((r) => setTimeout(r, 100));
    expect(multerTempFiles().filter((f) => !before.includes(f))).toEqual([]);
  });
});

describe("uploadLimiter on /api/v1/upload", () => {
  // Cap is 60 in production, 100 elsewhere; read it back rather than hard-coding.
  async function postEmptyImages() {
    return fetch(`${limitedUrl}/images`, { method: "POST" });
  }

  async function generalRemaining() {
    const res = await fetch(limitedUrl.replace("/upload", "/ping"));
    return Number(res.headers.get("ratelimit-remaining"));
  }

  it("counts GET /files/* media reads only against the media read limiter", async () => {
    const generalBefore = await generalRemaining();
    const key = encodeURIComponent("onyx-propcare/properties/photo.jpg");
    for (let i = 0; i < 130; i++) {
      const res = await fetch(`${limitedUrl}/files/${key}`);
      expect(res.status).toBe(200);
      expect(Buffer.from(await res.arrayBuffer()).equals(MEDIA_BYTES)).toBe(true);
      expect(res.headers.get("ratelimit-policy")).toBe("3000;w=900");
      expect(res.headers.get("ratelimit-remaining")).toBe(String(3000 - 1 - i));
    }
    // Only the second /ping itself was counted by generalLimiter.
    expect(await generalRemaining()).toBe(generalBefore - 1);
  });

  it("still throttles POST /images once the upload quota is used up", async () => {
    const first = await postEmptyImages();
    const limit = Number(first.headers.get("ratelimit-limit"));
    expect(limit).toBeGreaterThan(0);
    expect(limit).toBeLessThan(130);

    // The 130 GETs above must not have eaten into the quota.
    expect(Number(first.headers.get("ratelimit-remaining"))).toBe(limit - 1);

    for (let i = 1; i < limit; i++) {
      expect((await postEmptyImages()).status).not.toBe(429);
    }
    expect((await postEmptyImages()).status).toBe(429);
  });
});
