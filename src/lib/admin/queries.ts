import "server-only";

import { mapProduct, PRODUCT_SELECT } from "@/lib/catalog/mappers";
import type { StoreSettings } from "@/lib/catalog/repository";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";
import type { Collection, Product } from "@/lib/types";

/**
 * Admin reads. They run as the signed-in admin (RLS: admins read everything)
 * and are never cached, so the dashboard always shows live data. Callers
 * must have passed requireAdmin() first.
 */

export const PAGE_SIZE = 25;

export interface DashboardData {
  revenue_kobo: number;
  orders: number;
  revenue_30d_kobo: number;
  orders_30d: number;
  to_fulfil: number;
  pending_payment: number;
  stock_issues: number;
  customers: number;
  products: number;
  new_messages: number;
  pending_reviews: number;
  daily: Array<{ day: string; revenue_kobo: number; orders: number }>;
  low_stock: Array<{ product_id: string; name: string; label: string; stock: number }>;
  top_sellers: Array<{ name: string; quantity: number; revenue_kobo: number }>;
}

export async function getDashboard(): Promise<DashboardData> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard");
  if (error) throw new Error(`Dashboard failed: ${error.message}`);
  return data as unknown as DashboardData;
}

export async function getRecentOrders(limit = 6) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, reference, customer_name, created_at, status, total_kobo")
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function listProductsForAdmin(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data ?? []).map(mapProduct);
}

export async function getProductForAdmin(id: string): Promise<Product | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  return data ? mapProduct(data) : null;
}

export async function listCollectionsForAdmin(): Promise<Pick<Collection, "slug" | "title">[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("collections").select("slug, title").order("position");
  return data ?? [];
}

export interface AdminCustomer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Enums<"user_role">;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export async function listCustomers(search: string, page: number): Promise<{ items: AdminCustomer[]; total: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_customers", {
    p_search: search || undefined,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) throw new Error(`Failed to load customers: ${error.message}`);
  return {
    total: data?.[0]?.total_count ?? 0,
    items: (data ?? []).map((c) => ({
      id: c.id,
      email: c.email,
      name: c.full_name,
      phone: c.phone,
      role: c.role,
      createdAt: c.created_at,
      orderCount: Number(c.order_count),
      totalSpent: Number(c.total_spent_kobo),
    })),
  };
}

export interface AdminZone {
  state: string;
  fee: number;
  eta: string;
  active: boolean;
}

export async function listZonesForAdmin(): Promise<AdminZone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("delivery_zones").select("state, fee_kobo, eta, is_active").order("state");
  if (error) throw new Error(`Failed to load zones: ${error.message}`);
  return (data ?? []).map((z) => ({ state: z.state, fee: z.fee_kobo, eta: z.eta, active: z.is_active }));
}

export async function getSettingsForAdmin(): Promise<StoreSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(`Failed to load settings: ${error.message}`);
  return {
    storeName: data.store_name,
    supportEmail: data.support_email,
    supportPhone: data.support_phone,
    announcement: data.announcement,
    pickupEnabled: data.pickup_enabled,
    pickupAddress: data.pickup_address,
    pickupHours: data.pickup_hours,
    paystackEnabled: data.paystack_enabled,
    flutterwaveEnabled: data.flutterwave_enabled,
  };
}

export interface AdminReview {
  id: string;
  productName: string;
  productSlug: string;
  author: string;
  city: string | null;
  rating: number;
  title: string;
  body: string;
  status: Enums<"review_status">;
  verified: boolean;
  createdAt: string;
}

export async function listReviewsForAdmin(status: Enums<"review_status"> | null, page: number) {
  const supabase = await createClient();
  let query = supabase
    .from("reviews")
    .select("id, author_name, city, rating, title, body, status, verified_purchase, created_at, products(name, slug)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load reviews: ${error.message}`);
  const items: AdminReview[] = (data ?? []).map((r) => ({
    id: r.id,
    productName: r.products?.name ?? "Deleted product",
    productSlug: r.products?.slug ?? "",
    author: r.author_name,
    city: r.city,
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status,
    verified: r.verified_purchase,
    createdAt: r.created_at,
  }));
  return { items, total: count ?? 0 };
}

export interface AdminMessage {
  id: string;
  name: string;
  email: string;
  topic: Enums<"contact_topic">;
  message: string;
  status: Enums<"message_status">;
  createdAt: string;
}

export async function listMessages(status: Enums<"message_status"> | null, page: number) {
  const supabase = await createClient();
  let query = supabase
    .from("contact_messages")
    .select("id, name, email, topic, message, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load messages: ${error.message}`);
  const items: AdminMessage[] = (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    topic: m.topic,
    message: m.message,
    status: m.status,
    createdAt: m.created_at,
  }));
  return { items, total: count ?? 0 };
}

export async function listSubscribers(page: number) {
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, source, created_at, unsubscribed_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw new Error(`Failed to load subscribers: ${error.message}`);
  return { items: data ?? [], total: count ?? 0 };
}

/** Parses `?page=` safely (1…10 000). */
export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : 1;
}

export function parseSearch(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : (value ?? "")).trim().slice(0, 80);
}
