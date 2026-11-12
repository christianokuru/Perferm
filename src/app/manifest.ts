import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${siteConfig.name} — Maison de Parfum`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["shopping", "lifestyle", "beauty"],
    lang: "en-NG",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Shop all", url: "/shop", description: "Browse every fragrance" },
      { name: "The oud edit", url: "/collections/oud" },
      { name: "My bag", url: "/cart" },
      { name: "My orders", url: "/account/orders" },
    ],
  };
}
