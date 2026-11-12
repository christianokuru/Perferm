import type { Metadata } from "next";

import { PolicyPage } from "@/components/content/prose";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description: "How Perferm collects, uses and protects your personal data in line with the Nigeria Data Protection Act 2023.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <PolicyPage title="privacy" accent="policy" lead="Your trust matters more than any sale. This is how we handle your data." updated="1 November 2026">
      <p>
        {siteConfig.legalName} (&quot;Perferm&quot;) processes personal data in line with the Nigeria Data Protection Act 2023 (NDPA). This policy
        explains what we collect, why, and the choices you have.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Contact details you give us: name, email, phone number and delivery address</li>
        <li>Order history and your saved wishlist</li>
        <li>Messages you send to our concierge</li>
      </ul>
      <p>We never receive or store your card details — payments are handled entirely by Paystack and Flutterwave.</p>
      <h2>How we use it</h2>
      <ul>
        <li>To process, deliver and support your orders</li>
        <li>To send order updates by SMS, WhatsApp or email</li>
        <li>To send our newsletter, only if you subscribe — unsubscribe any time</li>
      </ul>
      <h2>Sharing</h2>
      <p>We share only what is necessary with our payment providers and delivery partners to fulfil your order. We never sell your data.</p>
      <h2>Cookies</h2>
      <p>We use only essential storage to keep your bag, wishlist and session. We do not use advertising trackers.</p>
      <h2>Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your data at any time by emailing{" "}
        <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>. You can also delete your account from your account settings.
      </p>
    </PolicyPage>
  );
}
