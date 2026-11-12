"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ProductSummary } from "@/lib/catalog/summary";

import { persistOptions } from "./storage";

const MAX_WISHLIST = 100;

interface WishlistState {
  items: ProductSummary[];
  toggle: (product: ProductSummary) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) => {
        const exists = get().items.some((i) => i.id === product.id);
        set((state) => ({
          items: exists
            ? state.items.filter((i) => i.id !== product.id)
            : [product, ...state.items].slice(0, MAX_WISHLIST),
        }));
        return !exists;
      },
      remove: (productId) => set((state) => ({ items: state.items.filter((i) => i.id !== productId) })),
      clear: () => set({ items: [] }),
    }),
    persistOptions<WishlistState>("wishlist", 1, { partialize: (s) => ({ items: s.items }) as WishlistState }),
  ),
);
