# Perferm — Maison de Parfum

A mobile-first, installable (PWA) luxury storefront for Arabian and niche perfumery in Nigeria. Built with Next.js 16 (App Router, Cache Components, React Compiler), Tailwind CSS v4, Zustand and Zod.

The design follows an editorial "gallery" system: a white canvas, whisper-weight Onest display type with an Instrument Serif italic accent, one saffron accent colour, hairline borders, pill actions and no shadows.

## Quick start

```bash
cp .env.example .env.local   # then fill in values as needed
npm install
npm run dev                  # http://localhost:3000
```

Production build (the service worker only registers in production):

```bash
npm run build && npm run start
```

## What's included

| Area | Routes |
| --- | --- |
| Storefront | `/`, `/shop` (search, filters and sort, all held in the URL), `/collections/[slug]`, `/product/[slug]` |
| Commerce | Bag drawer and `/cart`, `/checkout` (state-based delivery or free pickup, Paystack / Flutterwave), `/checkout/success`, `/wishlist` |
| Accounts | `/login`, `/register`, `/forgot-password`, `/account` (overview, orders and order tracking, addresses, settings) |
| Admin | `/admin` (dashboard, product CRUD with image upload, orders and status, customers, delivery fees per state, store settings) |
| Content | `/about`, `/contact`, `/faq`, `/delivery`, `/returns`, `/privacy`, `/terms`, `/offline`, 404 |
| SEO and PWA | Per-page metadata and canonicals, Product / Breadcrumb / FAQ / Organization / WebSite JSON-LD, sitemap, robots, OG image, manifest with app icons and shortcuts, offline-capable service worker |

## Architecture

```
src/
  app/                 routes: (store) storefront, (auth) sign-in flows, admin, api, actions (server actions)
  components/          UI by domain: ui/ primitives, layout/, product/, shop/, cart/, checkout/, account/, admin/ …
  lib/
    catalog/           repository (the only data-access layer), pure filters, labels, summaries
    checkout/pricing   authoritative server-side pricing (server-only)
    validation/        Zod schemas shared by client and server
    payments/          Paystack / Flutterwave inline adapters
    data/              seed catalogue, collections, delivery zones, reviews
  stores/              Zustand stores (cart, wishlist, auth, orders, admin, ui)
  proxy.ts             real 404s for unknown product and collection slugs
```

To move to Supabase, change `lib/catalog/repository.ts`, `lib/checkout/pricing.ts`, the server actions and the stores. Components don't change.

## Security

- **Server-authoritative pricing:** the browser sends only product IDs and quantities, and the server re-prices every order from the catalogue. A price tampered with in localStorage is ignored, and the bag is corrected to the server price.
- **Validation:** all input is validated with Zod on both client and server. Query parameters are checked against allow-lists.
- **Rate limiting** on search, checkout, contact and newsletter. **Honeypots** on the public forms.
- **Strict headers:** CSP (locked to the payment and image hosts), HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy and Permissions-Policy. `noindex` on the private areas.
- **Login protections:** redirects after login accept only internal paths (no open redirects). Login errors are generic, so they don't reveal which accounts exist.
- **Escaped structured data:** JSON-LD output is escaped so content can't break out of the script tag.
- **Card data never touches this app:** only *public* gateway keys live in the browser.

### Demo mode — what changes with Supabase

Until a backend is connected:

- **Auth:** accounts, orders and admin edits are stored in the browser through a demo adapter. Passwords are PBKDF2-hashed, with lockout after 5 failed attempts. This is **not a security boundary**.
- **Admin edits stay in the browser:** they don't reach the storefront or checkout yet. Checkout always prices orders on the server.

Before going live:

1. Replace the demo auth adapter with Supabase Auth, and enforce `/admin` and `/account` server-side (proxy + RLS).
2. Create orders as `pending` server-side, and mark them paid only after **verifying the Paystack / Flutterwave webhook and verify endpoint** with the *secret* keys. Never trust the client callback.
3. Swap the in-memory rate limiter for Redis or Upstash.
4. Replace the Pexels placeholder photography with the house's own product shots.

## Testing notes

- **Payments:** with no public keys set, checkout uses a clearly labelled *demo gateway* (approve, decline or cancel). Add `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (`pk_test_…`) or `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` (`FLWPUBK_TEST-…`) to use the real inline test checkouts.
- **Admin access (demo):** register with an email listed in `NEXT_PUBLIC_DEMO_ADMIN_EMAILS` (default `admin@perferm.ng`) to get the admin role.
- **Accounts:** the demo accounts used in browser testing live only in that browser's localStorage. Clear site data to reset.
- **Checks:** `npm run lint` and `npm run build` must pass, with zero warnings.
