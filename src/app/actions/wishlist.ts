"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth/session";
import { getProductsByIds } from "@/lib/catalog/repository";
import type { ProductSummary } from "@/lib/catalog/summary";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

const idsSchema = z.array(z.uuid()).max(100);

/**
 * Called once after sign-in: saves the guest's hearts to the account and
 * returns the account's full wishlist. Anonymous callers get `ok: false`.
 */
export async function syncWishlist(localIds: unknown): Promise<{ ok: true; items: ProductSummary[] } | { ok: false }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };
  const parsed = idsSchema.safeParse(localIds);
  const supabase = await createClient();

  if (parsed.success && parsed.data.length) {
    const live = await getProductsByIds(parsed.data);
    if (live.length) {
      await supabase
        .from("wishlist_items")
        .upsert(live.map((p) => ({ user_id: user.id, product_id: p.id })), { onConflict: "user_id,product_id", ignoreDuplicates: true });
    }
  }

  const { data, error } = await supabase.from("wishlist_items").select("product_id, created_at").order("created_at", { ascending: false });
  if (error) return { ok: false };
  const summaries = await getProductsByIds(data.map((r) => r.product_id));
  const order = new Map(data.map((r, i) => [r.product_id, i]));
  return { ok: true, items: summaries.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)) };
}

const toggleSchema = z.object({ productId: z.uuid(), saved: z.boolean() });

export async function setWishlisted(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const limit = await rateLimit(clientKey(await headers(), `wishlist:${user.id}`), 120, 60_000);
  if (!limit.ok) return { ok: false, error: "Slow down a little — try again in a moment." };
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const supabase = await createClient();
  const { error } = parsed.data.saved
    ? await supabase.from("wishlist_items").upsert({ user_id: user.id, product_id: parsed.data.productId }, { onConflict: "user_id,product_id", ignoreDuplicates: true })
    : await supabase.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", parsed.data.productId);
  if (error) {
    return { ok: false, error: error.message.includes("wishlist_limit") ? "Your wishlist is full (100 items)." : "We couldn't update your wishlist." };
  }
  return { ok: true };
}

export async function clearWishlist(): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("wishlist_items").delete().eq("user_id", user.id);
  return { ok: !error };
}
