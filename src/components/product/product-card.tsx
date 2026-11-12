import Image from "next/image";
import Link from "next/link";

import { Badge, Price } from "@/components/ui/misc";
import { concentrationLabels } from "@/lib/catalog/labels";
import type { ProductSummary } from "@/lib/catalog/summary";
import { portrait } from "@/lib/images";
import { cn } from "@/lib/utils";

import { QuickAddButton } from "./quick-add-button";
import { WishlistButton } from "./wishlist-button";

/**
 * Editorial product card: image well with hover swap, left-aligned copy,
 * floating wishlist and a quick-add pill. Server component; interactive
 * pieces are isolated client islands.
 */
export function ProductCard({
  product,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  preload,
  className,
}: {
  product: ProductSummary;
  sizes?: string;
  preload?: boolean;
  className?: string;
}) {
  const href = `/product/${product.slug}`;
  const badge = !product.inStock ? "Sold out" : product.isNew ? "New" : product.isBestseller ? "Bestseller" : null;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-image)] bg-pearl">
        <Link href={href} aria-label={`${product.name} by ${product.house}`} className="absolute inset-0 z-[1]" />
        <Image
          src={portrait(product.image.src)}
          alt={product.image.alt}
          fill
          sizes={sizes}
          preload={preload}
          loading={preload ? "eager" : "lazy"}
          className={cn(
            "object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-silk)] group-hover:scale-[1.03]",
            product.hoverImage && "md:group-hover:opacity-0",
          )}
        />
        {product.hoverImage ? (
          <Image
            src={portrait(product.hoverImage.src)}
            alt=""
            fill
            sizes={sizes}
            className="hidden object-cover opacity-0 transition-opacity duration-700 md:block md:group-hover:opacity-100"
          />
        ) : null}

        {badge ? (
          <Badge tone={badge === "Sold out" ? "ink" : "light"} className="absolute top-3 left-3 z-[2]">
            {badge}
          </Badge>
        ) : null}
        <WishlistButton product={product} className="absolute top-2.5 right-2.5 z-[2]" />
        {product.inStock ? (
          <QuickAddButton product={product} className="absolute right-3 bottom-3 left-3 z-[2]" />
        ) : null}
      </div>

      <div className="mt-3.5 flex flex-1 flex-col px-0.5">
        <p className="text-caption text-smoke">{product.house}</p>
        <h3 className="mt-0.5 text-body leading-snug text-ink">
          <Link href={href} className="hover:underline hover:decoration-apricot hover:underline-offset-4">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 line-clamp-1 text-caption text-smoke">{concentrationLabels[product.concentration]}</p>
        <Price
          amount={product.priceFrom}
          compareAt={product.compareAtFrom}
          from={product.variantCount > 1}
          className="mt-2 text-body-sm text-ink"
        />
      </div>
    </article>
  );
}
