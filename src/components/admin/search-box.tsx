"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { SearchIcon } from "@/components/icons";

/** Search field that writes `?q=` (and resets paging) for server-rendered admin lists. */
export function SearchBox({ placeholder, defaultValue }: { placeholder: string; defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(params.toString());
    next.delete("page");
    if (value.trim()) next.set("q", value.trim().slice(0, 80));
    else next.delete("q");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <form role="search" onSubmit={onSubmit} className="relative w-full max-w-sm">
      <SearchIcon size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-smoke" />
      <label htmlFor="admin-search" className="sr-only">
        {placeholder}
      </label>
      <input
        id="admin-search"
        type="search"
        value={value}
        maxLength={80}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-mist bg-white pr-4 pl-10 text-body-sm outline-none focus:border-ink"
      />
    </form>
  );
}
