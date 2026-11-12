# Perferm — Maison de Parfum

A mobile-first, installable (PWA) luxury storefront for Arabian and niche perfumery in Nigeria. Built with Next.js 16 (App Router, Cache Components, React Compiler), Supabase (Postgres, Auth, Storage), Tailwind CSS v4, Zustand and Zod. Payments through Paystack and Flutterwave, emails through Resend.

The design follows an editorial "gallery" system: a white canvas, whisper-weight Onest display type with an Instrument Serif italic accent, one saffron accent colour, hairline borders, pill actions and no shadows.

## Quick start

```bash
cp .env.example .env.local   # fill in Supabase, payment and email keys
npm install
npm run dev                  # http://localhost:3000
```

Production build (the service worker only registers in production):

```bash
npm run build && npm run start
```

### Database

The schema lives in `supabase/migrations/` (apply in order) and the starter catalogue in `supabase/seed.sql`. Background jobs (expiring unpaid checkouts, purging rate-limit rows) run on `pg_cron`.

**First admin:** sign up on the site, then in the Supabase SQL editor run
`update public.profiles set role = 'admin' where email = 'you@example.com';`
After that, admins can promote others from **Admin → Customers**.

## What's included

| Area | Routes |
| --- | --- |
| Storefront | `/`, `/shop` (search, filters and sort, all held in the URL), `/collections/[slug]`, `/product/[slug]` (verified-purchase reviews) |
| Commerce | Bag drawer and `/cart`, `/checkout` (state-based delivery or free pickup, Paystack / Flutterwave), `/checkout/success`, `/track` (guest order tracking), `/wishlist` (synced to the account) |
| Accounts | `/login`, `/register` (email confirmation), `/forgot-password`, `/reset-password`, `/auth/callback`, `/auth/confirm`, `/account` (overview, orders with history, addresses, profile, email, password, sign out everywhere, delete account) |
| Admin | `/admin` dashboard (revenue, 14-day chart, alerts, low stock, best sellers), products (create/edit/archive, Storage uploads), orders (search, filters, status workflow, internal notes), customers (search, roles), reviews (moderation), messages + newsletter CSV export, delivery fees per state, store settings |
| Webhooks | `/api/webhooks/paystack`, `/api/webhooks/flutterwave` |
| SEO and PWA | Per-page metadata and canonicals, Product / Breadcrumb / FAQ / Organization / WebSite JSON-LD, sitemap, robots, OG image, manifest, offline-capable service worker |

## Architecture

```
src/
  app/                 routes; actions/ = server actions (checkout, account, admin, reviews, wishlist, contact…)
  components/          UI by domain: ui/ primitives, layout/, product/, shop/, cart/, checkout/, account/, admin/ …
  lib/
    auth/session.ts    Data Access Layer: verified session (getClaims), requireViewer / requireAdmin
    supabase/          clients: server (as the user, RLS), client (browser), admin (service role), public (cached reads), proxy
    catalog/           cached public catalogue reads + mappers (tagged; admin edits call updateTag)
    checkout/          live server-side pricing and checkout config
    orders/            order reads for customers, guests (secret key) and admins
    payments/server/   gateway verification, idempotent confirmation, webhook log
    email/             Resend sender, escaped templates, notifications
    admin/queries.ts   admin reads (never cached)
  stores/              Zustand: cart, wishlist, session mirror, ui
  proxy.ts             session refresh, private-area gate, real 404s for unknown slugs
supabase/migrations    schema, functions, RLS + grants, storage, cron
```

## Security model

- **Postgres is the boundary.** Every table has RLS. Anonymous and signed-in roles are default-deny with column-level grants; customers can only touch their own rows, and roles can never be self-assigned.
- **Server-authoritative money.** The browser sends only variant IDs and quantities. Pricing is read live from the database and re-checked inside `create_order()`; a tampered price is ignored and the bag is corrected.
- **Payments are verified, never trusted.** Orders start `pending`. They become `paid` only after a server-to-server check with the gateway (amount, currency, reference), through the idempotent `confirm_order_payment()`. That function locks the order and decrements stock exactly once, so a redirect racing a webhook is safe. Webhooks are authenticated (Paystack HMAC-SHA512, Flutterwave `verif-hash`) and de-duplicated.
- **Admin actions** re-verify the admin role on the server and run as the admin's own session, so RLS and the `SECURITY DEFINER` checks are a second gate. The order state machine is enforced in SQL, and admin changes are written to `audit_log`.
- **Guests** view their confirmation with a random secret whose hash is stored on the order, compared in constant time. `/track` needs reference + email, is rate-limited, and masks the address and phone.
- **Rate limits** are shared across instances (Postgres) and keyed by hashed IP: search, quote, checkout, verify, contact, newsletter, tracking, reviews, wishlist, account changes.
- **Auth** runs from the browser, so Supabase's per-IP protections see real visitors. Redirects accept same-origin paths only, sign-in errors are generic, and password changes and account deletion require the current password.
- **Headers:** CSP (locked to Supabase and the payment hosts), HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy and Permissions-Policy. `noindex` and `no-store` on private pages. CSV exports neutralise formula injection.

## Environment

See `.env.example`. Secrets (`SUPABASE_SECRET_KEY`, `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_HASH`, `RESEND_API_KEY`) are server-only and must never use the `NEXT_PUBLIC_` prefix. A gateway goes live only when **both** its public and secret keys are set. Otherwise checkout offers a clearly labelled test-payment screen, but only if `PAYMENTS_DEMO_MODE=true` (on by default in development, off in production).

## Checks

`npm run lint` and `npm run build` must pass with zero warnings. After schema changes, run the Supabase security advisor.
