import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Small uppercase label that sits above headings. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-caption font-medium tracking-[0.14em] text-smoke uppercase", className)}>{children}</p>
  );
}

/** The italic serif accent word — the brand's second voice inside headlines. */
export function Accent({ children, className }: { children: ReactNode; className?: string }) {
  return <em className={cn("font-serif font-normal tracking-[-0.02em] italic", className)}>{children}</em>;
}

type HeadingSize = "display" | "heading" | "heading-sm" | "subheading";

const headingSizes: Record<HeadingSize, string> = {
  display: "text-display font-extralight",
  heading: "text-heading font-light",
  "heading-sm": "text-heading-sm font-light",
  subheading: "text-subheading font-normal",
};

export function Heading({
  as: Tag = "h2",
  size = "heading",
  className,
  children,
  id,
}: {
  as?: ElementType;
  size?: HeadingSize;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <Tag id={id} className={cn("text-ink", headingSizes[size], className)}>
      {children}
    </Tag>
  );
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("max-w-prose text-body text-graphite/80", className)}>{children}</p>;
}
