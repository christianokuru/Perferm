import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Onest } from "next/font/google";

import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { SessionSync } from "@/components/providers/session-sync";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { StoreHydration } from "@/components/providers/store-hydration";
import { Toaster } from "@/components/ui/toast";
import { siteConfig } from "@/lib/config/site";

import "./globals.css";

const onest = Onest({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-onest",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Arabian & Niche Luxury Perfume in Nigeria`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "luxury perfume Nigeria",
    "Arabian perfume Lagos",
    "oud perfume",
    "attar oil Nigeria",
    "niche fragrance",
    "bakhoor",
    "perfume gift set",
  ],
  authors: [{ name: siteConfig.developer.name, url: siteConfig.developer.url }],
  creator: siteConfig.developer.name,
  publisher: siteConfig.legalName,
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: siteConfig.name, statusBarStyle: "default" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${onest.variable} ${instrument.variable}`}>
      <body className="flex min-h-dvh flex-col overflow-x-clip">
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-ink px-5 py-3 text-body-sm text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {children}
        <Toaster />
        <StoreHydration />
        <SessionSync />
        <SmoothScroll />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
