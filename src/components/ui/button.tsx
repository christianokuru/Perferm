import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Pill actions — 600px radius is non-negotiable in the system.
 * primary: ink fill · accent: saffron fill (ink text, AA-compliant)
 * outline: hairline · light: white pill on imagery · ghost: text only
 */
export type ButtonVariant = "primary" | "accent" | "outline" | "light" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] whitespace-nowrap transition-[background-color,color,border-color,opacity,transform] duration-300 ease-[var(--ease-silk)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-graphite/85",
  accent: "bg-saffron text-ink hover:bg-saffron-bright",
  outline: "border border-graphite/80 text-ink hover:bg-ink hover:text-white",
  light: "bg-white text-graphite hover:bg-white/85",
  ghost: "text-ink hover:bg-pearl",
  danger: "border border-danger/40 text-danger hover:bg-danger hover:text-white",
};

/** Phones get a slightly tighter pill; the full size returns from md. */
const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-body-sm md:h-9 md:px-4",
  md: "h-11 px-6 text-body-sm md:h-12 md:px-7",
  lg: "h-12 px-8 text-body-sm md:h-14 md:px-10 md:text-body",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  block,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], block && "w-full", className);
}

type CommonProps = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; loading?: boolean; icon?: ReactNode };

export function Button({
  variant,
  size,
  block,
  loading,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, block, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      <span className={cn(loading && "opacity-80")}>{children}</span>
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  block,
  icon,
  className,
  children,
  ...props
}: Omit<CommonProps, "loading"> & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses({ variant, size, block, className })} {...props}>
      {children}
      {icon}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("size-4 animate-spin rounded-full border-[1.5px] border-current border-r-transparent", className)}
    />
  );
}
