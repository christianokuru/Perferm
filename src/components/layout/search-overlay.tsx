"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { ArrowRightIcon, CloseIcon, SearchIcon } from "@/components/icons";
import { ProductImage } from "@/components/product/product-image";
import { IconButton } from "@/components/ui/icon-button";
import { Price } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import type { ProductSummary } from "@/lib/catalog/summary";
import { useUiStore } from "@/stores/ui-store";

const suggestions = ["Oud", "Rose", "Attar", "Musk", "Saffron", "Gift set", "Vanilla"];

type Status = "idle" | "loading" | "done" | "error";

export function SearchOverlay() {
  const isOpen = useUiStore((s) => s.panel === "search");
  const close = useUiStore((s) => s.close);

  return (
    <Sheet open={isOpen} onClose={close} title="Search" side="full" hideHeader>
      {isOpen ? <SearchPanel onClose={close} /> : null}
    </Sheet>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const trimmed = query.trim();

  useEffect(() => {
    if (!trimmed) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { results: ProductSummary[] };
        setResults(data.results);
        setStatus("done");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("error");
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed) return;
    onClose();
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  };

  const showResults = Boolean(trimmed);

  return (
    <div className="container-page max-w-3xl pt-4 pb-10 md:pt-10">
      <div className="flex items-center justify-end">
        <IconButton label="Close search" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>

      <form role="search" onSubmit={submit} className="mt-6">
        <label htmlFor="site-search" className="sr-only">
          Search fragrances
        </label>
        <div className="flex items-center gap-3 border-b border-ink pb-3">
          <SearchIcon size={24} className="shrink-0 text-smoke" />
          <input
            id="site-search"
            data-autofocus
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            maxLength={80}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search oud, rose, attar…"
            className="min-w-0 flex-1 bg-transparent text-[1.75rem] font-extralight tracking-[-0.05em] text-ink outline-none placeholder:text-smoke/60 md:text-[2.5rem]"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} className="text-caption text-smoke hover:text-ink">
              Clear
            </button>
          ) : null}
        </div>
      </form>

      {!showResults ? (
        <div className="mt-10">
          <p className="text-caption tracking-[0.14em] text-smoke uppercase">Popular searches</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setQuery(s)}
                  className="rounded-[30px] border border-mist px-4 py-2 text-body-sm text-ink transition-colors hover:border-ink"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-8" aria-live="polite" aria-busy={status === "loading"}>
          {status === "error" ? (
            <p className="text-body-sm text-danger">Search is unavailable right now. Please try again.</p>
          ) : status === "done" && results.length === 0 ? (
            <p className="text-body-sm text-smoke">
              No fragrances match “{trimmed}”. Try a note like <em>oud</em> or <em>rose</em>.
            </p>
          ) : (
            <ul className="divide-y divide-mist">
              {results.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${p.slug}`} onClick={onClose} className="group flex items-center gap-4 py-3">
                    <ProductImage src={p.image.src} alt="" sizes="64px" className="size-16 shrink-0 rounded-[10px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-caption text-smoke">{p.house}</span>
                      <span className="block truncate text-body text-ink">{p.name}</span>
                    </span>
                    <Price amount={p.priceFrom} from={p.variantCount > 1} className="text-body-sm" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {results.length > 0 ? (
            <button
              type="button"
              onClick={submit}
              className="group mt-6 inline-flex items-center gap-2 text-body-sm text-ink"
            >
              <span className="border-b border-apricot">See all results for “{trimmed}”</span>
              <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
