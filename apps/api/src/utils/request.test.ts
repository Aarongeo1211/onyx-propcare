import { describe, it, expect } from "vitest";
import { getSingleQueryParam, getQueryNumber } from "./request";

describe("getSingleQueryParam", () => {
  it("returns string value trimmed", () => {
    expect(getSingleQueryParam("  hello  ")).toBe("hello");
  });

  it("returns undefined for empty string", () => {
    expect(getSingleQueryParam("")).toBeUndefined();
    expect(getSingleQueryParam("   ")).toBeUndefined();
  });

  it("returns first non-empty string from array", () => {
    expect(getSingleQueryParam(["", "foo", "bar"])).toBe("foo");
  });

  it("returns undefined for empty array", () => {
    expect(getSingleQueryParam([])).toBeUndefined();
  });

  it("returns undefined for non-string values", () => {
    expect(getSingleQueryParam(undefined)).toBeUndefined();
    expect(getSingleQueryParam(null)).toBeUndefined();
    expect(getSingleQueryParam(123)).toBeUndefined();
  });
});

describe("getQueryNumber", () => {
  it("parses valid number string", () => {
    expect(getQueryNumber("42", 1)).toBe(42);
  });

  it("returns fallback for non-numeric string", () => {
    expect(getQueryNumber("abc", 10)).toBe(10);
  });

  it("returns fallback for undefined", () => {
    expect(getQueryNumber(undefined, 5)).toBe(5);
  });

  it("handles zero", () => {
    expect(getQueryNumber("0", 99)).toBe(0);
  });

  it("handles negative numbers", () => {
    expect(getQueryNumber("-3", 1)).toBe(-3);
  });
});
