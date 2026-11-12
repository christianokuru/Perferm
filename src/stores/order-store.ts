"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Order, OrderStatus } from "@/lib/types";

import { persistOptions } from "./storage";

/**
 * Demo order ledger (browser-only). In production orders are created and
 * marked paid server-side after the payment webhook is verified.
 */
interface OrderState {
  orders: Order[];
  add: (order: Order) => void;
  updateStatus: (reference: string, status: OrderStatus) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      add: (order) => set((state) => ({ orders: [order, ...state.orders.filter((o) => o.reference !== order.reference)] })),
      updateStatus: (reference, status) =>
        set((state) => ({ orders: state.orders.map((o) => (o.reference === reference ? { ...o, status } : o)) })),
    }),
    persistOptions<OrderState>("orders", 1, { partialize: (s) => ({ orders: s.orders }) as OrderState }),
  ),
);
