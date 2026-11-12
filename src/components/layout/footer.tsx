import Link from "next/link";

import { HeartIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { Accent } from "@/components/ui/typography";
import { footerNav, siteConfig } from "@/lib/config/site";

import { NewsletterForm } from "./newsletter-form";

const bigLinks = [
  { label: "arabian", href: "/collections/arabian" },
  { label: "oud", href: "/collections/oud" },
  { label: "niche", href: "/collections/niche" },
  { label: "attars", href: "/collections/attars" },
  { label: "gifting", href: "/collections/gift-sets" },
];

function LinkColumn({ title, links }: { title: string; links: ReadonlyArray<{ label: string; href: string }> }) {
  return (
    <div>
      <p className="text-caption tracking-[0.14em] text-smoke uppercase">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-body-sm text-ink hover:text-saffron">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-mist bg-white pt-14 md:pt-20">
      <div className="container-page">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="max-w-sm space-y-6">
            <p className="text-[1.4rem] leading-tight font-light tracking-[-0.04em] text-ink">
              Perferm is Lagos&apos; house of rare fragrance — <Accent>Arabian</Accent> heritage and niche artistry, delivered across Nigeria.
            </p>
            <div className="flex gap-2">
              <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Perferm on Instagram" className="flex size-11 items-center justify-center rounded-full bg-pearl text-ink hover:bg-saffron">
                <InstagramIcon size={18} />
              </a>
              <a href={siteConfig.social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="Perferm on TikTok" className="flex size-11 items-center justify-center rounded-full bg-pearl text-ink hover:bg-saffron">
                <TikTokIcon size={18} />
              </a>
              <a href={siteConfig.contact.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Chat with Perferm on WhatsApp" className="flex size-11 items-center justify-center rounded-full bg-pearl text-ink hover:bg-saffron">
                <WhatsAppIcon size={18} />
              </a>
            </div>
          </div>

          <nav aria-label="Collections">
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {bigLinks.map((link, i) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[2.6rem] leading-[1.05] font-extralight tracking-[-0.06em] text-ink transition-colors hover:text-saffron md:text-[3.25rem]"
                  >
                    {i === 1 ? <Accent>{link.label}</Accent> : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 border-t border-mist pt-10 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.6fr]">
          <LinkColumn title="Shop" links={footerNav.shop} />
          <LinkColumn title="Client care" links={footerNav.care} />
          <div className="space-y-8">
            <LinkColumn title="The house" links={footerNav.house} />
            <address className="text-body-sm leading-relaxed text-graphite not-italic">
              {siteConfig.boutique.street}, {siteConfig.boutique.area}
              <br />
              {siteConfig.boutique.city} · {siteConfig.boutique.hours}
              <br />
              <a href={siteConfig.contact.phoneHref} className="hover:text-saffron">
                {siteConfig.contact.phone}
              </a>
            </address>
          </div>
          <div>
            <p className="text-caption tracking-[0.14em] text-smoke uppercase">The inner circle</p>
            <p className="mt-4 text-body-sm text-graphite">
              First access to new arrivals, private sales and the stories behind each scent. No noise — one letter a month.
            </p>
            <NewsletterForm className="mt-5" />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-mist py-6 text-caption text-smoke md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <p>© {siteConfig.legalName}. All rights reserved. Prices in Nigerian Naira (₦).</p>
            <p className="flex items-center gap-1.5 text-graphite">
              Made with love
              <HeartIcon size={12} filled className="text-saffron" />
              by{" "}
              {/* Followed link (no nofollow) so the credit counts as a backlink to the developer's portfolio. */}
              <a
                href={siteConfig.developer.url}
                target="_blank"
                rel="noopener author"
                className="font-medium text-ink underline decoration-apricot underline-offset-4 transition-colors hover:text-saffron"
              >
                {siteConfig.developer.name}
              </a>
            </p>
          </div>
          <ul className="flex gap-5">
            {footerNav.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>Secure payments by Paystack &amp; Flutterwave</li>
          </ul>
        </div>
      </div>

      <div aria-hidden="true" className="overflow-hidden">
        <p className="-mb-[0.18em] text-center text-[23vw] leading-[0.8] font-extralight tracking-[-0.09em] text-ink select-none">
          perferm
        </p>
      </div>
    </footer>
  );
}
