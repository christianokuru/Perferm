"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { siteConfig } from "@/lib/config/site";
import { deliveryZones as seedZones } from "@/lib/data/delivery-zones";
import { products as seedProducts } from "@/lib/data/products";
import type { DeliveryZone, Product } from "@/lib/types";

import { persistOptions } from "./storage";

/**
 * Admin workspace (demo mode). Edits persist in this browser so every screen
 * is fully usable; the same actions map 1:1 to Supabase mutations later.
 */

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  announcement: string;
  pickupEnabled: boolean;
  pickupAddress: string;
  pickupHours: string;
  paystackEnabled: boolean;
  flutterwaveEnabled: boolean;
}

const defaultSettings: StoreSettings = {
  storeName: siteConfig.name,
  supportEmail: siteConfig.contact.email,
  supportPhone: siteConfig.contact.phone,
  announcement: siteConfig.announcements[0],
  pickupEnabled: true,
  pickupAddress: `${siteConfig.boutique.street}, ${siteConfig.boutique.area}, ${siteConfig.boutique.city}`,
  pickupHours: siteConfig.boutique.hours,
  paystackEnabled: true,
  flutterwaveEnabled: true,
};

interface AdminState {
  products: Product[];
  zones: DeliveryZone[];
  settings: StoreSettings;
  upsertProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  updateZone: (state: string, patch: Partial<DeliveryZone>) => void;
  saveSettings: (settings: StoreSettings) => void;
  resetDemoData: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      products: seedProducts,
      zones: seedZones,
      settings: defaultSettings,
      upsertProduct: (product) =>
        set((state) => {
          const exists = state.products.some((p) => p.id === product.id);
          return {
            products: exists
              ? state.products.map((p) => (p.id === product.id ? product : p))
              : [product, ...state.products],
          };
        }),
      deleteProduct: (id) => set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
      updateZone: (stateName, patch) =>
        set((state) => ({ zones: state.zones.map((z) => (z.state === stateName ? { ...z, ...patch } : z)) })),
      saveSettings: (settings) => set({ settings }),
      resetDemoData: () => set({ products: seedProducts, zones: seedZones, settings: defaultSettings }),
    }),
    persistOptions<AdminState>("admin", 1, {
      partialize: (s) => ({ products: s.products, zones: s.zones, settings: s.settings }) as AdminState,
    }),
  ),
);
