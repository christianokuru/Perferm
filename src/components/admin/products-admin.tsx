"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { setProductArchived } from "@/app/actions/admin";
import { EditIcon, EyeIcon, PlusIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import { concentrationLabels } from "@/lib/catalog/labels";
import { formatNaira } from "@/lib/money";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

import { AdminCard, AdminHeading } from "./admin-shell";

export function ProductsAdmin({ products }: { products: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [pending, startTransition] = useTransition();

  const live = products.filter((p) => !p.archived);
  const archivedCount = products.length - live.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = products.filter((p) => Boolean(p.archived) === showArchived);
    return q ? pool.filter((p) => `${p.name} ${p.house}`.toLowerCase().includes(q)) : pool;
  }, [products, query, showArchived]);

  const setArchived = (p: Product, archived: boolean) =>
    startTransition(async () => {
      const result = await setProductArchived(p.id, archived);
      if (!result.ok) return void toast.error(result.error ?? "We couldn't update this product.");
      router.refresh();
      toast.show(archived ? `${p.name} archived — hidden from the shop` : `${p.name} restored to the shop`, archived ? { label: "Undo", onClick: () => setArchived(p, false) } : undefined);
    });

  return (
    <>
      <AdminHeading
        title="Products"
        description={`${live.length} live fragrances${archivedCount ? ` · ${archivedCount} archived` : ""}`}
        actions={
          <ButtonLink href="/admin/products/new" icon={<PlusIcon size={16} />}>
            New product
          </ButtonLink>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-sm">
        <SearchIcon size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-smoke" />
        <label htmlFor="admin-product-search" className="sr-only">
          Search products
        </label>
        <input
          id="admin-product-search"
          type="search"
          value={query}
          maxLength={80}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or house"
          className="h-11 w-full rounded-full border border-mist bg-white pr-4 pl-10 text-body-sm outline-none focus:border-ink"
        />
      </div>
        <div className="flex gap-1">
          {[false, true].map((archived) => (
            <button
              key={String(archived)}
              type="button"
              aria-pressed={showArchived === archived}
              onClick={() => setShowArchived(archived)}
              className={cn("h-9 rounded-full px-4 text-body-sm", showArchived === archived ? "bg-ink text-white" : "bg-white text-ink hover:bg-mist")}
            >
              {archived ? `Archived (${archivedCount})` : `Live (${live.length})`}
            </button>
          ))}
        </div>
      </div>

      <AdminCard className="overflow-hidden">
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-body-sm">
              <thead className="border-b border-mist bg-pearl/60 text-caption text-smoke">
                <tr>
                  <th scope="col" className="px-4 py-3 font-normal">Product</th>
                  <th scope="col" className="px-4 py-3 font-normal">Type</th>
                  <th scope="col" className="px-4 py-3 font-normal">Price</th>
                  <th scope="col" className="px-4 py-3 font-normal">Stock</th>
                  <th scope="col" className="px-4 py-3 text-right font-normal">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {filtered.map((p) => {
                  const stock = p.variants.reduce((n, v) => n + v.stock, 0);
                  const from = Math.min(...p.variants.map((v) => v.price));
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail */}
                          <img src={p.images[0]?.src} alt="" className="size-11 rounded-[8px] bg-pearl object-cover" loading="lazy" />
                          <span>
                            <span className="block text-ink hover:underline">{p.name}</span>
                            <span className="block text-caption text-smoke">{p.house}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-graphite">{concentrationLabels[p.concentration]}</td>
                      <td className="px-4 py-3 tabular-nums">{p.variants.length ? formatNaira(from) : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={stock === 0 ? "text-danger" : stock <= 10 ? "text-saffron" : "text-graphite"}>{stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <ButtonLink href={`/admin/products/${p.id}`} variant="ghost" size="sm" icon={<EditIcon size={14} />}>
                            Edit
                          </ButtonLink>
                          {p.archived ? (
                            <Button variant="ghost" size="sm" disabled={pending} icon={<EyeIcon size={14} />} onClick={() => setArchived(p, false)}>
                              Restore
                            </Button>
                          ) : (
                            <>
                              <ButtonLink href={`/product/${p.slug}`} variant="ghost" size="sm" aria-label={`View ${p.name} in the shop`}>
                                <EyeIcon size={14} />
                              </ButtonLink>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={pending}
                                aria-label={`Archive ${p.name}`}
                                onClick={() => {
                                  if (window.confirm(`Archive "${p.name}"? It disappears from the shop; orders keep their history.`)) setArchived(p, true);
                                }}
                              >
                                <TrashIcon size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={showArchived ? "Nothing archived" : "No products found"} description={showArchived ? "Archived products appear here." : "Try a different search, or create a new product."} />
        )}
      </AdminCard>
    </>
  );
}
