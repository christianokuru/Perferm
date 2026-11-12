"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { getViewer } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { reviewSchema } from "@/lib/validation/schemas";

export type ReviewEligibility = { state: "anonymous" } | { state: "eligible" } | { state: "not_purchased" } | { state: "reviewed"; status: "pending" | "approved" | "rejected" };

/** Whether the signed-in customer may review this product (delivered order, no existing review). */
export async function getReviewEligibility(productId: unknown): Promise<ReviewEligibility> {
  const parsed = z.uuid().safeParse(productId);
  const viewer = await getViewer();
  if (!viewer) return { state: "anonymous" };
  if (!parsed.success) return { state: "not_purchased" };

  const supabase = await createClient();
  const [{ data: existing }, { data: purchased }] = await Promise.all([
    supabase.from("reviews").select("status").eq("product_id", parsed.data).eq("user_id", viewer.id).maybeSingle(),
    supabase
      .from("order_items")
      .select("id, orders!inner(status, user_id)")
      .eq("product_id", parsed.data)
      .eq("orders.user_id", viewer.id)
      .eq("orders.status", "delivered")
      .limit(1),
  ]);
  if (existing) return { state: "reviewed", status: existing.status };
  return purchased?.length ? { state: "eligible" } : { state: "not_purchased" };
}

/** "Adaeze Okafor" → "Adaeze O." — reviews never publish a customer's full name. */
function displayName(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first || "Perferm client";
}

export async function submitReview(input: unknown): Promise<{ ok: true } | { ok: false; error?: string; fieldErrors?: FieldErrors }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please sign in to write a review." };
  const limit = await rateLimit(clientKey(await headers(), `review:${viewer.id}`), 5, 60 * 60_000);
  if (!limit.ok) return { ok: false, error: "You've submitted a few reviews already — please try again later." };

  const parsed = validate(reviewSchema, input);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
  const { productId, rating, title, body, city } = parsed.data;

  const supabase = await createClient();
  // RLS only lets customers with a delivered order insert; a trigger forces `pending` + verified flag.
  const { error } = await supabase.from("reviews").insert({
    product_id: productId,
    author_name: displayName(viewer.name || "Perferm client"),
    city: city || null,
    rating,
    title,
    body,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "You've already reviewed this fragrance." };
    if (error.code === "42501") return { ok: false, error: "Only clients who've received this fragrance can review it." };
    console.error("[reviews] insert failed", error);
    return { ok: false, error: "We couldn't submit your review. Please try again." };
  }
  return { ok: true };
}
