"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { CloseIcon, FilterIcon, SearchIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product/product-rail";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import {
  applyShopFilters,
  countActiveFilters,
  filtersToSearchParams,
  PAGE_SIZE,
  parseShopFilters,
  type ShopFilters,
} from "@/lib/catalog/filters";
import { concentrationLabels, familyLabels, genderLabels, priceBands, sortOptions, type SortValue } from "@/lib/catalog/labels";
import type { ProductSummary } from "@/lib/catalog/summary";
import type { Collection } from "@/lib/types";
import { cn, pluralize } from "@/lib/utils";

import { FilterOptions } from "./filter-options";

interface ShopViewProps {
  products: ProductSummary[];
  collections: Collection[];
  /** When set, the view is scoped to one collection (collection pages). */
  lockedCollection?: string;
}

/**
 * Catalogue browser. State lives in the URL (shareable, back-button friendly,
 * crawlable); the filtering itself is the pure `applyShopFilters`.
 */
export function ShopView({ products, collections, lockedCollection }: ShopViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const slugs = useMemo(() => collections.map((c) => c.slug), [collections]);
  const urlKey = searchParams.toString();
  const urlFilters = useMemo(() => {
    const parsed = parseShopFilters(searchParams, slugs);
    return lockedCollection ? { ...parsed, collection: lockedCollection } : parsed;
  }, [searchParams, slugs, lockedCollection]);

  // Local state is the source of truth so the UI responds instantly and rapid
  // toggles build on each other. URLs we pushed ourselves are queued in `pending`
  // and ignored as they land; any other URL change (back button, header search)
  // re-syncs from the URL — the "adjust state when a prop changes" pattern.
  const [state, setState] = useState<{ key: string; pending: string[]; filters: ShopFilters }>({
    key: urlKey,
    pending: [],
    filters: urlFilters,
  });
  if (urlKey !== state.key) {
    const index = state.pending.indexOf(urlKey);
    setState(
      index === -1
        ? { key: urlKey, pending: [], filters: urlFilters }
        : { key: urlKey, pending: state.pending.slice(index + 1), filters: state.filters },
    );
  }
  const filters = state.filters;

  const results = useMemo(() => applyShopFilters(products, filters), [products, filters]);
  const activeCount = countActiveFilters(filters, Boolean(lockedCollection));

  const update = (patch: Partial<ShopFilters>) => {
    const next = { ...filters, ...patch };
    if (lockedCollection) next.collection = null;
    const params = filtersToSearchParams(next).toString();
    setVisible(PAGE_SIZE);
    const resolved = lockedCollection ? { ...next, collection: lockedCollection } : next;
    setState((current) => ({ ...current, pending: [...current.pending, params], filters: resolved }));
    startTransition(() => router.replace(params ? `${pathname}?${params}` : pathname, { scroll: false }));
  };

  const clearAll = () => {
    update({ q: "", gender: [], family: [], concentration: [], price: null, collection: null });
  };

  const chips = [
    ...(!lockedCollection && filters.collection
      ? [{ key: "collection", label: collections.find((c) => c.slug === filters.collection)?.title ?? "", clear: () => update({ collection: null }) }]
      : []),
    ...filters.gender.map((g) => ({ key: `g-${g}`, label: genderLabels[g], clear: () => update({ gender: filters.gender.filter((x) => x !== g) }) })),
    ...filters.family.map((f) => ({ key: `f-${f}`, label: familyLabels[f], clear: () => update({ family: filters.family.filter((x) => x !== f) }) })),
    ...filters.concentration.map((c) => ({
      key: `c-${c}`,
      label: concentrationLabels[c],
      clear: () => update({ concentration: filters.concentration.filter((x) => x !== c) }),
    })),
    ...(filters.price ? [{ key: "price", label: priceBands.find((b) => b.value === filters.price)?.label ?? "", clear: () => update({ price: null }) }] : []),
    ...(filters.q ? [{ key: "q", label: `“${filters.q}”`, clear: () => update({ q: "" }) }] : []),
  ];

  return (
    <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-12">
      <aside aria-label="Filters" className="hidden lg:block">
        <div data-lenis-prevent className="no-scrollbar sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2 pb-8">
          <FilterOptions filters={filters} onChange={update} collections={collections} showCollections={!lockedCollection} />
          {activeCount > 0 ? (
            <button type="button" onClick={clearAll} className="mt-6 text-body-sm text-ink underline underline-offset-4">
              Clear all filters
            </button>
          ) : null}
        </div>
      </aside>

      <div>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchField key={filters.q} initial={filters.q} onSearch={(q) => update({ q })} />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 lg:hidden"
              icon={<FilterIcon size={18} />}
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
            >
              Filters{activeCount ? ` (${activeCount})` : ""}
            </Button>
            <div className="flex-1 md:w-56 md:flex-none">
              <label htmlFor="shop-sort" className="sr-only">
                Sort by
              </label>
              <Select id="shop-sort" value={filters.sort} onChange={(e) => update({ sort: e.target.value as SortValue })}>
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <p className="mr-2 text-body-sm text-smoke" aria-live="polite">
            {pluralize(results.length, "fragrance")}
          </p>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex h-8 items-center gap-1.5 rounded-[30px] bg-pearl pr-2 pl-3.5 text-caption text-ink hover:bg-mist"
              aria-label={`Remove filter ${chip.label}`}
            >
              {chip.label}
              <CloseIcon size={12} />
            </button>
          ))}
          {chips.length > 1 ? (
            <button type="button" onClick={clearAll} className="text-caption text-smoke underline underline-offset-4 hover:text-ink">
              Clear all
            </button>
          ) : null}
        </div>

        <div className={cn("mt-8 transition-opacity duration-300", isPending && "opacity-50")}>
          {results.length ? (
            <>
              <ProductGrid products={results.slice(0, visible)} columns={3} preloadFirst={2} />
              {visible < results.length ? (
                <div className="mt-14 flex flex-col items-center gap-4">
                  <p className="text-caption text-smoke">
                    Showing {Math.min(visible, results.length)} of {results.length}
                  </p>
                  <Button variant="accent" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Load more
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon={<SearchIcon size={24} />}
              title="Nothing matches — yet"
              description="Try removing a filter or searching for a note such as oud, rose or musk."
              action={
                <Button variant="outline" onClick={clearAll}>
                  Reset filters
                </Button>
              }
            />
          )}
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter & refine"
        side="bottom"
        footer={
          <div className="flex gap-2 pb-1">
            <Button variant="ghost" className="flex-1" onClick={clearAll} disabled={!activeCount}>
              Clear
            </Button>
            <Button variant="primary" className="flex-[2]" onClick={() => setSheetOpen(false)}>
              Show {pluralize(results.length, "result")}
            </Button>
          </div>
        }
      >
        <div className="px-5 py-6">
          <FilterOptions filters={filters} onChange={update} collections={collections} showCollections={!lockedCollection} />
        </div>
      </Sheet>
    </div>
  );
}

/** Keyed by the URL query so it resets when search changes elsewhere (e.g. header search). */
function SearchField({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const [query, setQuery] = useState(initial);
  const commit = () => {
    const next = query.trim().slice(0, 80);
    if (next !== initial) onSearch(next);
  };

  return (
    <form
      role="search"
      className="relative flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        commit();
      }}
    >
      <label htmlFor="shop-search" className="sr-only">
        Search the catalogue
      </label>
      <SearchIcon size={18} className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-smoke" />
      <input
        id="shop-search"
        type="search"
        enterKeyHint="search"
        maxLength={80}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={commit}
        placeholder="Search by name, house or note"
        className="h-12 w-full rounded-[var(--radius-input)] border border-mist bg-white pr-5 pl-12 text-body outline-none focus:border-ink"
      />
    </form>
  );
}
