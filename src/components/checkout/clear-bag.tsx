"use client";

import { useEffect } from "react";

import { useCartStore } from "@/stores/cart-store";

/** Empties the bag once a paid order is shown (covers reloads and other tabs). */
export function ClearBagOnMount() {
  useEffect(() => {
    const clear = () => useCartStore.getState().clear();
    if (useCartStore.persist.hasHydrated()) clear();
    else return useCartStore.persist.onFinishHydration(clear);
  }, []);
  return null;
}
