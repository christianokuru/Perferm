import Image from "next/image";
import Link from "next/link";

import { ArtDirectedImage } from "@/components/ui/art-directed-image";
import { ButtonLink } from "@/components/ui/button";
import { Price } from "@/components/ui/misc";
import { Accent, Eyebrow } from "@/components/ui/typography";
import type { ProductSummary } from "@/lib/catalog/summary";
import { imagery, portrait } from "@/lib/images";

/** The one dark section on the page — Inkwell surface for the oud story. */
export function OudSpotlight({ product }: { product: ProductSummary }) {
  return (
    <section aria-labelledby="oud-title" className="px-2 md:px-4">
      <div className="mx-auto grid grid-cols-1 max-w-[100rem] overflow-hidden rounded-[var(--radius-image)] bg-ink text-white md:grid-cols-2">
        <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[44rem]">
          <ArtDirectedImage
            alt="Ribbons of incense smoke curling through darkness"
            mobileSrc={portrait(imagery.smoke)}
            desktopSrc={imagery.smoke}
            desktopSizes="50vw"
          />
          <Link
            href={`/product/${product.slug}`}
            className="group absolute right-4 bottom-4 left-4 flex items-center gap-4 rounded-[var(--radius-card)] bg-white p-3 text-ink md:right-auto md:bottom-8 md:left-8 md:w-80"
          >
            <span className="relative size-20 shrink-0 overflow-hidden rounded-[10px] bg-pearl">
              <Image src={portrait(product.image.src, 400)} alt="" fill sizes="80px" className="object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block text-caption text-smoke">{product.house}</span>
              <span className="block truncate text-body group-hover:underline">{product.name}</span>
              <Price amount={product.priceFrom} from={product.variantCount > 1} className="mt-1 text-body-sm" />
            </span>
          </Link>
        </div>

        <div className="flex flex-col justify-center p-6 py-14 md:p-14 lg:p-20">
          <Eyebrow className="text-white/60">The season&apos;s obsession</Eyebrow>
          <h2 id="oud-title" className="mt-5 text-[4rem] leading-[0.9] font-extralight tracking-[-0.08em] text-white md:text-[6.5rem]">
            the <Accent className="text-apricot">oud</Accent>
            <br />
            edit
          </h2>
          <p className="mt-8 max-w-md text-body text-white/75">
            Agarwood — the most precious raw material in perfumery — aged, distilled and composed into extraits, attars
            and bakhoor. Smoky, honeyed, leathered and resinous: a scent that announces you before you enter the room.
          </p>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-6">
            {[
              ["12 yrs", "oldest dehn al oud"],
              ["6", "oud signatures"],
              ["24h+", "on skin"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="text-[2rem] leading-none font-extralight tracking-[-0.06em]">{value}</dd>
                <dd className="mt-1.5 text-caption text-white/60">{label}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex flex-wrap gap-2">
            <ButtonLink href="/collections/oud" variant="accent" size="lg">
              Explore the oud edit
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
