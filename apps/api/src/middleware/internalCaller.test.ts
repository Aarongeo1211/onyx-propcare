import http from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const SECRET = "s".repeat(48);
process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
process.env.JWT_SECRET = "x".repeat(32);
process.env.CSRF_SECRET = "y".repeat(32);
process.env.INTERNAL_API_SECRET = SECRET;

// redisClient: null makes the rate limiters fall back to their in-memory store.
vi.mock("../lib/redis", () => ({ redisClient: null, cache: { del: vi.fn() } }));

let server: http.Server;
let base: string;

beforeAll(async () => {
  const { internalCaller } = await import("./internalCaller");
  const { generalLimiter, authLimiter } = await import("./rateLimit");
  const app = express();
  app.set("trust proxy", 1);
  app.use(internalCaller);
  app.use(generalLimiter);
  const echo: express.RequestHandler = (req, res) =>
    res.json({ ip: req.ip, key: req.headers["x-internal-key"] ?? null, clientIp: req.headers["x-client-ip"] ?? null });
  app.get("/properties", echo);
  app.post("/auth/login", authLimiter, echo);
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => server?.close());

async function call(path: string, headers: Record<string, string> = {}, method = "GET") {
  const res = await fetch(`${base}${path}`, { method, headers });
  return { res, body: (await res.json()) as { ip: string; key: string | null; clientIp: string | null } };
}

describe("internalCaller", () => {
  it("attributes a web-server call to the forwarded visitor IP and strips the headers", async () => {
    const { body } = await call("/properties", { "x-internal-key": SECRET, "x-client-ip": "203.0.113.7" });
    expect(body.ip).toBe("203.0.113.7");
    expect(body.key).toBeNull();
    expect(body.clientIp).toBeNull();
  });

  it("ignores a spoofed client IP without the secret, and still strips it", async () => {
    const wrong = await call("/properties", { "x-internal-key": "nope".padEnd(48, "!"), "x-client-ip": "203.0.113.8" });
    expect(wrong.body.ip).not.toBe("203.0.113.8");
    expect(wrong.body.clientIp).toBeNull();
    const none = await call("/properties", { "x-client-ip": "203.0.113.9" });
    expect(none.body.ip).not.toBe("203.0.113.9");
  });

  it("does not count the web server's own renders against the general limit", async () => {
    const { res } = await call("/properties", { "x-internal-key": SECRET });
    expect(res.status).toBe(200);
    expect(res.headers.get("ratelimit-policy")).toBeNull();
  });

  it("gives each forwarded visitor their own login quota instead of one shared bucket", async () => {
    const login = (ip: string) => call("/auth/login", { "x-internal-key": SECRET, "x-client-ip": ip }, "POST");
    const first = await login("198.51.100.1");
    const limit = Number(first.res.headers.get("ratelimit-limit"));
    for (let i = 1; i < limit; i++) await login("198.51.100.1");
    expect((await login("198.51.100.1")).res.status).toBe(429);
    // A different visitor through the same web server is unaffected.
    const other = await login("198.51.100.2");
    expect(other.res.status).toBe(200);
    expect(Number(other.res.headers.get("ratelimit-remaining"))).toBe(limit - 1);
  });

  it("keeps the login limit for internal calls with no visitor IP", async () => {
    const { res } = await call("/auth/login", { "x-internal-key": SECRET }, "POST");
    expect(res.headers.get("ratelimit-policy")).not.toBeNull();
  });
});
