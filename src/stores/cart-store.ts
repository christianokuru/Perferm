"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Kobo } from "@/lib/types";
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "@/lib/validation/schemas";

import { persistOptions } from "./storage";

/** Display snapshot only — checkout re-prices every line on the server. */
export interface CartItemSnapshot {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  house: string;
  variantLabel: string;
  image: string;
  unitPrice: Kobo;
}

export interface CartLine extends CartItemSnapshot {
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  add: (item: CartItemSnapshot, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  /** Replace display prices/quantities with the server's authoritative quote. */
  reconcile: (authoritative: Array<{ variantId: string | null; unitPrice: Kobo; quantity: number }>) => void;
}

const clampQuantity = (quantity: number) => Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.floor(quantity)));

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (item, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === item.variantId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.variantId === item.variantId ? { ...l, ...item, quantity: clampQuantity(l.quantity + quantity) } : l,
              ),
            };
          }
          if (state.lines.length >= MAX_CART_LINES) return state;
          return { lines: [...state.lines, { ...item, quantity: clampQuantity(quantity) }] };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: clampQuantity(quantity) } : l)),
        })),
      remove: (variantId) => set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
      reconcile: (authoritative) => {
        const current = get().lines;
        const next = current.flatMap((line) => {
          const match = authoritative.find((a) => a.variantId === line.variantId);
          return match ? [{ ...line, unitPrice: match.unitPrice, quantity: match.quantity }] : [];
        });
        const changed =
          next.length !== current.length ||
          next.some((l, i) => l.unitPrice !== current[i].unitPrice || l.quantity !== current[i].quantity);
        // Only write when something differs, so subscribers (and effects) don't loop.
        if (changed) set({ lines: next });
      },
    }),
    persistOptions<CartState>("cart", 2, { partialize: (s) => ({ lines: s.lines }) as CartState }),
  ),
);

export const selectItemCount = (s: CartState) => s.lines.reduce((sum, l) => sum + l.quantity, 0);
export const selectSubtotal = (s: CartState) => s.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
