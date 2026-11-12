import "server-only";

/**
 * Best-effort in-memory sliding window limiter for route handlers and server
 * actions. Per-instance only — swap for Upstash/Redis when deployed at scale.
 */
const buckets = new Map<string, number[]>();
const MAX_KEYS = 5_000;

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  if (buckets.size > MAX_KEYS) buckets.delete(buckets.keys().next().value as string);
  buckets.set(key, hits);
  return { ok: true, retryAfter: 0 };
}

export function clientKey(headers: Headers, scope: string): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${scope}:${forwarded || headers.get("x-real-ip") || "anonymous"}`;
}
