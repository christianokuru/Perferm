import Image from "next/image";

import { cn } from "@/lib/utils";

/** Product photography on a pearl well with the system's 15px image radius. */
export function ProductImage({
  src,
  alt,
  sizes,
  className,
  imgClassName,
  preload,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  preload?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-[var(--radius-image)] bg-pearl", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        loading={preload ? "eager" : "lazy"}
        className={cn("object-cover", imgClassName)}
      />
    </div>
  );
}
