"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";

import { getLenis, setLenis } from "@/lib/smooth-scroll";

/**
 * Site-wide Lenis smooth scrolling for wheel/trackpad. Touch keeps native
 * momentum (best feel and performance on phones), and it's disabled entirely
 * for visitors who prefer reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;

    const enable = () => {
      lenis = new Lenis({
        autoRaf: true,
        lerp: 0.085,
        wheelMultiplier: 0.95,
        anchors: { offset: -96 },
        syncTouch: false,
      });
      setLenis(lenis);
    };
    const disable = () => {
      lenis?.destroy();
      lenis = null;
      setLenis(null);
    };
    const onChange = () => (media.matches ? disable() : enable());

    if (!media.matches) enable();
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
      disable();
    };
  }, []);

  return (
    <Suspense>
      <RouteSync />
    </Suspense>
  );
}

/** After client navigations, cancel any in-flight glide and re-measure the new page. */
function RouteSync() {
  const pathname = usePathname();
  useEffect(() => {
    const lenis = getLenis();
    if (!lenis) return;
    lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    lenis.resize();
  }, [pathname]);
  return null;
}
