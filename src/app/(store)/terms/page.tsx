import type { Metadata } from "next";
import Link from "next/link";

import { PolicyPage } from "@/components/content/prose";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms of service",
  description: "The terms that apply when you shop with Perferm.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PolicyPage title="terms of" accent="service" lead="The fine print, written as plainly as we can." updated="1 November 2026">
      <h2>About us</h2>
      <p>This website is operated by {siteConfig.legalName}, {siteConfig.boutique.street}, {siteConfig.boutique.area}, {siteConfig.boutique.city}, Nigeria.</p>
      <h2>Orders & pricing</h2>
      <p>
        All prices are in Nigerian Naira and include applicable taxes. Delivery fees are shown at checkout. An order is confirmed only once
        payment has been verified with Paystack or Flutterwave. If an item becomes unavailable after you order, we will refund you in full.
      </p>
      <h2>Payment</h2>
      <p>Payments are processed by our providers. We do not store card details. Fraudulent orders may be cancelled and reported.</p>
      <h2>Delivery</h2>
      <p>
        Estimated timelines are shown on our <Link href="/delivery">delivery page</Link>. Risk passes to you on delivery or collection.
      </p>
      <h2>Returns</h2>
      <p>
        See our <Link href="/returns">returns policy</Link>. Your statutory rights under the Federal Competition and Consumer Protection Act are
        not affected.
      </p>
      <h2>Accounts</h2>
      <p>Keep your password confidential. You are responsible for activity on your account. We may suspend accounts used for abuse or fraud.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria, and disputes fall under the courts of Lagos State.</p>
    </PolicyPage>
  );
}
