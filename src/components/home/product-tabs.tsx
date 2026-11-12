"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  href: string;
  content: ReactNode;
}

/**
 * Accessible tabs (WAI-ARIA pattern, arrow-key navigation). Panels are
 * server-rendered and passed in, so this island only toggles visibility.
 */
export function ProductTabs({ title, tabs }: { title: ReactNode; tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(tabs[next].id);
    document.getElementById(`tab-${tabs[next].id}`)?.focus();
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
        <h2 className="text-heading font-light text-ink">{title}</h2>
        <div className="flex items-center justify-between gap-4">
          <div role="tablist" aria-label="Product selections" className="flex gap-1 rounded-full bg-pearl p-1">
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={tab.id === active}
                aria-controls={`panel-${tab.id}`}
                tabIndex={tab.id === active ? 0 : -1}
                onClick={() => setActive(tab.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  "h-9 rounded-full px-4 text-body-sm transition-colors duration-300",
                  tab.id === active ? "bg-white text-ink" : "text-smoke hover:text-ink",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Link href={current.href} className="group hidden items-center gap-1.5 text-body-sm text-ink md:inline-flex">
            <span className="border-b border-apricot">View all</span>
            <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
        >
          {tab.content}
        </div>
      ))}

      <Link href={current.href} className="mt-8 inline-flex items-center gap-1.5 text-body-sm text-ink md:hidden">
        <span className="border-b border-apricot">View all {current.label.toLowerCase()}</span>
        <ArrowRightIcon size={16} />
      </Link>
    </div>
  );
}
