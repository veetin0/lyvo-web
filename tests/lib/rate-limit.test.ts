import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const clientWith = (result: { data?: unknown; error?: unknown } | Error) => {
  const rpc = vi.fn(() =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result)
  );
  return { client: { rpc } as unknown as SupabaseClient, rpc };
};

describe("checkRateLimit", () => {
  it("passes the bucket through to the database", async () => {
    const { client, rpc } = clientWith({
      data: [{ allowed: true, remaining: 4, retry_after_seconds: 900 }],
      error: null,
    });

    const verdict = await checkRateLimit(client, {
      key: "login:email:a@b.c",
      limit: 5,
      windowSeconds: 900,
    });

    expect(verdict).toEqual({ allowed: true, remaining: 4, retryAfterSeconds: 900 });
    expect(rpc).toHaveBeenCalledWith("check_rate_limit", {
      p_key: "login:email:a@b.c",
      p_limit: 5,
      p_window_seconds: 900,
    });
  });

  it("refuses when the database says the window is spent", async () => {
    const { client } = clientWith({
      data: [{ allowed: false, remaining: 0, retry_after_seconds: 240 }],
      error: null,
    });

    expect(await checkRateLimit(client, { key: "k", limit: 1, windowSeconds: 60 })).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 240,
    });
  });

  it("accepts a bare object as well as a single-row array", async () => {
    const { client } = clientWith({
      data: { allowed: true, remaining: 2, retry_after_seconds: 30 },
      error: null,
    });

    expect((await checkRateLimit(client, { key: "k", limit: 3, windowSeconds: 60 })).allowed).toBe(true);
  });

  it("fails open when the query errors", async () => {
    // A limiter that cannot reach its store must not lock everyone out.
    const { client } = clientWith({ data: null, error: { message: "connection refused" } });

    expect(await checkRateLimit(client, { key: "k", limit: 1, windowSeconds: 60 })).toEqual({
      allowed: true,
      remaining: 0,
      retryAfterSeconds: 0,
    });
  });

  it("fails open when the call throws", async () => {
    const { client } = clientWith(new Error("boom"));
    expect((await checkRateLimit(client, { key: "k", limit: 1, windowSeconds: 60 })).allowed).toBe(true);
  });

  it("fails open on an unrecognisable response", async () => {
    const { client } = clientWith({ data: [{ nonsense: true }], error: null });
    expect((await checkRateLimit(client, { key: "k", limit: 1, windowSeconds: 60 })).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("takes the leftmost forwarded address", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 70.41.3.18, 150.172.238.178" });
    expect(clientIp(headers)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
  });

  it("reads plain objects, as NextAuth supplies", () => {
    expect(clientIp({ "x-forwarded-for": "203.0.113.9" })).toBe("203.0.113.9");
    expect(clientIp({ "x-forwarded-for": ["203.0.113.10", "10.0.0.1"] })).toBe("203.0.113.10");
  });

  it("degrades to a constant rather than throwing", () => {
    // Everyone then shares one bucket, which is safe, if blunt.
    expect(clientIp(new Headers())).toBe("unknown");
    expect(clientIp({})).toBe("unknown");
  });
});
