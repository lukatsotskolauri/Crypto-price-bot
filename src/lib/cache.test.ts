import { describe, it, expect, vi, afterEach } from "vitest";
import { TTLCache } from "./cache.js";

describe("TTLCache", () => {
  afterEach(() => vi.useRealTimers());

  it("returns undefined for a key that was never set", () => {
    const cache = new TTLCache<string>(60);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("returns the stored value", () => {
    const cache = new TTLCache<string>(60);
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");
  });

  it("distinguishes null (cached not-found) from undefined (not cached)", () => {
    const cache = new TTLCache<string | null>(60);
    cache.set("key", null);
    expect(cache.get("key")).toBeNull();
    expect(cache.get("other")).toBeUndefined();
  });

  it("evicts an entry after the TTL expires", () => {
    vi.useFakeTimers();
    const cache = new TTLCache<string>(1); // 1-second TTL
    cache.set("key", "value");
    vi.advanceTimersByTime(1001);
    expect(cache.get("key")).toBeUndefined();
  });

  it("keeps an entry alive before the TTL expires", () => {
    vi.useFakeTimers();
    const cache = new TTLCache<string>(1);
    cache.set("key", "value");
    vi.advanceTimersByTime(999);
    expect(cache.get("key")).toBe("value");
  });

  it("overwrites an existing entry", () => {
    const cache = new TTLCache<string>(60);
    cache.set("key", "first");
    cache.set("key", "second");
    expect(cache.get("key")).toBe("second");
  });
});
