"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EditIcon, PlusIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import { concentrationLabels } from "@/lib/catalog/labels";
import { formatNaira } from "@/lib/money";
import { useAdminStore } from "@/stores/admin-store";

import { AdminCard, AdminHeading } from "./admin-shell";

export function ProductsAdmin() {
  const products = useAdminStore((s) => s.products);
  const deleteProduct = useAdminStore((s) => s.deleteProduct);
  const upsert = useAdminStore((s) => s.upsertProduct);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => `${p.name} ${p.house}`.toLowerCase().includes(q)) : products;
  }, [products, query]);

  return (
    <>
      <AdminHeading
        title="Products"
        description={`${products.length} fragrances in the catalogue`}
        actions={
          <ButtonLink href="/admin/products/new" icon={<PlusIcon size={16} />}>
            New product
          </ButtonLink>
        }
      />
      <div className="relative mb-4 max-w-sm">
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
                          {/* eslint-disable-next-line @next/next/no-img-element -- admin previews may be uploaded data URLs */}
                          <img src={p.images[0]?.src} alt="" className="size-11 rounded-[8px] bg-pearl object-cover" loading="lazy" />
                          <span>
                            <span className="block text-ink hover:underline">{p.name}</span>
                            <span className="block text-caption text-smoke">{p.house}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-graphite">{concentrationLabels[p.concentration]}</td>
                      <td className="px-4 py-3 tabular-nums">{formatNaira(from)}</td>
                      <td className="px-4 py-3">
                        <span className={stock === 0 ? "text-danger" : stock <= 10 ? "text-saffron" : "text-graphite"}>{stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <ButtonLink href={`/admin/products/${p.id}`} variant="ghost" size="sm" icon={<EditIcon size={14} />}>
                            Edit
                          </ButtonLink>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Delete ${p.name}`}
                            onClick={() => {
                              if (!window.confirm(`Delete "${p.name}"? You can undo straight after.`)) return;
                              deleteProduct(p.id);
                              toast.show(`${p.name} deleted`, { label: "Undo", onClick: () => upsert(p) });
                            }}
                          >
                            <TrashIcon size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No products found" description="Try a different search, or create a new product." />
        )}
      </AdminCard>
    </>
  );
}
