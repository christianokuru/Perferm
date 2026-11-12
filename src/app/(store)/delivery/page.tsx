import type { Metadata } from "next";

import { Prose } from "@/components/content/prose";
import { PageIntro } from "@/components/shop/page-intro";
import { Accent } from "@/components/ui/typography";
import { getDeliveryZones, getStoreSettings } from "@/lib/catalog/repository";
import { formatNaira } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Delivery & pickup",
  description: "Perfume delivery to all 36 Nigerian states and the FCT. See delivery fees and timelines for your state, or collect free from our Lekki boutique.",
  path: "/delivery",
});

export default async function DeliveryPage() {
  const [zones, settings] = await Promise.all([getDeliveryZones(), getStoreSettings()]);
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Delivery" }]}
        title={
          <>
            delivery &amp; <Accent>pickup</Accent>
          </>
        }
        lead="Hand-wrapped and dispatched from Lagos to every state in Nigeria — or collected, free, from our boutique."
      />
      <div className="container-page grid grid-cols-1 gap-14 pb-24 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <Prose>
          <h2>How it works</h2>
          <p>Orders placed before 2pm (Mon–Sat) are wrapped and dispatched the same day. You&apos;ll receive your tracking details by SMS and email.</p>
          <ul>
            <li>Lagos: same or next day by our own riders</li>
            <li>South-West & FCT: 1–3 working days</li>
            <li>All other states: 2–6 working days via insured courier</li>
          </ul>
          <h2>Boutique pickup</h2>
          <p>
            {settings.pickupEnabled ? (
              <>
                Choose pickup at checkout and collect from {settings.pickupAddress}, {settings.pickupHours}. Bring a valid ID and your order
                reference.
              </>
            ) : (
              <>Boutique pickup is temporarily unavailable — every order can still be delivered to you.</>
            )}
          </p>
          <h2>Packaging</h2>
          <p>Every bottle travels sealed, in our signature box with protective inserts — and every order is fully insured until it reaches you.</p>
        </Prose>
        <div>
          <h2 className="mb-5 text-subheading font-light text-ink">Fees by state</h2>
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-mist">
            <table className="w-full text-left text-body-sm">
              <caption className="sr-only">Delivery fee and estimated time for each Nigerian state</caption>
              <thead className="bg-pearl text-caption text-smoke">
                <tr>
                  <th scope="col" className="px-4 py-3 font-normal">State</th>
                  <th scope="col" className="px-4 py-3 font-normal">Estimated</th>
                  <th scope="col" className="px-4 py-3 text-right font-normal">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {zones.map((z) => (
                  <tr key={z.state}>
                    <th scope="row" className="px-4 py-3 font-normal text-ink">{z.state}</th>
                    <td className="px-4 py-3 text-smoke">{z.eta}</td>
                    <td className="px-4 py-3 text-right text-ink tabular-nums">{formatNaira(z.fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
