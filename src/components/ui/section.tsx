import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

import { Eyebrow, Heading } from "./typography";

export function Section({
  children,
  className,
  tone = "canvas",
  id,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  tone?: "canvas" | "pearl" | "ink";
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "py-14 md:py-20",
        tone === "pearl" && "bg-pearl",
        tone === "ink" && "bg-ink text-white [&_h2]:text-white [&_h3]:text-white",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Left-aligned section header with optional eyebrow and trailing link. */
export function SectionHeader({
  eyebrow,
  title,
  id,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  id?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex items-end justify-between gap-6 md:mb-10", className)}>
      <div className="space-y-3">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Heading id={id}>{title}</Heading>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="group hidden shrink-0 items-center gap-1.5 text-body-sm text-ink sm:inline-flex"
        >
          <span className="border-b border-transparent transition-colors group-hover:border-apricot">{action.label}</span>
          <ArrowRightIcon size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
