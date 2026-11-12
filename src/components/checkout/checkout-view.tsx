"use client";

import { BagIcon } from "@/components/icons";
import { HydrationGate } from "@/components/providers/hydration-gate";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useCurrentUser } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";

import { CheckoutForm } from "./checkout-form";

function CheckoutContent() {
  const user = useCurrentUser();
  const hasItems = useCartStore((s) => s.lines.length > 0);

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
  // Keyed by user so contact details prefill correctly after sign-in.
  return <CheckoutForm key={user?.id ?? "guest"} user={user} />;
}

export function CheckoutView() {
  return (
    <HydrationGate stores={["cart", "auth"]}>
      <CheckoutContent />
    </HydrationGate>
  );
}
