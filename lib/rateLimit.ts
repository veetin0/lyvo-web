import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Request throttling for the unauthenticated endpoints.
 *
 * The counter lives in Postgres, not in process memory: Vercel runs each
 * request on whichever instance happens to be warm, so an in-memory limiter
 * would be per-instance and bypassed by concurrency while still looking like a
 * limit. Counting and deciding happen inside one SQL statement, so two
 * simultaneous attempts cannot both read the same count and both pass.
 *
 * This fails open. If the database is unreachable the limiter yields rather
 * than locking every user out of signing in — throttling protects against
 * abuse, and must not become an outage of its own.
 */

export interface RateLimitVerdict {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimitOptions {
  /** Distinct bucket, e.g. "login:ip:1.2.3.4". */
  key: string;
  limit: number;
  windowSeconds: number;
}

const ALLOWED_ON_ERROR: RateLimitVerdict = {
  allowed: true,
  remaining: 0,
  retryAfterSeconds: 0,
};

export const checkRateLimit = async (
  supabase: SupabaseClient,
  { key, limit, windowSeconds }: RateLimitOptions
): Promise<RateLimitVerdict> => {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("Rate limit check failed:", error);
      return ALLOWED_ON_ERROR;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.allowed !== "boolean") {
      return ALLOWED_ON_ERROR;
    }

    return {
      allowed: row.allowed,
      remaining: Number(row.remaining) || 0,
      retryAfterSeconds: Number(row.retry_after_seconds) || 0,
    };
  } catch (error) {
    console.error("Rate limit check threw:", error);
    return ALLOWED_ON_ERROR;
  }
};

/**
 * Best-effort client address.
 *
 * x-forwarded-for is set by Vercel's proxy and is the leftmost entry. It can be
 * spoofed when the app is reached without a trusted proxy in front, so this is
 * a speed bump for casual abuse rather than an identity.
 */
export const clientIp = (headers: Headers | Record<string, string | string[] | undefined>): string => {
  const read = (name: string): string | null => {
    if (typeof (headers as Headers).get === "function") {
      return (headers as Headers).get(name);
    }
    const value = (headers as Record<string, string | string[] | undefined>)[name];
    return Array.isArray(value) ? value[0] ?? null : value ?? null;
  };

  const forwarded = read("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return read("x-real-ip")?.trim() || "unknown";
};
