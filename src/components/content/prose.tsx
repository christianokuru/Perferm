import type { ReactNode } from "react";

import { PageIntro } from "@/components/shop/page-intro";
import { cn } from "@/lib/utils";

/** Long-form typography for policy and editorial pages. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-2xl text-body leading-relaxed text-graphite/85",
        "[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-heading-sm [&_h2]:font-light [&_h2]:text-ink",
        "[&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-body [&_h3]:font-medium [&_h3]:text-ink",
        "[&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PolicyPage({ title, accent, lead, updated, children }: { title: string; accent: string; lead: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: `${title} ${accent}`.trim() }]}
        title={
          <>
            {title} <em className="font-serif font-normal italic">{accent}</em>
          </>
        }
        lead={lead}
      />
      <div className="container-page pb-24">
        <p className="mb-8 text-caption text-smoke">Last updated {updated}</p>
        <Prose>{children}</Prose>
      </div>
    </>
  );
}
