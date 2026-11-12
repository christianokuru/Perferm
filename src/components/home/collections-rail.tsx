import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon, GiftIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { Accent } from "@/components/ui/typography";
import { portrait } from "@/lib/images";
import type { Collection } from "@/lib/types";

const trust = [
  { icon: ShieldIcon, label: "Authentic, batch-coded" },
  { icon: GiftIcon, label: "Hand gift-wrapped" },
  { icon: TruckIcon, label: "Delivery to 36 states + FCT" },
];

export function CollectionsRail({ collections }: { collections: Collection[] }) {
  return (
    <section aria-labelledby="collections-title" className="py-14 md:py-20">
      <div className="container-page">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="collections-title" className="text-heading font-light text-ink">
            our signature
            <br />
            <Accent>collections</Accent>
          </h2>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-body-sm text-graphite">
                <Icon size={20} />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ul className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4 md:scroll-px-6 md:px-6 xl:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        {collections.map((collection, i) => (
          <li key={collection.slug} className="relative w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]">
            <Link
              href={`/collections/${collection.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-image)] bg-pearl"
            >
              <Image
                src={portrait(collection.image.src)}
                alt={collection.image.alt}
                fill
                sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 78vw"
                className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-silk)] group-hover:scale-[1.04]"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
                <div>
                  <span className="text-caption text-white/80">0{i + 1} — the</span>
                  <p className="text-[2.4rem] leading-none font-extralight tracking-[-0.06em]">
                    <Accent>{collection.accent}</Accent>
                  </p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-full bg-white text-ink transition-transform duration-500 group-hover:-rotate-45">
                  <ArrowRightIcon size={16} />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
