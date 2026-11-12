import Image from "next/image";
import Link from "next/link";

import { ArrowUpRightIcon } from "@/components/icons";
import { ArtDirectedImage } from "@/components/ui/art-directed-image";
import { ButtonLink } from "@/components/ui/button";
import { Accent } from "@/components/ui/typography";
import { cropTo, imagery } from "@/lib/images";

/**
 * Split editorial hero. Mobile: a single tall portrait with the headline
 * overlaid. Desktop: portrait + product still life, with a floating annotation.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="px-2 pt-2 md:px-4">
      <div className="relative mx-auto grid grid-cols-1 max-w-[100rem] gap-2 md:grid-cols-[1.35fr_1fr]">
        <div className="relative h-[calc(100svh-7.5rem)] min-h-[34rem] overflow-hidden rounded-[var(--radius-image)] bg-pearl md:h-[min(52rem,calc(100svh-7rem))]">
          <ArtDirectedImage
            alt="A woman in a vintage blue dress applying perfume to her neck"
            mobileSrc={cropTo(imagery.heroModel, 1200, 2300)}
            desktopSrc={imagery.heroModel}
            desktopSizes="58vw"
            priority
            className="object-[50%_20%] max-md:object-center"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5 pb-7 text-white md:p-10 md:pb-12">
            <p className="animate-fade-up text-caption font-medium tracking-[0.18em] uppercase">Perferm · Lagos</p>
            <h1
              id="hero-title"
              className="mt-4 animate-fade-up text-[3.4rem] leading-[0.92] font-extralight tracking-[-0.075em] text-white [animation-delay:80ms] sm:text-[4.5rem] lg:text-[6.25rem]"
            >
              the art of
              <br />
              <Accent>arabian</Accent> luxury
            </h1>
            <p className="mt-5 max-w-sm animate-fade-up text-body-sm text-white/85 [animation-delay:160ms]">
              Rare ouds, attars and niche signatures from the perfume houses of the Gulf, Paris and Grasse — delivered
              across Nigeria.
            </p>
            <div className="mt-7 flex flex-wrap gap-2 animate-fade-up [animation-delay:240ms]">
              <ButtonLink href="/shop" variant="light" size="lg">
                Shop the house
              </ButtonLink>
              <ButtonLink
                href="/collections/oud"
                variant="ghost"
                size="lg"
                className="border border-white/50 text-white hover:bg-white/10"
              >
                Discover oud
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="relative hidden overflow-hidden rounded-[var(--radius-image)] bg-ink md:block">
          <Image
            src={imagery.heroProduct}
            alt="A gilded perfume flacon glowing against golden bokeh"
            fill
            sizes="42vw"
            className="object-cover"
          />
          <Link
            href="/about"
            className="group absolute right-6 bottom-6 flex w-56 flex-col rounded-[var(--radius-card)] border border-white/25 bg-white/10 p-5 text-white backdrop-blur-xl transition-colors hover:bg-white/20"
          >
            <span className="flex items-start justify-between gap-3 text-caption leading-snug">
              Sourced only from authorised houses
              <ArrowUpRightIcon size={16} className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
            <span className="mt-10 text-[3.25rem] leading-none font-extralight tracking-[-0.08em]">100%</span>
            <span className="mt-1 text-caption text-white/75">authentic, sealed &amp; batch-coded</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
