import { NewsletterForm } from "@/components/layout/newsletter-form";
import { Accent } from "@/components/ui/typography";

/** Tangerine promotional surface — the one place orange owns a whole region. */
export function NewsletterBand() {
  return (
    <section aria-labelledby="newsletter-title" className="px-2 pb-2 md:px-4 md:pb-4">
      <div className="mx-auto grid grid-cols-1 max-w-[100rem] gap-8 rounded-[var(--radius-image)] bg-saffron-bright px-6 py-14 md:grid-cols-2 md:items-end md:px-14 md:py-20">
        <h2 id="newsletter-title" className="text-[3rem] leading-[0.92] font-extralight tracking-[-0.07em] text-ink md:text-[4.5rem]">
          join the
          <br />
          <Accent>inner circle</Accent>
        </h2>
        <div className="max-w-md md:justify-self-end">
          <p className="text-body text-ink/85">
            Early access to rare arrivals, private sales and invitations to boutique evenings in Lagos. One letter a month —
            never more.
          </p>
          <NewsletterForm tone="saffron" className="mt-6" />
        </div>
      </div>
    </section>
  );
}
