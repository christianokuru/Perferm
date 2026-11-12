import "server-only";

import { getStoreSettings } from "@/lib/catalog/repository";
import { gatewayMode } from "@/lib/payments/server/gateways";
import type { CheckoutConfig } from "@/lib/payments/types";

/** Which fulfilment and payment options checkout may offer right now. */
export async function getCheckoutConfig(): Promise<CheckoutConfig> {
  const settings = await getStoreSettings();
  return {
    pickup: { enabled: settings.pickupEnabled, address: settings.pickupAddress, hours: settings.pickupHours },
    gateways: (["paystack", "flutterwave"] as const).map((provider) => {
      const enabled = provider === "paystack" ? settings.paystackEnabled : settings.flutterwaveEnabled;
      const mode = gatewayMode(provider);
      return { provider, mode, available: enabled && mode !== null };
    }),
  };
}
