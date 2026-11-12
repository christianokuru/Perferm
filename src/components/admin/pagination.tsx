import Link from "next/link";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Server-rendered pager that preserves the current query string. */
export function Pagination({
  page,
  total,
  pageSize,
  basePath,
  params,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const query = new URLSearchParams(Object.entries({ ...params, page: p > 1 ? String(p) : undefined }).filter(([, v]) => v) as [string, string][]);
    const qs = query.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const link = "flex h-9 items-center gap-1 rounded-full px-3 text-body-sm";
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-body-sm text-smoke">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-1">
        {page > 1 ? (
          <Link href={href(page - 1)} className={cn(link, "bg-white text-ink hover:bg-mist")}>
            <ChevronLeftIcon size={14} /> Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={href(page + 1)} className={cn(link, "bg-white text-ink hover:bg-mist")}>
            Next <ChevronRightIcon size={14} />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
