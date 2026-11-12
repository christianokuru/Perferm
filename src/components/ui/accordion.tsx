import type { ReactNode } from "react";

import { PlusIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Native <details> accordion — zero JS, accessible by default, works before
 * hydration and is fully indexable by search engines.
 */
export function Accordion({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-t border-mist", className)}>{children}</div>;
}

export function AccordionItem({
  title,
  children,
  defaultOpen,
  name,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Items sharing a name behave as an exclusive group. */
  name?: string;
}) {
  return (
    <details name={name} open={defaultOpen} className="group border-b border-mist">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-body text-ink [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <PlusIcon size={18} className="shrink-0 transition-transform duration-300 group-open:rotate-45" />
      </summary>
      <div className="pb-6 text-body-sm leading-relaxed text-graphite/80">{children}</div>
    </details>
  );
}
