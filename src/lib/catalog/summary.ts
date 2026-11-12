import type { Product, ProductImage, ProductVariant } from "@/lib/types";

/**
 * The lightweight shape sent to client components (cards, search, filters).
 * Keeps long descriptions and notes out of the client bundle.
 */
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  house: string;
  tagline: string;
  image: ProductImage;
  hoverImage?: ProductImage;
  gender: Product["gender"];
  concentration: Product["concentration"];
  families: Product["families"];
  collections: string[];
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isBestseller: boolean;
  createdAt: string;
  priceFrom: number;
  compareAtFrom?: number;
  defaultVariant: Pick<ProductVariant, "id" | "label" | "price">;
  variantCount: number;
  inStock: boolean;
}

export function cheapestVariant(product: Product): ProductVariant {
  return product.variants.reduce((min, v) => (v.price < min.price ? v : min), product.variants[0]);
}

export function toSummary(product: Product): ProductSummary {
  const cheapest = cheapestVariant(product);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    house: product.house,
    tagline: product.tagline,
    image: product.images[0],
    hoverImage: product.images[1],
    gender: product.gender,
    concentration: product.concentration,
    families: product.families,
    collections: product.collections,
    rating: product.rating,
    reviewCount: product.reviewCount,
    isNew: Boolean(product.isNew),
    isBestseller: Boolean(product.isBestseller),
    createdAt: product.createdAt,
    priceFrom: cheapest.price,
    compareAtFrom: cheapest.compareAtPrice,
    defaultVariant: { id: cheapest.id, label: cheapest.label, price: cheapest.price },
    variantCount: product.variants.length,
    inStock: product.variants.some((v) => v.stock > 0),
  };
}
