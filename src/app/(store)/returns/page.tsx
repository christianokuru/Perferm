import type { Metadata } from "next";
import Link from "next/link";

import { PolicyPage } from "@/components/content/prose";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Returns & exchanges",
  description: "Perferm's returns policy: unopened, sealed fragrances can be returned within 7 days of delivery.",
  path: "/returns",
});

export default function ReturnsPage() {
  return (
    <PolicyPage title="returns &" accent="exchanges" lead="We want you to love every scent. Here's how returns work." updated="1 November 2026">
      <h2>Our promise</h2>
      <p>Unopened fragrances with their cellophane and seal intact may be returned or exchanged within 7 days of delivery or pickup.</p>
      <h2>What we can&apos;t accept</h2>
      <ul>
        <li>Opened or used fragrances, attars and bakhoor (for hygiene reasons)</li>
        <li>Items without their original box and seal</li>
        <li>Personalised or engraved items</li>
      </ul>
      <h2>Damaged or incorrect items</h2>
      <p>
        If anything arrives damaged or isn&apos;t what you ordered, message us within 48 hours with a photo and your order reference. We&apos;ll
        replace it at our cost.
      </p>
      <h2>How to start a return</h2>
      <p>
        Email <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a> or use our <Link href="/contact">contact form</Link>{" "}
        with your order reference. Refunds go back to the original payment method within 5–10 working days of us receiving the item.
      </p>
    </PolicyPage>
  );
}
