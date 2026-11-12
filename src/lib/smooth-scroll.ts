"use client";

import type Lenis from "lenis";

/**
 * Single shared Lenis instance. Overlays (drawers, menus, dialogs) pause it
 * while open so the page behind can't scroll; nested scroll areas opt out
 * with `data-lenis-prevent`.
 */
let instance: Lenis | null = null;
let locks = 0;

export function setLenis(lenis: Lenis | null): void {
  instance = lenis;
  if (lenis && locks > 0) lenis.stop();
}

export function getLenis(): Lenis | null {
  return instance;
}

/** Pause smooth scrolling (ref-counted so stacked overlays behave). Returns an unlock function. */
export function lockScroll(): () => void {
  locks += 1;
  instance?.stop();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) instance?.start();
  };
}
