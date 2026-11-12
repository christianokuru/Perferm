import type { ProductSummary } from "@/lib/catalog/summary";
import { cn } from "@/lib/utils";

import { ProductCard } from "./product-card";

/** Horizontal scroll-snap rail on mobile, grid on desktop. */
export function ProductRail({ products, className, label }: { products: ProductSummary[]; className?: string; label: string }) {
  return (
    <ul
      aria-label={label}
      className={cn(
        "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0",
        className,
      )}
    >
      {products.map((product) => (
        <li key={product.id} className="relative w-[68%] shrink-0 snap-start sm:w-[42%] md:w-auto">
          <ProductCard product={product} sizes="(min-width: 768px) 25vw, 68vw" />
        </li>
      ))}
    </ul>
  );
}

export function ProductGrid({
  products,
  className,
  preloadFirst = 0,
  columns = 4,
}: {
  products: ProductSummary[];
  className?: string;
  preloadFirst?: number;
  /** Max columns on large screens (3 when a filter sidebar is present). */
  columns?: 3 | 4;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 md:gap-y-12",
        columns === 4 && "lg:grid-cols-4",
        className,
      )}
    >
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} preload={i < preloadFirst} />
        </li>
      ))}
    </ul>
  );
}
