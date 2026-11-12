import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderStatus } from "@/lib/types";

export const ORDER_SELECT =
  "*, order_items(id, product_id, variant_id, product_slug, product_name, house, variant_label, image_src, unit_price_kobo, quantity), order_events(kind, status, message, is_internal, created_at)" as const;

type OrderRow = Tables<"orders"> & {
  order_items: Pick<
    Tables<"order_items">,
    "id" | "product_id" | "variant_id" | "product_slug" | "product_name" | "house" | "variant_label" | "image_src" | "unit_price_kobo" | "quantity"
  >[];
  order_events: Pick<Tables<"order_events">, "kind" | "status" | "message" | "is_internal" | "created_at">[];
};

export function mapOrder(row: OrderRow, { includeInternal = false } = {}): Order {
  return {
    id: row.id,
    reference: row.reference,
    createdAt: row.created_at,
    status: row.status,
    customer: { name: row.customer_name, email: row.email, phone: row.phone },
    fulfilment:
      row.fulfilment === "pickup"
        ? { method: "pickup", location: row.pickup_location ?? undefined }
        : {
            method: "delivery",
            state: row.delivery_state ?? "",
            city: row.delivery_city ?? "",
            address: row.delivery_address ?? "",
            notes: row.delivery_notes ?? undefined,
          },
    payment: {
      provider: row.payment_provider,
      mode: row.payment_mode,
      transactionId: row.provider_transaction_id ?? undefined,
      paidAt: row.paid_at ?? undefined,
    },
    lines: row.order_items.map((i) => ({
      productId: i.product_id,
      variantId: i.variant_id,
      slug: i.product_slug,
      name: i.product_name,
      house: i.house,
      variantLabel: i.variant_label,
      image: i.image_src,
      unitPrice: i.unit_price_kobo,
      quantity: i.quantity,
    })),
    totals: { subtotal: row.subtotal_kobo, deliveryFee: row.delivery_fee_kobo, total: row.total_kobo },
    cancelReason: row.cancel_reason ?? undefined,
    stockIssue: row.stock_issue,
    userId: row.user_id,
    events: row.order_events
      .filter((e) => includeInternal || !e.is_internal)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((e) => ({
        kind: e.kind as Order["events"][number]["kind"],
        status: e.status,
        message: e.message,
        internal: e.is_internal,
        createdAt: e.created_at,
      })),
  };
}

export function hashAccessKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

const REFERENCE_PATTERN = /^PF-[A-Z0-9]{8}$/;

/** Customer view: RLS guarantees only the signed-in owner's order is returned. */
export async function getMyOrder(reference: string): Promise<Order | null> {
  if (!REFERENCE_PATTERN.test(reference)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select(ORDER_SELECT).eq("reference", reference).maybeSingle();
  return data ? mapOrder(data as OrderRow) : null;
}

export async function listMyOrders(limit = 50): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  return (data as OrderRow[]).map((row) => mapOrder(row));
}

/**
 * Guest view (confirmation page): the order is only returned when the caller
 * holds the secret access key issued at checkout. Compared in constant time.
 */
export async function getOrderWithAccessKey(reference: string, key: string): Promise<Order | null> {
  if (!REFERENCE_PATTERN.test(reference) || !/^[A-Za-z0-9_-]{32,64}$/.test(key)) return null;
  const { data } = await createAdminClient().from("orders").select(ORDER_SELECT).eq("reference", reference).maybeSingle();
  if (!data) return null;
  const expected = Buffer.from((data as OrderRow).access_key_hash, "hex");
  const actual = Buffer.from(hashAccessKey(key), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return mapOrder(data as OrderRow);
}

/** Service-side load by id (emails, webhooks). */
export async function getOrderById(id: string, includeInternal = false): Promise<Order | null> {
  const { data } = await createAdminClient().from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
  return data ? mapOrder(data as OrderRow, { includeInternal }) : null;
}

/* --------------------------------- Admin ---------------------------------- */

export const ADMIN_PAGE_SIZE = 25;

export interface AdminOrderFilters {
  status: OrderStatus | null;
  q: string;
  page: number;
}

export interface AdminOrderListItem {
  id: string;
  reference: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string;
  email: string;
  fulfilment: "delivery" | "pickup";
  state: string | null;
  total: number;
  stockIssue: boolean;
  mode: "live" | "demo";
}

/** Admin list (RLS: admins read all). Search matches reference, email or name. */
export async function listOrdersForAdmin(filters: AdminOrderFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, reference, created_at, status, customer_name, email, fulfilment, delivery_state, total_kobo, stock_issue, payment_mode", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((filters.page - 1) * ADMIN_PAGE_SIZE, filters.page * ADMIN_PAGE_SIZE - 1);

  if (filters.status) query = query.eq("status", filters.status);
  const q = filters.q.trim();
  if (q) {
    if (/^PF-[A-Z0-9]{1,8}$/i.test(q)) query = query.ilike("reference", `${q.toUpperCase()}%`);
    else {
      // Escape LIKE wildcards and PostgREST filter syntax characters.
      const safe = q.replace(/[%_\\,()*]/g, " ").trim().slice(0, 80);
      if (safe) query = query.or(`email.ilike.%${safe}%,customer_name.ilike.%${safe}%`);
    }
  }

  const [{ data, count, error }, counts] = await Promise.all([query, countOrdersByStatus()]);
  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  const items: AdminOrderListItem[] = (data ?? []).map((o) => ({
    id: o.id,
    reference: o.reference,
    createdAt: o.created_at,
    status: o.status,
    customerName: o.customer_name,
    email: o.email,
    fulfilment: o.fulfilment,
    state: o.delivery_state,
    total: o.total_kobo,
    stockIssue: o.stock_issue,
    mode: o.payment_mode,
  }));
  return { items, total: count ?? 0, counts };
}

async function countOrdersByStatus(): Promise<Record<OrderStatus | "all", number>> {
  const supabase = await createClient();
  const statuses: OrderStatus[] = ["pending", "paid", "processing", "shipped", "ready_for_pickup", "delivered", "cancelled"];
  const results = await Promise.all(
    statuses.map((s) => supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", s)),
  );
  const counts = Object.fromEntries(statuses.map((s, i) => [s, results[i].count ?? 0])) as Record<OrderStatus, number>;
  return { ...counts, all: Object.values(counts).reduce((a, b) => a + b, 0) };
}

export async function getOrderForAdmin(reference: string): Promise<Order | null> {
  if (!REFERENCE_PATTERN.test(reference)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select(ORDER_SELECT).eq("reference", reference).maybeSingle();
  return data ? mapOrder(data as OrderRow, { includeInternal: true }) : null;
}
