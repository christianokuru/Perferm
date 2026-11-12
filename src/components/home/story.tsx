import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Accent, Eyebrow } from "@/components/ui/typography";
import { imagery } from "@/lib/images";

function InlineImage({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="relative mx-1 inline-block h-[0.78em] w-[1.7em] translate-y-[0.06em] overflow-hidden rounded-full align-baseline">
      <Image src={src} alt={alt} fill sizes="120px" className="object-cover" />
    </span>
  );
}

const pillars = [
  {
    title: "Sourcing",
    body: "We buy directly from the houses and their authorised distributors in Dubai, Riyadh, Paris and Grasse. Nothing grey-market, nothing decanted from unknown stock — every bottle is sealed and batch-coded.",
  },
  {
    title: "Climate",
    body: "Lagos heat and humidity change how fragrance behaves. Every scent in the house is worn and tested here before it earns a place on our shelves, and our concierge will tell you honestly how it performs.",
  },
  {
    title: "Ceremony",
    body: "Each order is wrapped by hand in our signature box with a handwritten card on request — because a fragrance is rarely just a purchase. It is a wedding, an Eid, an anniversary, a promise.",
  },
];

export function Story() {
  return (
    <section aria-labelledby="story-title" className="py-16 md:py-28">
      <div className="container-page grid grid-cols-1 gap-14 lg:grid-cols-[1.5fr_1fr] lg:gap-20">
        <div>
          <Eyebrow>Our story</Eyebrow>
          <h2
            id="story-title"
            className="mt-6 text-[2rem] leading-[1.1] font-extralight tracking-[-0.055em] text-ink md:text-[2.5rem] xl:text-[3rem]"
          >
            Perferm began with a single bottle of <Accent>oud</Accent>
            <InlineImage src={imagery.oudDark} alt="" /> carried home from Dubai — and a city that kept asking where it
            came from. Today we bring the rarest scents of the Gulf
            <InlineImage src={imagery.coffee} alt="" /> and the ateliers of Paris to <Accent>Lagos</Accent>, one
            hand-wrapped box at a time.
          </h2>
          <Link href="/about" className="group mt-10 inline-flex items-center gap-2 text-body-sm text-ink">
            <span className="border-b border-apricot">Read our story</span>
            <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="lg:pt-16">
          <Accordion>
            {pillars.map((pillar, i) => (
              <AccordionItem key={pillar.title} title={pillar.title} defaultOpen={i === 0} name="pillars">
                {pillar.body}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
