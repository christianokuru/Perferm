import "server-only";

import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Shared fixed-window rate limiter backed by Postgres, so limits hold across
 * every serverless instance. Keys are hashed — raw IPs are never stored.
 * Fails open (allows the request) if the database is unreachable, so an
 * outage never locks customers out of checkout.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean }> {
  try {
    const bucket = createHash("sha256").update(key).digest("hex");
    const { data, error } = await createAdminClient().rpc("rate_limit_hit", {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: Math.max(1, Math.round(windowMs / 1000)),
    });
    if (error) throw error;
    return { ok: data !== false };
  } catch (error) {
    console.error("[rate-limit] check failed, allowing request", error);
    return { ok: true };
  }
}

/** Identifies the caller by IP (Vercel sets x-forwarded-for / x-real-ip). */
export function clientKey(headers: Headers, scope: string): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${scope}:${headers.get("x-real-ip") || forwarded || "anonymous"}`;
}
