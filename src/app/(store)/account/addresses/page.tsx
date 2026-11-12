import type { Metadata } from "next";
import { Suspense } from "react";

import { AddressBook } from "@/components/account/address-book";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { requireViewer } from "@/lib/auth/session";
import { getDeliveryZones } from "@/lib/catalog/repository";
import { listMyAddresses } from "@/lib/account/addresses";

export const metadata: Metadata = { title: "Addresses" };

export default function AddressesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AddressesContent />
    </Suspense>
  );
}

async function AddressesContent() {
  await requireViewer("/account/addresses");
  const [addresses, zones] = await Promise.all([listMyAddresses(), getDeliveryZones()]);
  return <AddressBook addresses={addresses} states={zones.map((z) => z.state)} />;
}
