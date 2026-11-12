"use client";

import { useEffect, useState } from "react";

import { BagIcon } from "@/components/icons";
import { HydrationGate } from "@/components/providers/hydration-gate";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import type { CheckoutConfig } from "@/lib/payments/types";
import { createClient } from "@/lib/supabase/client";
import type { DeliveryZone } from "@/lib/types";
import { formatPhone } from "@/lib/validation/fields";
import { useCartStore } from "@/stores/cart-store";
import { useViewer } from "@/stores/session-store";

import { CheckoutForm, type SavedAddress } from "./checkout-form";

/** The signed-in customer's default address, for one-tap checkout. */
function useDefaultAddress(userId: string | undefined) {
  const [address, setAddress] = useState<SavedAddress | null | undefined>(userId ? undefined : null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void createClient()
      .from("addresses")
      .select("recipient, phone, state, city, address")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setAddress(data ? { ...data, phone: formatPhone(data.phone) } : null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return userId ? address : null;
}

function CheckoutContent({ zones, config }: { zones: DeliveryZone[]; config: CheckoutConfig }) {
  const user = useViewer();
  const hasItems = useCartStore((s) => s.lines.length > 0);
  const address = useDefaultAddress(user?.id);

  if (!hasItems) {
    return (
      <EmptyState
        icon={<BagIcon size={26} />}
        title="Your bag is empty"
        description="Add a fragrance to your bag to check out."
        action={<ButtonLink href="/shop">Explore the house</ButtonLink>}
      />
    );
  }
  if (address === undefined) return null;
  // Keyed by user so contact details prefill correctly after sign-in.
  return <CheckoutForm key={user?.id ?? "guest"} user={user} defaultAddress={address} zones={zones} config={config} />;
}

export function CheckoutView({ zones, config }: { zones: DeliveryZone[]; config: CheckoutConfig }) {
  return (
    <HydrationGate stores={["cart", "session"]}>
      <CheckoutContent zones={zones} config={config} />
    </HydrationGate>
  );
}
