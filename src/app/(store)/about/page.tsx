import type { Metadata } from "next";
import Image from "next/image";

import { NewsletterBand } from "@/components/home/newsletter-band";
import { PageIntro } from "@/components/shop/page-intro";
import { ButtonLink } from "@/components/ui/button";
import { Accent, Eyebrow } from "@/components/ui/typography";
import { imagery } from "@/lib/images";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Our story",
  description:
    "Perferm is Lagos' house of rare fragrance — sourcing authentic Arabian ouds, attars and niche perfumes directly from authorised houses.",
  path: "/about",
  image: { url: imagery.coffee, alt: "Arabic coffee served in a traditional setting" },
});

const values = [
  { n: "01", title: "Only the real thing", body: "Every bottle is bought from the house or its authorised distributor, sealed and batch-coded. We will never sell a decant of unknown origin." },
  { n: "02", title: "Tested in our climate", body: "Heat and humidity change everything. We wear every fragrance through a Lagos week before it earns a place on our shelves." },
  { n: "03", title: "Honest counsel", body: "Our concierge will tell you when a scent won't suit you. A fragrance should be a lifelong companion, not an impulse." },
  { n: "04", title: "Ceremony in every box", body: "Hand-wrapped, hand-written and delivered with care — because a scent is so often a gift, a promise or a celebration." },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Our story" }]}
        title={
          <>
            our <Accent>story</Accent>
          </>
        }
        lead="A house of rare fragrance, born in Lagos from a love of the Gulf's great perfume traditions and the quiet genius of independent perfumers."
      />

      <section className="px-2 md:px-4">
        <div className="mx-auto grid grid-cols-1 max-w-[100rem] gap-2 md:grid-cols-[1.4fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-image)] bg-pearl md:aspect-auto md:min-h-[36rem]">
            <Image src={imagery.coffee} alt="Arabic coffee poured in a traditional majlis" fill preload loading="eager" sizes="(min-width: 768px) 58vw, 100vw" className="object-cover" />
          </div>
          <div className="relative hidden overflow-hidden rounded-[var(--radius-image)] bg-pearl md:block">
            <Image src={imagery.brassBurner} alt="A brass incense burner with smoking resin" fill sizes="42vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="container-page grid grid-cols-1 gap-10 py-16 md:grid-cols-[1fr_1.5fr] md:py-24">
        <Eyebrow>Since 2021</Eyebrow>
        <div className="space-y-6 text-[1.4rem] leading-snug font-light tracking-[-0.03em] text-ink md:text-[1.75rem]">
          <p>
            Perferm began with a single bottle of oud carried home from Dubai — and a city that kept asking where it came from. Our founder
            started sourcing for friends, then friends of friends, until the requests filled a notebook.
          </p>
          <p className="text-graphite/75">
            Today we are a small team of fragrance obsessives in Lekki, bringing the rarest ouds, attars and niche signatures to clients in all 36
            states. We still wrap every box by hand.
          </p>
        </div>
      </section>

      <section aria-labelledby="values-title" className="border-t border-mist py-16 md:py-24">
        <div className="container-page">
          <h2 id="values-title" className="text-heading font-light text-ink">
            what we <Accent>believe</Accent>
          </h2>
          <ul className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] border border-mist bg-mist md:grid-cols-2">
            {values.map((v) => (
              <li key={v.n} className="bg-white p-6 md:p-10">
                <span className="text-[3rem] leading-none font-extralight tracking-[-0.08em] text-saffron">{v.n}</span>
                <h3 className="mt-6 text-subheading font-light text-ink">{v.title}</h3>
                <p className="mt-3 text-body-sm text-graphite/80">{v.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-wrap gap-2">
            <ButtonLink href="/shop" variant="primary" size="lg">
              Explore the house
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" size="lg">
              Visit the boutique
            </ButtonLink>
          </div>
        </div>
      </section>

      <NewsletterBand />
    </>
  );
}
