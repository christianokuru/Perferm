"use client";

import { useEffect } from "react";

import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

const stores = {
  "perferm:cart": useCartStore,
  "perferm:wishlist": useWishlistStore,
} as const;

/**
 * Loads persisted stores after mount (keeps SSR markup and first paint
 * identical) and keeps them in sync when another tab changes them.
 */
export function StoreHydration() {
  useEffect(() => {
    Object.values(stores).forEach((store) => void store.persist.rehydrate());

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key in stores) void stores[event.key as keyof typeof stores].persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
