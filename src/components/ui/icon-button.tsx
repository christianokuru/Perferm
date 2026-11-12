import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface IconButtonProps extends ComponentProps<"button"> {
  label: string;
  badge?: ReactNode;
  tone?: "plain" | "glass" | "solid";
}

/** Circular 44px tap target (WCAG 2.5.5) for header and card utilities. */
export function IconButton({ label, badge, tone = "plain", className, children, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors duration-300",
        tone === "plain" && "hover:bg-pearl",
        tone === "glass" && "bg-white/70 backdrop-blur-md hover:bg-white",
        tone === "solid" && "bg-pearl hover:bg-mist",
        className,
      )}
      {...props}
    >
      {children}
      {badge}
    </button>
  );
}

export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-saffron-bright px-1 text-[10px] font-medium text-white tabular-nums"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
