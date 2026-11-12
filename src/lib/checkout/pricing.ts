import "server-only";

import { deliveryZones } from "@/lib/data/delivery-zones";
import { products } from "@/lib/data/products";
import type { FulfilmentMethod, Kobo, OrderLine, OrderTotals } from "@/lib/types";
import { MAX_LINE_QUANTITY, type CartLineInput } from "@/lib/validation/schemas";

export interface QuoteIssue {
  variantId: string;
  message: string;
}

export interface Quote {
  lines: OrderLine[];
  totals: OrderTotals;
  issues: QuoteIssue[];
  deliveryAvailable: boolean;
}

export function deliveryFeeFor(state: string | undefined): Kobo | null {
  if (!state) return null;
  return deliveryZones.find((z) => z.state === state)?.fee ?? null;
}

/**
 * Authoritative pricing. Prices come from the catalogue — never from the
 * client's cart — and quantities are clamped to stock and per-line limits.
 */
export function buildQuote(
  input: CartLineInput[],
  fulfilment: { method: FulfilmentMethod; state?: string },
): Quote {
  const issues: QuoteIssue[] = [];
  const merged = new Map<string, CartLineInput>();

  for (const line of input) {
    const existing = merged.get(line.variantId);
    merged.set(line.variantId, existing ? { ...line, quantity: existing.quantity + line.quantity } : line);
  }

  const lines: OrderLine[] = [];
  for (const line of merged.values()) {
    const product = products.find((p) => p.id === line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant) {
      issues.push({ variantId: line.variantId, message: "This item is no longer available and was removed." });
      continue;
    }
    if (variant.stock <= 0) {
      issues.push({ variantId: variant.id, message: `${product.name} (${variant.label}) is sold out.` });
      continue;
    }
    const quantity = Math.min(line.quantity, variant.stock, MAX_LINE_QUANTITY);
    if (quantity < line.quantity) {
      issues.push({ variantId: variant.id, message: `Only ${quantity} of ${product.name} (${variant.label}) available.` });
    }
    lines.push({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      house: product.house,
      variantLabel: variant.label,
      image: product.images[0].src,
      unitPrice: variant.price,
      quantity,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const fee = fulfilment.method === "pickup" ? 0 : deliveryFeeFor(fulfilment.state);
  const deliveryFee = fee ?? 0;

  return {
    lines,
    issues,
    deliveryAvailable: fulfilment.method === "pickup" || fee !== null,
    totals: { subtotal, deliveryFee, total: subtotal + deliveryFee },
  };
}
