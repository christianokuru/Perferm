import Link from "next/link";

import { familyLabels } from "@/lib/catalog/labels";
import type { ScentFamily } from "@/lib/types";
import { Accent } from "@/components/ui/typography";

const families: ScentFamily[] = ["woody", "oriental", "floral", "musky", "gourmand", "fresh", "citrus"];

/** Stat callout + scent family finder — the whisper-weight 152px moment. */
export function StatsAndFamilies() {
  return (
    <section aria-labelledby="families-title" className="border-y border-mist py-16 md:py-24">
      <div className="container-page grid grid-cols-1 gap-14 lg:grid-cols-2 lg:items-end">
        <div>
          <p className="text-display leading-[0.85] font-extralight text-ink" aria-describedby="stat-label">
            4.9
          </p>
          <p id="stat-label" className="mt-4 max-w-xs text-body-sm text-smoke">
            average rating from more than 1,600 clients across Nigeria — and counting.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-mist pt-6 sm:max-w-md">
            <div>
              <dt className="text-caption text-smoke">Same-day delivery</dt>
              <dd className="mt-1 text-heading-sm font-extralight">Lagos</dd>
            </div>
            <div>
              <dt className="text-caption text-smoke">Signatures in the house</dt>
              <dd className="mt-1 text-heading-sm font-extralight">120+</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 id="families-title" className="text-heading-sm font-light text-ink">
            find your <Accent>scent family</Accent>
          </h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {families.map((family) => (
              <li key={family}>
                <Link
                  href={`/shop?family=${family}`}
                  className="inline-flex h-11 items-center rounded-[30px] border border-mist px-5 text-body-sm text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white"
                >
                  {familyLabels[family]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
