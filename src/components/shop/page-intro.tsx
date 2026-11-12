import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/ui/misc";
import type { Crumb } from "@/lib/types";

/** Shared editorial page header: breadcrumbs, whisper headline, lead copy. */
export function PageIntro({
  crumbs,
  title,
  lead,
  aside,
}: {
  crumbs: Crumb[];
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="container-page pt-6 pb-10 md:pt-10 md:pb-14">
      <Breadcrumbs items={crumbs} />
      <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h1 className="text-[3.25rem] leading-[0.92] font-extralight tracking-[-0.075em] text-ink md:text-[5.5rem]">{title}</h1>
        {aside}
      </div>
      {lead ? <p className="mt-6 max-w-xl text-body text-graphite/80">{lead}</p> : null}
    </header>
  );
}
