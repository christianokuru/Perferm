import type { Metadata } from "next";

import { ContactForm } from "@/components/content/contact-form";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import { PageIntro } from "@/components/shop/page-intro";
import { Accent } from "@/components/ui/typography";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact the concierge",
  description: "Speak to a Perferm fragrance concierge, visit our Lekki boutique, or get help with an order.",
  path: "/contact",
});

const channels = [
  { icon: WhatsAppIcon, label: "WhatsApp concierge", value: "Chat now — replies in minutes", href: siteConfig.contact.whatsappHref, external: true },
  { icon: PhoneIcon, label: "Call", value: siteConfig.contact.phone, href: siteConfig.contact.phoneHref },
  { icon: MailIcon, label: "Email", value: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}` },
];

export default function ContactPage() {
  const b = siteConfig.boutique;
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        title={
          <>
            the <Accent>concierge</Accent>
          </>
        }
        lead="Not sure where to begin? Tell us what you love and we'll guide you to your signature — online, on WhatsApp or in the boutique."
      />
      <div className="container-page grid grid-cols-1 gap-14 pb-24 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <div className="space-y-10">
          <ul className="space-y-2">
            {channels.map(({ icon: Icon, label, value, href, external }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex items-center gap-4 rounded-[var(--radius-card)] border border-mist p-4 transition-colors hover:border-ink"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-pearl text-ink">
                    <Icon size={20} />
                  </span>
                  <span>
                    <span className="block text-caption text-smoke">{label}</span>
                    <span className="block text-body text-ink">{value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="rounded-[var(--radius-card)] bg-pearl p-6">
            <p className="text-caption tracking-[0.14em] text-smoke uppercase">The boutique</p>
            <address className="mt-4 space-y-3 text-body-sm text-ink not-italic">
              <span className="flex gap-3">
                <PinIcon size={18} className="shrink-0" />
                {b.street}, {b.area}, {b.city}
              </span>
              <span className="flex gap-3">
                <ClockIcon size={18} className="shrink-0" />
                {b.hours} · Sundays by appointment
              </span>
            </address>
          </div>
        </div>
        <ContactForm />
      </div>
    </>
  );
}
