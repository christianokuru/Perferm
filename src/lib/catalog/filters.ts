import { concentrationLabels, familyLabels, genderLabels, priceBands, sortOptions } from "./labels";
import type { PriceBandValue, SortValue } from "./labels";
import type { ProductSummary } from "./summary";
import type { Concentration, Gender, ScentFamily } from "@/lib/types";

export interface ShopFilters {
  q: string;
  collection: string | null;
  gender: Gender[];
  family: ScentFamily[];
  concentration: Concentration[];
  price: PriceBandValue | null;
  sort: SortValue;
}

export const PAGE_SIZE = 12;
const MAX_QUERY_LENGTH = 80;

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function readAll(source: ParamSource, key: string): string[] {
  if (source instanceof URLSearchParams) {
    return source.getAll(key).flatMap((v) => v.split(","));
  }
  const raw = source[key];
  if (!raw) return [];
  return (Array.isArray(raw) ? raw : [raw]).flatMap((v) => v.split(","));
}

/** Keeps only values that exist in the allow-list — never trust the URL. */
function whitelist<T extends string>(values: string[], allowed: Record<T, unknown>): T[] {
  return [...new Set(values)].filter((v): v is T => Object.prototype.hasOwnProperty.call(allowed, v));
}

export function parseShopFilters(source: ParamSource, collectionSlugs: readonly string[] = []): ShopFilters {
  const q = (readAll(source, "q")[0] ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const collection = readAll(source, "collection")[0] ?? null;
  const sort = readAll(source, "sort")[0];
  const price = readAll(source, "price")[0];

  return {
    q,
    collection: collection && collectionSlugs.includes(collection) ? collection : null,
    gender: whitelist(readAll(source, "gender"), genderLabels),
    family: whitelist(readAll(source, "family"), familyLabels),
    concentration: whitelist(readAll(source, "concentration"), concentrationLabels),
    price: priceBands.some((band) => band.value === price) ? (price as PriceBandValue) : null,
    sort: sortOptions.some((option) => option.value === sort) ? (sort as SortValue) : "featured",
  };
}

export function filtersToSearchParams(filters: Partial<ShopFilters>): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.gender?.length) params.set("gender", filters.gender.join(","));
  if (filters.family?.length) params.set("family", filters.family.join(","));
  if (filters.concentration?.length) params.set("concentration", filters.concentration.join(","));
  if (filters.price) params.set("price", filters.price);
  if (filters.sort && filters.sort !== "featured") params.set("sort", filters.sort);
  return params;
}

export function countActiveFilters(filters: ShopFilters, ignoreCollection = false): number {
  return (
    filters.gender.length +
    filters.family.length +
    filters.concentration.length +
    (filters.price ? 1 : 0) +
    (!ignoreCollection && filters.collection ? 1 : 0)
  );
}

function normalise(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function matchesQuery(product: ProductSummary, query: string): boolean {
  if (!query) return true;
  const haystack = normalise(
    [product.name, product.house, product.tagline, ...product.families, ...product.collections, concentrationLabels[product.concentration]].join(" "),
  );
  return normalise(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

const sorters: Record<SortValue, (a: ProductSummary, b: ProductSummary) => number> = {
  featured: (a, b) => Number(b.isBestseller) - Number(a.isBestseller) || b.rating - a.rating,
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  popular: (a, b) => b.reviewCount - a.reviewCount,
  "price-asc": (a, b) => a.priceFrom - b.priceFrom,
  "price-desc": (a, b) => b.priceFrom - a.priceFrom,
};

/** Pure, framework-agnostic filter — the same logic can move into a DB query later. */
export function applyShopFilters(products: ProductSummary[], filters: ShopFilters): ProductSummary[] {
  const band = priceBands.find((b) => b.value === filters.price);
  return products
    .filter((p) => matchesQuery(p, filters.q))
    .filter((p) => !filters.collection || p.collections.includes(filters.collection))
    .filter((p) => !filters.gender.length || filters.gender.includes(p.gender))
    .filter((p) => !filters.family.length || p.families.some((f) => filters.family.includes(f)))
    .filter((p) => !filters.concentration.length || filters.concentration.includes(p.concentration))
    .filter((p) => !band || (p.priceFrom >= band.min && p.priceFrom < band.max))
    .sort(sorters[filters.sort]);
}
