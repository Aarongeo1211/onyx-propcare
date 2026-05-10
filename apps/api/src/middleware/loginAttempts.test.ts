import { describe, it, expect, vi, beforeEach } from "vitest";
import { isLocked, recordFailure, clearFailures } from "./loginAttempts";

beforeEach(() => {
  clearFailures("test@example.com");
});

describe("loginAttempts", () => {
  it("not locked initially", () => {
    expect(isLocked("test@example.com")).toEqual({ locked: false });
  });

  it("not locked after fewer than 5 failures", () => {
    for (let i = 0; i < 4; i++) {
      recordFailure("test@example.com");
    }
    expect(isLocked("test@example.com")).toEqual({ locked: false });
  });

  it("locked after 5 failures", () => {
    for (let i = 0; i < 5; i++) {
      recordFailure("test@example.com");
    }
    const result = isLocked("test@example.com");
    expect(result.locked).toBe(true);
    expect(result.retryAfterSec).toBeGreaterThan(0);
  });

  it("case-insensitive email", () => {
    for (let i = 0; i < 5; i++) {
      recordFailure("Test@Example.COM");
    }
    expect(isLocked("test@example.com").locked).toBe(true);
  });

  it("clearFailures resets lockout", () => {
    for (let i = 0; i < 5; i++) {
      recordFailure("test@example.com");
    }
    expect(isLocked("test@example.com").locked).toBe(true);
    clearFailures("test@example.com");
    expect(isLocked("test@example.com").locked).toBe(false);
  });

  it("unlocks after window expires", () => {
    for (let i = 0; i < 5; i++) {
      recordFailure("test@example.com");
    }
    expect(isLocked("test@example.com").locked).toBe(true);

    vi.useFakeTimers();
    vi.advanceTimersByTime(16 * 60 * 1000);
    expect(isLocked("test@example.com").locked).toBe(false);
    vi.useRealTimers();
  });
});
