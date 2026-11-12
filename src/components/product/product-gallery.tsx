"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Mobile: swipeable scroll-snap carousel with indicator dots.
 * Desktop: editorial stack of full-bleed images beside sticky purchase info.
 */
export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    track?.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div>
      {/* Mobile carousel */}
      <div className="relative md:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[var(--radius-image)]"
          aria-roledescription="carousel"
          aria-label={`${name} images`}
        >
          {images.map((image, i) => (
            <div
              key={image.src}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-pearl"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${images.length}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="100vw"
                preload={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {images.map((image, i) => (
              <button
                key={image.src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={active === i}
                className={cn("h-1.5 rounded-full bg-white transition-all duration-300", active === i ? "w-6" : "w-1.5 opacity-60")}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Desktop stack */}
      <div className="hidden gap-2 md:grid">
        {images.map((image, i) => (
          <div key={image.src} className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-image)] bg-pearl">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 1280px) 720px, 55vw"
              preload={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
