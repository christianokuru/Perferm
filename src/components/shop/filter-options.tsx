"use client";

import { concentrationLabels, familyLabels, genderLabels, priceBands } from "@/lib/catalog/labels";
import type { ShopFilters } from "@/lib/catalog/filters";
import type { Collection, Concentration, Gender, ScentFamily } from "@/lib/types";
import { cn } from "@/lib/utils";

type ArrayKey = "gender" | "family" | "concentration";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center rounded-[30px] border px-4 text-body-sm transition-colors duration-200",
        active ? "border-ink bg-ink text-white" : "border-mist text-ink hover:border-graphite/40",
      )}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-mist py-6 first:pt-0">
      <legend className="mb-4 text-caption tracking-[0.14em] text-smoke uppercase">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** Shared filter controls used by the desktop sidebar and the mobile sheet. */
export function FilterOptions({
  filters,
  onChange,
  collections,
  showCollections,
}: {
  filters: ShopFilters;
  onChange: (patch: Partial<ShopFilters>) => void;
  collections: Collection[];
  showCollections: boolean;
}) {
  const toggle = <K extends ArrayKey>(key: K, value: ShopFilters[K][number]) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ [key]: next } as Partial<ShopFilters>);
  };

  return (
    <div>
      {showCollections ? (
        <Group title="Collection">
          {collections.map((c) => (
            <Chip
              key={c.slug}
              active={filters.collection === c.slug}
              onClick={() => onChange({ collection: filters.collection === c.slug ? null : c.slug })}
            >
              {c.title}
            </Chip>
          ))}
        </Group>
      ) : null}

      <Group title="For">
        {(Object.keys(genderLabels) as Gender[]).map((g) => (
          <Chip key={g} active={filters.gender.includes(g)} onClick={() => toggle("gender", g)}>
            {genderLabels[g]}
          </Chip>
        ))}
      </Group>

      <Group title="Scent family">
        {(Object.keys(familyLabels) as ScentFamily[]).map((f) => (
          <Chip key={f} active={filters.family.includes(f)} onClick={() => toggle("family", f)}>
            {familyLabels[f]}
          </Chip>
        ))}
      </Group>

      <Group title="Type">
        {(Object.keys(concentrationLabels) as Concentration[]).map((c) => (
          <Chip key={c} active={filters.concentration.includes(c)} onClick={() => toggle("concentration", c)}>
            {concentrationLabels[c]}
          </Chip>
        ))}
      </Group>

      <Group title="Price">
        {priceBands.map((band) => (
          <Chip
            key={band.value}
            active={filters.price === band.value}
            onClick={() => onChange({ price: filters.price === band.value ? null : band.value })}
          >
            {band.label}
          </Chip>
        ))}
      </Group>
    </div>
  );
}
