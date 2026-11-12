export const siteConfig = {
  name: "Perferm",
  legalName: "Perferm Fragrance House Ltd.",
  tagline: "Arabian & niche luxury perfumery",
  description:
    "Perferm is Lagos' house of rare fragrance — authentic Arabian ouds, attars and niche luxury perfumes, delivered across all 36 states of Nigeria.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_NG",
  currency: "NGN",
  contact: {
    email: "concierge@perferm.ng",
    phone: "+234 801 234 5678",
    phoneHref: "tel:+2348012345678",
    whatsappHref: "https://wa.me/2348012345678",
  },
  boutique: {
    name: "Perferm Boutique, Lekki",
    street: "12 Admiralty Way",
    area: "Lekki Phase 1",
    city: "Lagos",
    region: "Lagos",
    country: "NG",
    hours: "Mon – Sat, 10:00 – 19:00",
  },
  social: {
    instagram: "https://instagram.com/perferm",
    tiktok: "https://tiktok.com/@perferm",
  },
  /** Website designer & developer — surfaced in the footer, meta author tags and JSON-LD. */
  developer: {
    name: "Okuru Christian",
    url: "https://okuru-christian.vercel.app/",
  },
  announcements: [
    "Delivery to all 36 states + FCT",
    "Complimentary gift wrapping on every order",
    "100% authentic — sourced from authorised houses",
  ],
} as const;

export const mainNav = [
  { label: "Shop all", href: "/shop" },
  { label: "Arabian", href: "/collections/arabian" },
  { label: "Oud", href: "/collections/oud" },
  { label: "Niche", href: "/collections/niche" },
  { label: "Attars", href: "/collections/attars" },
  { label: "Gifts", href: "/collections/gift-sets" },
] as const;

export const footerNav = {
  shop: [
    { label: "New arrivals", href: "/shop?sort=newest" },
    { label: "Bestsellers", href: "/shop?sort=popular" },
    { label: "For her", href: "/shop?gender=her" },
    { label: "For him", href: "/shop?gender=him" },
    { label: "Unisex", href: "/shop?gender=unisex" },
  ],
  care: [
    { label: "Delivery", href: "/delivery" },
    { label: "Returns", href: "/returns" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ],
  house: [
    { label: "Our story", href: "/about" },
    { label: "Account", href: "/account" },
    { label: "Wishlist", href: "/wishlist" },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
} as const;
