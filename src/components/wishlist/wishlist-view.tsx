"use client";

import { HeartIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product/product-rail";
import { HydrationGate } from "@/components/providers/hydration-gate";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import { pluralize } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

function WishlistContent() {
  const items = useWishlistStore((s) => s.items);
  const clear = useWishlistStore((s) => s.clear);
  const add = useCartStore((s) => s.add);

  if (!items.length) {
    return (
      <EmptyState
        icon={<HeartIcon size={26} />}
        title="Nothing saved yet"
        description="Tap the heart on any fragrance to keep it here for later."
        action={<ButtonLink href="/shop">Discover fragrances</ButtonLink>}
      />
    );
  }

  const addAll = () => {
    const available = items.filter((p) => p.inStock);
    available.forEach((p) =>
      add({
        productId: p.id,
        variantId: p.defaultVariant.id,
        slug: p.slug,
        name: p.name,
        house: p.house,
        variantLabel: p.defaultVariant.label,
        image: p.image.src,
        unitPrice: p.defaultVariant.price,
      }),
    );
    toast.success(`${pluralize(available.length, "fragrance")} added to your bag`);
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-body-sm text-smoke">{pluralize(items.length, "saved fragrance")}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear all
          </Button>
          <Button variant="primary" size="sm" onClick={addAll}>
            Add all to bag
          </Button>
        </div>
      </div>
      <ProductGrid products={items} />
    </>
  );
}

export function WishlistView() {
  return (
    <HydrationGate stores={["wishlist"]}>
      <WishlistContent />
    </HydrationGate>
  );
}
