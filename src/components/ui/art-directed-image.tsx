import { getImageProps } from "next/image";

import { cn } from "@/lib/utils";

/**
 * A fill image with a different crop on phones and on wider screens (art
 * direction). Phones get a source cropped to their tall frame, so nothing is
 * upscaled; the browser downloads only the variant it shows.
 */
export function ArtDirectedImage({
  alt,
  mobileSrc,
  desktopSrc,
  mobileSizes = "100vw",
  desktopSizes,
  priority,
  className,
}: {
  alt: string;
  mobileSrc: string;
  desktopSrc: string;
  mobileSizes?: string;
  desktopSizes: string;
  priority?: boolean;
  className?: string;
}) {
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ alt, src: desktopSrc, fill: true, sizes: desktopSizes });
  const {
    props: { srcSet: mobileSrcSet, ...img },
  } = getImageProps({
    alt,
    src: mobileSrc,
    fill: true,
    sizes: mobileSizes,
    loading: priority ? "eager" : "lazy",
    fetchPriority: priority ? "high" : undefined,
  });

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopSrcSet} sizes={desktopSizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
      <img {...img} srcSet={mobileSrcSet} className={cn("object-cover", className)} />
    </picture>
  );
}
