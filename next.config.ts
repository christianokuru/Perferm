import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Hosts the browser may talk to. Kept in one place so the CSP, image
 * optimiser and payment adapters stay in sync.
 */
const PAYMENT_SCRIPT_HOSTS = ["https://js.paystack.co", "https://checkout.flutterwave.com"];
const PAYMENT_FRAME_HOSTS = [
  "https://checkout.paystack.com",
  "https://*.paystack.co",
  "https://checkout.flutterwave.com",
  "https://*.flutterwave.com",
];
const PAYMENT_API_HOSTS = ["https://api.paystack.co", "https://*.paystack.co", "https://*.flutterwave.com"];

/**
 * Static CSP (no nonces) so every storefront page can stay prerendered and
 * CDN-cacheable. `unsafe-inline` for scripts is required by Next's inline
 * bootstrap when not using nonces; everything else is locked to known hosts.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${PAYMENT_SCRIPT_HOSTS.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.pexels.com",
  "font-src 'self' data:",
  `connect-src 'self' ${PAYMENT_API_HOSTS.join(" ")}${isDev ? " ws: wss:" : ""}`,
  `frame-src ${PAYMENT_FRAME_HOSTS.join(" ")}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Payment popups (Paystack / Flutterwave) need to keep an opener reference.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self)",
  },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "images.pexels.com", pathname: "/photos/**" }],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/account/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
