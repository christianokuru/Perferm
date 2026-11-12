import Link from "next/link";
import type { ReactNode } from "react";

import { ChevronRightIcon, StarIcon } from "@/components/icons";
import { formatNaira } from "@/lib/money";
import type { Crumb } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Price({
  amount,
  compareAt,
  from,
  className,
}: {
  amount: number;
  compareAt?: number;
  from?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-2 tabular-nums", className)}>
      {from ? <span className="text-smoke">from</span> : null}
      <span>{formatNaira(amount)}</span>
      {compareAt && compareAt > amount ? (
        <s className="text-smoke" aria-label={`was ${formatNaira(compareAt)}`}>
          {formatNaira(compareAt)}
        </s>
      ) : null}
    </span>
  );
}

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("relative inline-flex items-center gap-1.5 text-caption text-graphite", className)}>
      <span className="flex text-saffron" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} size={13} filled={i < Math.round(value)} />
        ))}
      </span>
      <span className="sr-only">Rated {value} out of 5</span>
      <span aria-hidden="true">{value.toFixed(1)}</span>
      {count !== undefined ? <span className="text-smoke">({count})</span> : null}
    </span>
  );
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-caption text-smoke", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined} className="text-ink">
                {item.label}
              </span>
            )}
            {i < items.length - 1 ? <ChevronRightIcon size={12} /> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Badge({ children, tone = "light", className }: { children: ReactNode; tone?: "light" | "ink" | "saffron" | "outline"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-[30px] px-2.5 text-[11px] font-medium tracking-[0.02em]",
        tone === "light" && "bg-white/90 text-ink backdrop-blur",
        tone === "ink" && "bg-ink text-white",
        tone === "saffron" && "bg-saffron text-ink",
        tone === "outline" && "border border-mist text-graphite",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center md:py-24", className)}>
      {icon ? <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-pearl text-ink">{icon}</div> : null}
      <h2 className="text-heading-sm font-light text-ink">{title}</h2>
      {description ? <p className="mt-3 max-w-sm text-body-sm text-smoke">{description}</p> : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-[var(--radius-card)] bg-pearl", className)} />;
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-mist", className)} />;
}
