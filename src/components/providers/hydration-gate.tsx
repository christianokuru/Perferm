"use client";

import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/misc";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useOrderStore } from "@/stores/order-store";
import { useHydrated } from "@/stores/storage";
import { useWishlistStore } from "@/stores/wishlist-store";

const registry = {
  auth: useAuthStore,
  cart: useCartStore,
  orders: useOrderStore,
  wishlist: useWishlistStore,
} as const;

type StoreName = keyof typeof registry;

function useAllHydrated(names: StoreName[]): boolean {
  // Hooks are called in a fixed order for a given `names` list.
  const auth = useHydrated(registry.auth);
  const cart = useHydrated(registry.cart);
  const orders = useHydrated(registry.orders);
  const wishlist = useHydrated(registry.wishlist);
  const state: Record<StoreName, boolean> = { auth, cart, orders, wishlist };
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
