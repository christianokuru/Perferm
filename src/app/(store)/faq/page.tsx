import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { PageIntro } from "@/components/shop/page-intro";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button";
import { Accent } from "@/components/ui/typography";
import { faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Frequently asked questions",
  description: "Authenticity, delivery across Nigeria, payment with Paystack and Flutterwave, returns and fragrance care — answered.",
  path: "/faq",
});

const groups: Array<{ title: string; items: Array<{ question: string; answer: string }> }> = [
  {
    title: "Authenticity",
    items: [
      { question: "Are your perfumes authentic?", answer: "Yes — always. We buy only from the perfume houses themselves and their authorised distributors. Every bottle arrives sealed with its original batch code, which you can verify with the house." },
      { question: "Do you sell decants or testers?", answer: "We don't sell decants of unknown origin. Our discovery sets use vials filled by the houses themselves, and testers are available to try in the boutique." },
    ],
  },
  {
    title: "Delivery & pickup",
    items: [
      { question: "Where do you deliver?", answer: "To all 36 states and the FCT. Lagos orders arrive same or next day; most other states within 2–6 working days. The fee for your state is shown at checkout." },
      { question: "Can I collect my order?", answer: "Yes. Choose boutique pickup at checkout — it's free — and we'll message you when your order is wrapped and ready, usually within two hours." },
      { question: "Is gift wrapping really free?", answer: "Every order is wrapped by hand in our signature box at no charge. Add a gift note in the delivery notes and we'll handwrite it." },
    ],
  },
  {
    title: "Payment",
    items: [
      { question: "How can I pay?", answer: "Securely via Paystack or Flutterwave — debit and credit cards, bank transfer and USSD. We never see or store your card details." },
      { question: "Is it safe to pay online?", answer: "Payments are processed on Paystack's and Flutterwave's PCI-DSS certified infrastructure, and every order is verified with the provider before it is dispatched." },
    ],
  },
  {
    title: "Returns & care",
    items: [
      { question: "Can I return a perfume?", answer: "Unopened bottles with their seal intact can be returned within 7 days of delivery. For hygiene reasons we can't accept opened fragrances unless they arrived damaged." },
      { question: "How should I store my fragrance?", answer: "Away from sunlight and heat — never in a hot car. A cool drawer or cupboard keeps a perfume beautiful for years. Attars benefit from being stored upright and tightly capped." },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(groups.flatMap((g) => g.items))} />
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
        title={
          <>
            good <Accent>questions</Accent>
          </>
        }
        lead="Everything you need to know about authenticity, delivery, payment and caring for your fragrance."
      />
      <div className="container-page space-y-14 pb-24">
        {groups.map((group) => (
          <section key={group.title} className="grid grid-cols-1 gap-6 md:grid-cols-[16rem_1fr]" aria-label={group.title}>
            <h2 className="text-subheading font-light text-ink">{group.title}</h2>
            <Accordion>
              {group.items.map((item) => (
                <AccordionItem key={item.question} title={item.question}>
                  {item.answer}
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
        <div className="rounded-[var(--radius-card)] bg-pearl p-8">
          <p className="text-subheading font-light text-ink">Still wondering?</p>
          <p className="mt-2 text-body-sm text-smoke">Our concierge is a message away.</p>
          <ButtonLink href="/contact" className="mt-6">
            Ask the concierge
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
