import { useSyncExternalStore } from "react";
import { createJSONStorage, type PersistOptions } from "zustand/middleware";

/** Namespaced localStorage that fails silently (private mode, quota, SSR). */
const safeLocalStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
  }
  return {
    getItem: (key: string) => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* storage full or blocked — state stays in memory */
      }
    },
    removeItem: (key: string) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
});

/**
 * Shared persist options. `skipHydration` keeps the server HTML and the first
 * client render identical; <StoreHydration /> rehydrates after mount.
 */
export function persistOptions<T>(name: string, version: number, extra: Partial<PersistOptions<T>> = {}) {
  return {
    name: `perferm:${name}`,
    version,
    storage: safeLocalStorage,
    skipHydration: true,
    ...extra,
  } as PersistOptions<T>;
}

interface PersistApi {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
}

/** True once a persisted store has loaded from localStorage. Always false on the server. */
export function useHydrated(store: PersistApi): boolean {
  return useSyncExternalStore(
    store.persist.onFinishHydration,
    store.persist.hasHydrated,
    () => false,
  );
}
