import { describe, it, expect, vi, beforeEach } from "vitest";
import { isLocked, recordFailure, clearFailures } from "./loginAttempts";

beforeEach(async () => {
  await clearFailures("test@example.com");
});

describe("loginAttempts", () => {
  it("not locked initially", async () => {
    expect(await isLocked("test@example.com")).toEqual({ locked: false });
  });

  it("not locked after fewer than 5 failures", async () => {
    for (let i = 0; i < 4; i++) {
      await recordFailure("test@example.com");
    }
    expect(await isLocked("test@example.com")).toEqual({ locked: false });
  });

  it("locked after 5 failures", async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailure("test@example.com");
    }
    const result = await isLocked("test@example.com");
    expect(result.locked).toBe(true);
    expect(result.retryAfterSec).toBeGreaterThan(0);
  });

  it("case-insensitive email", async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailure("Test@Example.COM");
    }
    expect((await isLocked("test@example.com")).locked).toBe(true);
  });

  it("clearFailures resets lockout", async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailure("test@example.com");
    }
    expect((await isLocked("test@example.com")).locked).toBe(true);
    await clearFailures("test@example.com");
    expect((await isLocked("test@example.com")).locked).toBe(false);
  });

  it("unlocks after window expires", async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailure("test@example.com");
    }
    expect((await isLocked("test@example.com")).locked).toBe(true);

    vi.useFakeTimers();
    vi.advanceTimersByTime(16 * 60 * 1000);
    expect((await isLocked("test@example.com")).locked).toBe(false);
    vi.useRealTimers();
  });
});
