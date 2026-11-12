import "server-only";

import { cacheLife } from "next/cache";

import { collections } from "@/lib/data/collections";
import { products } from "@/lib/data/products";
import type { Collection, Product } from "@/lib/types";

import { matchesQuery } from "./filters";
import { toSummary, type ProductSummary } from "./summary";

/**
 * Catalogue data access. Every page reads through these functions, so moving
 * the catalogue to Supabase later only means changing this file.
 */

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  return products;
}

export async function getProductSummaries(): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  return products.map(toSummary);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("hours");
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheLife("days");
  return collections;
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  "use cache";
  cacheLife("days");
  return collections.find((c) => c.slug === slug) ?? null;
}

export async function getCollectionSlugs(): Promise<string[]> {
  return collections.map((c) => c.slug);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  const scored = products
    .filter((p) => p.id !== product.id)
    .map((p) => ({
      p,
      score:
        p.collections.filter((c) => product.collections.includes(c)).length * 2 +
        p.families.filter((f) => product.families.includes(f)).length +
        (p.gender === product.gender ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating);
  return scored.slice(0, limit).map(({ p }) => toSummary(p));
}

export async function getHomeSelections() {
  "use cache";
  cacheLife("hours");
  const summaries = products.map(toSummary);
  return {
    bestsellers: summaries.filter((p) => p.isBestseller).slice(0, 4),
    newArrivals: [...summaries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    arabian: summaries.filter((p) => p.collections.includes("arabian")).slice(0, 4),
    spotlight: summaries.find((p) => p.slug === "oud-al-layl") ?? summaries[0],
  };
}

export async function searchProducts(query: string, limit = 6): Promise<ProductSummary[]> {
  const trimmed = query.trim().slice(0, 80);
  if (!trimmed) return [];
  return products
    .map(toSummary)
    .filter((p) => matchesQuery(p, trimmed))
    .slice(0, limit);
}
