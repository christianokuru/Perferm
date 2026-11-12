import type { Tables } from "@/lib/supabase/database.types";
import type { Collection, Product, Review } from "@/lib/types";

/** Columns fetched for a full product, including its images, sizes and collections. */
export const PRODUCT_SELECT =
  "id, slug, name, house, tagline, description, gender, concentration, families, notes_top, notes_heart, notes_base, longevity, sillage, is_new, is_bestseller, rating, review_count, created_at, archived_at, product_images(id, src, alt, position, storage_path), product_variants(id, label, price_kobo, compare_at_kobo, stock, position), product_collections(collection_slug)" as const;

type ProductRow = Pick<
  Tables<"products">,
  | "id" | "slug" | "name" | "house" | "tagline" | "description" | "gender" | "concentration" | "families" | "notes_top" | "notes_heart"
  | "notes_base" | "longevity" | "sillage" | "is_new" | "is_bestseller" | "rating" | "review_count" | "created_at" | "archived_at"
> & {
  product_images: Pick<Tables<"product_images">, "id" | "src" | "alt" | "position" | "storage_path">[];
  product_variants: Pick<Tables<"product_variants">, "id" | "label" | "price_kobo" | "compare_at_kobo" | "stock" | "position">[];
  product_collections: Pick<Tables<"product_collections">, "collection_slug">[];
};

const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position;

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    house: row.house,
    tagline: row.tagline,
    description: row.description,
    gender: row.gender,
    concentration: row.concentration,
    families: row.families,
    collections: row.product_collections.map((c) => c.collection_slug),
    notes: { top: row.notes_top, heart: row.notes_heart, base: row.notes_base },
    images: [...row.product_images].sort(byPosition).map((i) => ({ src: i.src, alt: i.alt, storagePath: i.storage_path ?? undefined })),
    variants: [...row.product_variants].sort(byPosition).map((v) => ({
      id: v.id,
      label: v.label,
      price: v.price_kobo,
      compareAtPrice: v.compare_at_kobo ?? undefined,
      stock: v.stock,
    })),
    longevity: row.longevity,
    sillage: row.sillage,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    isNew: row.is_new,
    isBestseller: row.is_bestseller,
    createdAt: row.created_at,
    archived: Boolean(row.archived_at),
  };
}

export function mapCollection(row: Tables<"collections">): Collection {
  return {
    slug: row.slug,
    title: row.title,
    accent: row.accent,
    eyebrow: row.eyebrow,
    description: row.description,
    image: { src: row.image_src, alt: row.image_alt },
  };
}

export function mapReview(
  row: Pick<Tables<"reviews">, "id" | "author_name" | "city" | "rating" | "title" | "body" | "created_at" | "verified_purchase">,
): Review {
  return {
    id: row.id,
    author: row.author_name,
    city: row.city ?? "",
    rating: row.rating,
    title: row.title,
    body: row.body,
    date: row.created_at,
    verified: row.verified_purchase,
  };
}
