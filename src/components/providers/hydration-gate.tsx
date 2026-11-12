"use client";

import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/misc";
import { useCartStore } from "@/stores/cart-store";
import { useSessionStatus } from "@/stores/session-store";
import { useHydrated } from "@/stores/storage";
import { useWishlistStore } from "@/stores/wishlist-store";

type StoreName = "cart" | "wishlist" | "session";

function useAllHydrated(names: StoreName[]): boolean {
  // Hooks are always called in the same order.
  const cart = useHydrated(useCartStore);
  const wishlist = useHydrated(useWishlistStore);
  const session = useSessionStatus() !== "loading";
  const state: Record<StoreName, boolean> = { cart, wishlist, session };
  return names.every((n) => state[n]);
}

/** Renders children only once the named persisted stores have loaded. */
export function HydrationGate({
  stores,
  children,
  fallback,
}: {
  stores: StoreName[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const ready = useAllHydrated(stores);
  if (!ready) return <>{fallback ?? <PageSkeleton />}</>;
  return <>{children}</>;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}
