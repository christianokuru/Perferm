"use server";

import { updateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { assertAdmin, AuthError, type Viewer } from "@/lib/auth/session";
import { CACHE_TAGS } from "@/lib/catalog/repository";
import { sendOrderStatusUpdate } from "@/lib/email/notifications";
import { naira } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { productFormSchema, settingsFormSchema, zoneFormSchema } from "@/lib/validation/admin";
import { validate, type FieldErrors } from "@/lib/validation/fields";

/**
 * Admin mutations. Each action re-verifies the admin role on the server, and
 * runs as the admin's own session so Postgres RLS / SECURITY DEFINER checks
 * are a second, independent gate. Inputs are validated with zod first.
 */

type Failure = { ok: false; error?: string; fieldErrors?: FieldErrors };
export type AdminResult<T = never> = ([T] extends [never] ? { ok: true } : { ok: true; data: T }) | Failure;

async function asAdmin<R extends { ok: true }>(run: (admin: Viewer) => Promise<R | Failure>): Promise<R | Failure> {
  try {
    return await run(await assertAdmin());
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.code === "forbidden" ? "You don't have access to do that." : "Please sign in again." };
    console.error("[admin]", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

const uuid = z.uuid();

/* -------------------------------- Products -------------------------------- */

export async function saveProduct(input: unknown, id?: string): Promise<AdminResult<{ id: string; slug: string }>> {
  return asAdmin<{ ok: true; data: { id: string; slug: string } }>(async () => {
    if (id !== undefined && !uuid.safeParse(id).success) return { ok: false, error: "Product not found." };
    const parsed = validate(productFormSchema, input);
    if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
    const d = parsed.data;
    const slug = slugify(d.name);
    if (!slug) return { ok: false, fieldErrors: { name: "Use letters or numbers in the name" } };

    const supabase = await createClient();
    const { data: previous } = id
      ? await supabase.from("product_images").select("storage_path").eq("product_id", id)
      : { data: [] as { storage_path: string | null }[] };

    const { data: savedId, error } = await supabase.rpc("admin_save_product", {
      p: {
        id: id ?? "",
        slug,
        name: d.name,
        house: d.house,
        tagline: d.tagline,
        description: d.description,
        gender: d.gender,
        concentration: d.concentration,
        families: d.families,
        notes_top: d.top,
        notes_heart: d.heart,
        notes_base: d.base,
        longevity: d.longevity,
        sillage: d.sillage,
        is_new: d.isNew,
        is_bestseller: d.isBestseller,
        collections: d.collections,
        variants: d.variants.map((v) => ({
          id: v.id ?? "",
          label: v.label,
          price_kobo: naira(v.price),
          compare_at_kobo: typeof v.compareAtPrice === "number" && v.compareAtPrice > 0 ? naira(v.compareAtPrice) : "",
          stock: v.stock,
        })),
        images: d.images.map((img, i) => ({ src: img.src, alt: `${d.name} — image ${i + 1}`, storage_path: img.storagePath ?? "" })),
      },
    });
    if (error || !savedId) {
      if (error?.code === "23505") return { ok: false, error: "Two sizes share the same label. Give each size a unique label." };
      console.error("[admin] save product", error);
      return { ok: false, error: "We couldn't save this product." };
    }

    // Remove uploaded files that are no longer used by the product.
    const kept = new Set(d.images.map((i) => i.storagePath).filter(Boolean));
    const orphaned = (previous ?? []).map((p) => p.storage_path).filter((p): p is string => Boolean(p) && !kept.has(p as string));
    if (orphaned.length) await supabase.storage.from("product-images").remove(orphaned);

    const { data: row } = await supabase.from("products").select("slug").eq("id", savedId).single();
    updateTag(CACHE_TAGS.catalog);
    return { ok: true, data: { id: savedId, slug: row?.slug ?? slug } };
  });
}

/** Archive hides a product from the storefront without touching order history. */
export async function setProductArchived(id: unknown, archived: boolean): Promise<AdminResult> {
  return asAdmin(async () => {
    const parsed = uuid.safeParse(id);
    if (!parsed.success) return { ok: false, error: "Product not found." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("products")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", parsed.data);
    if (error) return { ok: false, error: "We couldn't update this product." };
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  });
}

/* --------------------------------- Orders --------------------------------- */

const statusSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(["processing", "shipped", "ready_for_pickup", "delivered", "cancelled"]),
  note: z.string().trim().max(300).optional(),
});

const TRANSITION_ERROR = "That status change isn't allowed for this order.";

export async function setOrderStatus(input: unknown): Promise<AdminResult> {
  return asAdmin(async () => {
    const parsed = statusSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Choose a valid status." };
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_set_order_status", {
      p_order_id: parsed.data.orderId,
      p_status: parsed.data.status,
      p_note: parsed.data.note || undefined,
    });
    if (error) return { ok: false, error: error.message === "invalid_transition" ? TRANSITION_ERROR : "We couldn't update this order." };
    const orderId = parsed.data.orderId;
    after(() => sendOrderStatusUpdate(orderId));
    // Restocking on cancel changes availability on the storefront.
    if (parsed.data.status === "cancelled") updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  });
}

export async function addOrderNote(input: unknown): Promise<AdminResult> {
  return asAdmin(async () => {
    const parsed = z.object({ orderId: z.uuid(), note: z.string().trim().min(1, "Write a note").max(500) }).safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: { note: parsed.error.issues[0]?.message ?? "Write a note" } };
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_add_order_note", { p_order_id: parsed.data.orderId, p_note: parsed.data.note });
    return error ? { ok: false, error: "We couldn't add this note." } : { ok: true };
  });
}

/* ------------------------------ Delivery zones ----------------------------- */

export async function updateZone(state: unknown, input: unknown): Promise<AdminResult> {
  return asAdmin(async () => {
    const stateParsed = z.string().min(2).max(40).safeParse(state);
    const parsed = validate(zoneFormSchema, input);
    if (!stateParsed.success) return { ok: false, error: "Unknown state." };
    if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("delivery_zones")
      .update({ fee_kobo: naira(parsed.data.fee), eta: parsed.data.eta, is_active: parsed.data.active })
      .eq("state", stateParsed.data)
      .select("state");
    if (error || !data?.length) return { ok: false, error: "We couldn't update this delivery zone." };
    updateTag(CACHE_TAGS.zones);
    return { ok: true };
  });
}

/* --------------------------------- Settings -------------------------------- */

export async function saveSettings(input: unknown): Promise<AdminResult> {
  return asAdmin(async (admin) => {
    const parsed = validate(settingsFormSchema, input);
    if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
    const d = parsed.data;
    const supabase = await createClient();
    const { error } = await supabase
      .from("store_settings")
      .update({
        store_name: d.storeName,
        support_email: d.supportEmail,
        support_phone: d.supportPhone,
        announcement: d.announcement,
        pickup_enabled: d.pickupEnabled,
        pickup_address: d.pickupAddress,
        pickup_hours: d.pickupHours,
        paystack_enabled: d.paystackEnabled,
        flutterwave_enabled: d.flutterwaveEnabled,
        updated_by: admin.id,
      })
      .eq("id", 1);
    if (error) return { ok: false, error: "We couldn't save the settings." };
    updateTag(CACHE_TAGS.settings);
    return { ok: true };
  });
}

/* -------------------------------- Customers -------------------------------- */

export async function setCustomerRole(userId: unknown, role: unknown): Promise<AdminResult> {
  return asAdmin(async (admin) => {
    const parsedId = uuid.safeParse(userId);
    const parsedRole = z.enum(["customer", "admin"]).safeParse(role);
    if (!parsedId.success || !parsedRole.success) return { ok: false, error: "Invalid request." };
    if (parsedId.data === admin.id) return { ok: false, error: "You can't change your own role." };
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: parsedId.data, p_role: parsedRole.data });
    return error ? { ok: false, error: "We couldn't change this role." } : { ok: true };
  });
}

/* --------------------------------- Reviews --------------------------------- */

export async function moderateReview(id: unknown, status: unknown): Promise<AdminResult> {
  return asAdmin(async (admin) => {
    const parsedId = uuid.safeParse(id);
    const parsedStatus = z.enum(["approved", "rejected", "pending"]).safeParse(status);
    if (!parsedId.success || !parsedStatus.success) return { ok: false, error: "Invalid request." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("reviews")
      .update({ status: parsedStatus.data, moderated_at: new Date().toISOString(), moderated_by: admin.id })
      .eq("id", parsedId.data);
    if (error) return { ok: false, error: "We couldn't update this review." };
    updateTag(CACHE_TAGS.reviews);
    updateTag(CACHE_TAGS.catalog); // ratings changed
    return { ok: true };
  });
}

export async function deleteReview(id: unknown): Promise<AdminResult> {
  return asAdmin(async () => {
    const parsed = uuid.safeParse(id);
    if (!parsed.success) return { ok: false, error: "Invalid request." };
    const supabase = await createClient();
    const { error } = await supabase.from("reviews").delete().eq("id", parsed.data);
    if (error) return { ok: false, error: "We couldn't delete this review." };
    updateTag(CACHE_TAGS.reviews);
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  });
}

/* --------------------------------- Messages -------------------------------- */

export async function setMessageStatus(id: unknown, status: unknown): Promise<AdminResult> {
  return asAdmin(async (admin) => {
    const parsedId = uuid.safeParse(id);
    const parsedStatus = z.enum(["new", "handled", "archived"]).safeParse(status);
    if (!parsedId.success || !parsedStatus.success) return { ok: false, error: "Invalid request." };
    const supabase = await createClient();
    const handled = parsedStatus.data !== "new";
    const { error } = await supabase
      .from("contact_messages")
      .update({ status: parsedStatus.data, handled_at: handled ? new Date().toISOString() : null, handled_by: handled ? admin.id : null })
      .eq("id", parsedId.data);
    return error ? { ok: false, error: "We couldn't update this message." } : { ok: true };
  });
}
