"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { clearWishlist, setWishlisted } from "@/app/actions/wishlist";
import { toast } from "@/components/ui/toast";
import type { ProductSummary } from "@/lib/catalog/summary";

import { useSessionStore } from "./session-store";
import { persistOptions } from "./storage";

const MAX_WISHLIST = 100;

interface WishlistState {
  items: ProductSummary[];
  /** Optimistic toggle; for signed-in customers the change is saved to their account. Returns the new saved state. */
  toggle: (product: ProductSummary) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
  /** Adopts the account's wishlist after sign-in. */
  replace: (items: ProductSummary[]) => void;
}

const signedIn = () => useSessionStore.getState().status === "authenticated";

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => {
      const persistRemote = async (product: ProductSummary, saved: boolean) => {
        if (!signedIn()) return;
        const result = await setWishlisted({ productId: product.id, saved });
        if (!result.ok) {
          // Roll back the optimistic change.
          set((state) => ({
            items: saved ? state.items.filter((i) => i.id !== product.id) : [product, ...state.items.filter((i) => i.id !== product.id)],
          }));
          toast.error(result.error ?? "We couldn't update your wishlist.");
        }
      };

      return {
        items: [],
        toggle: (product) => {
          const exists = get().items.some((i) => i.id === product.id);
          set((state) => ({
            items: exists ? state.items.filter((i) => i.id !== product.id) : [product, ...state.items].slice(0, MAX_WISHLIST),
          }));
          void persistRemote(product, !exists);
          return !exists;
        },
        remove: (productId) => {
          const product = get().items.find((i) => i.id === productId);
          set((state) => ({ items: state.items.filter((i) => i.id !== productId) }));
          if (product) void persistRemote(product, false);
        },
        clear: () => {
          const hadItems = get().items.length > 0;
          set({ items: [] });
          if (hadItems && signedIn()) void clearWishlist();
        },
        replace: (items) => set({ items: items.slice(0, MAX_WISHLIST) }),
      };
    },
    persistOptions<WishlistState>("wishlist", 2, { partialize: (s) => ({ items: s.items }) as WishlistState }),
  ),
);
