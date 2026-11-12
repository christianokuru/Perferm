"use client";

import { HeartIcon } from "@/components/icons";
import { toast } from "@/components/ui/toast";
import type { ProductSummary } from "@/lib/catalog/summary";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/stores/storage";
import { useWishlistStore } from "@/stores/wishlist-store";

export function WishlistButton({
  product,
  className,
  variant = "floating",
}: {
  product: ProductSummary;
  className?: string;
  variant?: "floating" | "outline";
}) {
  const ready = useHydrated(useWishlistStore);
  const saved = useWishlistStore((s) => s.items.some((i) => i.id === product.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const active = ready && saved;

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const added = toggle(product);
        toast.show(added ? `${product.name} saved to your wishlist` : `${product.name} removed from your wishlist`);
      }}
      className={cn(
        "flex items-center justify-center rounded-full transition-[background-color,color,transform] duration-300 active:scale-90",
        variant === "floating" && "size-10 bg-white/80 text-ink backdrop-blur hover:bg-white",
        variant === "outline" && "size-12 border border-mist text-ink hover:border-ink",
        active && "text-saffron",
        className,
      )}
    >
      <HeartIcon size={18} filled={active} />
    </button>
  );
}
