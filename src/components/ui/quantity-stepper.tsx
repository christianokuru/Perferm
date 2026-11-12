"use client";

import { MinusIcon, PlusIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const btn = cn(
    "flex items-center justify-center rounded-full text-ink transition-colors hover:bg-pearl disabled:opacity-30 disabled:hover:bg-transparent",
    size === "sm" ? "size-8" : "size-10",
  );
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center rounded-full border border-mist", size === "sm" ? "h-9 px-0.5" : "h-12 px-1")}
    >
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <MinusIcon size={size === "sm" ? 14 : 16} />
      </button>
      <output aria-live="polite" className={cn("text-center tabular-nums", size === "sm" ? "w-6 text-body-sm" : "w-8 text-body")}>
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <PlusIcon size={size === "sm" ? 14 : 16} />
      </button>
    </div>
  );
}
