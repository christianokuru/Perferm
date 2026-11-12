import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
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
  pickupAvailable: boolean;
}

/**
 * Authoritative pricing, read live from the database on every call (never
 * from a cache or from the client's bag). Quantities are clamped to stock and
 * per-line limits. `create_order()` re-checks the same numbers in Postgres.
 */
export async function buildQuote(input: CartLineInput[], fulfilment: { method: FulfilmentMethod; state?: string }): Promise<Quote> {
  const db = createPublicClient();
  const merged = new Map<string, CartLineInput>();
  for (const line of input) {
    const existing = merged.get(line.variantId);
    merged.set(line.variantId, existing ? { ...line, quantity: existing.quantity + line.quantity } : line);
  }

  const variantIds = [...merged.keys()];
  const [variantsRes, zoneRes, settingsRes] = await Promise.all([
    variantIds.length
      ? db
          .from("product_variants")
          .select("id, label, price_kobo, stock, product_id, products!inner(id, slug, name, house, archived_at, product_images(src, position))")
          .in("id", variantIds)
      : Promise.resolve({ data: [], error: null }),
    fulfilment.method === "delivery" && fulfilment.state
      ? db.from("delivery_zones").select("fee_kobo, is_active").eq("state", fulfilment.state).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    db.from("store_settings").select("pickup_enabled").eq("id", 1).maybeSingle(),
  ]);
  if (variantsRes.error) throw new Error(`Pricing failed: ${variantsRes.error.message}`);

  const variants = new Map((variantsRes.data ?? []).map((v) => [v.id, v]));
  const issues: QuoteIssue[] = [];
  const lines: OrderLine[] = [];

  for (const line of merged.values()) {
    const variant = variants.get(line.variantId);
    const product = variant?.products;
    if (!variant || !product || product.archived_at) {
      issues.push({ variantId: line.variantId, message: "An item in your bag is no longer available and was removed." });
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
    const cover = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position)[0];
    lines.push({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      house: product.house,
      variantLabel: variant.label,
      image: cover?.src ?? "",
      unitPrice: variant.price_kobo,
      quantity,
    });
  }

  const zone = zoneRes.data && zoneRes.data.is_active ? zoneRes.data : null;
  const pickupAvailable = settingsRes.data?.pickup_enabled ?? true;
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const deliveryFee: Kobo = fulfilment.method === "pickup" ? 0 : (zone?.fee_kobo ?? 0);

  return {
    lines,
    issues,
    pickupAvailable,
    deliveryAvailable: fulfilment.method === "pickup" ? pickupAvailable : zone !== null,
    totals: { subtotal, deliveryFee, total: subtotal + deliveryFee },
  };
}
