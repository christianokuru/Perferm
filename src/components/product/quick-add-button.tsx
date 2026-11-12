"use client";

import { PlusIcon } from "@/components/icons";
import { toast } from "@/components/ui/toast";
import type { ProductSummary } from "@/lib/catalog/summary";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useUiStore } from "@/stores/ui-store";

/** Adds the smallest size straight from a card — visible on hover (desktop) or always (touch). */
export function QuickAddButton({ product, className }: { product: ProductSummary; className?: string }) {
  const add = useCartStore((s) => s.add);
  const openPanel = useUiStore((s) => s.open);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        add({
          productId: product.id,
          variantId: product.defaultVariant.id,
          slug: product.slug,
          name: product.name,
          house: product.house,
          variantLabel: product.defaultVariant.label,
          image: product.image.src,
          unitPrice: product.defaultVariant.price,
        });
        toast.success(`${product.name} · ${product.defaultVariant.label} added to bag`, {
          label: "View bag",
          onClick: () => openPanel("cart"),
        });
      }}
      aria-label={`Add ${product.name} ${product.defaultVariant.label} to bag`}
      className={cn(
        "flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/90 text-body-sm text-ink backdrop-blur transition-[opacity,transform,background-color] duration-500 ease-[var(--ease-silk)] hover:bg-ink hover:text-white",
        "[@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:translate-y-0 [@media(hover:hover)]:focus-visible:opacity-100",
        "max-[380px]:hidden",
        className,
      )}
    >
      <PlusIcon size={16} />
      <span>
        Add <span className="hidden sm:inline">· {product.defaultVariant.label}</span>
      </span>
    </button>
  );
}
