"use client";

import { create } from "zustand";

type Panel = "cart" | "search" | "menu" | null;

interface UiState {
  panel: Panel;
  open: (panel: Exclude<Panel, null>) => void;
  close: () => void;
}

/** Only one overlay (bag, search, menu) is ever open at a time. */
export const useUiStore = create<UiState>()((set) => ({
  panel: null,
  open: (panel) => set({ panel }),
  close: () => set({ panel: null }),
}));
