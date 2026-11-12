import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";
import type { Collection, DeliveryZone, Product, Review } from "@/lib/types";

import { matchesQuery } from "./filters";
import { mapCollection, mapProduct, mapReview, PRODUCT_SELECT } from "./mappers";
import { toSummary, type ProductSummary } from "./summary";

/**
 * Public catalogue reads. Everything is cached and tagged; admin mutations
 * call `updateTag()` so edits appear immediately. Checkout never reads from
 * here — it re-prices against the live database (see lib/checkout/pricing).
 */

export const CACHE_TAGS = {
  catalog: "catalog",
  collections: "collections",
  reviews: "reviews",
  zones: "delivery-zones",
  settings: "store-settings",
} as const;

const CATALOG_LIFE = { stale: 300, revalidate: 900, expire: 86_400 };

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife(CATALOG_LIFE);
  cacheTag(CACHE_TAGS.catalog);
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data ?? []).map(mapProduct).filter((p) => p.variants.length > 0 && p.images.length > 0);
}

export async function getProductSummaries(): Promise<ProductSummary[]> {
  return (await getProducts()).map(toSummary);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getProductsByIds(ids: string[]): Promise<ProductSummary[]> {
  const wanted = new Set(ids);
  return (await getProductSummaries()).filter((p) => wanted.has(p.id));
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheLife(CATALOG_LIFE);
  cacheTag(CACHE_TAGS.collections);
  const { data, error } = await createPublicClient().from("collections").select("*").order("position");
  if (error) throw new Error(`Failed to load collections: ${error.message}`);
  return (data ?? []).map(mapCollection);
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  return (await getCollections()).find((c) => c.slug === slug) ?? null;
}

export async function getCollectionSlugs(): Promise<string[]> {
  return (await getCollections()).map((c) => c.slug);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<ProductSummary[]> {
  const products = await getProducts();
  return products
    .filter((p) => p.id !== product.id)
    .map((p) => ({
      p,
      score:
        p.collections.filter((c) => product.collections.includes(c)).length * 2 +
        p.families.filter((f) => product.families.includes(f)).length +
        (p.gender === product.gender ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating)
    .slice(0, limit)
    .map(({ p }) => toSummary(p));
}

export async function getHomeSelections() {
  const summaries = await getProductSummaries();
  const bestsellers = summaries.filter((p) => p.isBestseller);
  return {
    bestsellers: (bestsellers.length ? bestsellers : summaries).slice(0, 4),
    newArrivals: [...summaries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    arabian: summaries.filter((p) => p.collections.includes("arabian")).slice(0, 4),
    spotlight: summaries.find((p) => p.slug === "oud-al-layl") ?? summaries.find((p) => p.collections.includes("oud")) ?? summaries[0] ?? null,
  };
}

export async function searchProducts(query: string, limit = 6): Promise<ProductSummary[]> {
  const trimmed = query.trim().slice(0, 80);
  if (!trimmed) return [];
  return (await getProductSummaries()).filter((p) => matchesQuery(p, trimmed)).slice(0, limit);
}

export async function getProductReviews(productId: string, limit = 6): Promise<Review[]> {
  "use cache";
  cacheLife(CATALOG_LIFE);
  cacheTag(CACHE_TAGS.reviews);
  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("id, author_name, city, rating, title, body, created_at, verified_purchase")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load reviews: ${error.message}`);
  return (data ?? []).map(mapReview);
}

/** Recent five-star reviews for the home page. */
export async function getTestimonials(limit = 6): Promise<Review[]> {
  "use cache";
  cacheLife(CATALOG_LIFE);
  cacheTag(CACHE_TAGS.reviews);
  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("id, author_name, city, rating, title, body, created_at, verified_purchase")
    .eq("status", "approved")
    .eq("rating", 5)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw new Error(`Failed to load testimonials: ${error.message}`);
  // De-duplicate by author so the carousel doesn't repeat the same voice.
  const seen = new Set<string>();
  return (data ?? [])
    .filter((r) => (seen.has(r.author_name) ? false : (seen.add(r.author_name), true)))
    .slice(0, limit)
    .map(mapReview);
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  "use cache";
  cacheLife(CATALOG_LIFE);
  cacheTag(CACHE_TAGS.zones);
  const { data, error } = await createPublicClient().from("delivery_zones").select("state, fee_kobo, eta, is_active").order("state");
  if (error) throw new Error(`Failed to load delivery zones: ${error.message}`);
  return (data ?? []).filter((z) => z.is_active).map((z) => ({ state: z.state, fee: z.fee_kobo, eta: z.eta }));
}

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  announcement: string;
  pickupEnabled: boolean;
  pickupAddress: string;
  pickupHours: string;
  paystackEnabled: boolean;
  flutterwaveEnabled: boolean;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheLife(CATALOG_LIFE);
  cacheTag(CACHE_TAGS.settings);
  const { data, error } = await createPublicClient().from("store_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(`Failed to load store settings: ${error.message}`);
  return {
    storeName: data.store_name,
    supportEmail: data.support_email,
    supportPhone: data.support_phone,
    announcement: data.announcement,
    pickupEnabled: data.pickup_enabled,
    pickupAddress: data.pickup_address,
    pickupHours: data.pickup_hours,
    paystackEnabled: data.paystack_enabled,
    flutterwaveEnabled: data.flutterwave_enabled,
  };
}
