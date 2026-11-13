"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { authErrorMessage } from "@/lib/auth/errors";
import { assertViewer, AuthError, type Viewer } from "@/lib/auth/session";
import { publicEnv } from "@/lib/config/public-env";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { addressSchema, changeEmailSchema, changePasswordSchema, deleteAccountSchema, profileSchema } from "@/lib/validation/schemas";

export type ActionResult = { ok: true } | { ok: false; error?: string; fieldErrors?: FieldErrors };

const SESSION_EXPIRED: ActionResult = { ok: false, error: "Your session has expired. Please sign in again." };

/** Runs an account action for the verified viewer, rate limited per user. */
async function withViewer(scope: string, limit: number, run: (viewer: Viewer) => Promise<ActionResult>): Promise<ActionResult> {
  try {
    const viewer = await assertViewer();
    const allowed = await rateLimit(clientKey(await headers(), `${scope}:${viewer.id}`), limit, 10 * 60_000);
    if (!allowed.ok) return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
    return await run(viewer);
  } catch (error) {
    if (error instanceof AuthError) return SESSION_EXPIRED;
    console.error(`[account:${scope}]`, error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateProfile(input: unknown): Promise<ActionResult> {
  return withViewer("profile", 30, async (viewer) => {
    const parsed = validate(profileSchema, input);
    if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").update({ full_name: parsed.data.name, phone: parsed.data.phone }).eq("id", viewer.id);
    if (error) return { ok: false, error: "We couldn't save your profile." };
    revalidatePath("/account", "layout");
    return { ok: true };
  });
}

/* -------------------------------- Addresses ------------------------------- */

export async function saveAddress(input: unknown, id?: string): Promise<ActionResult> {
  return withViewer("address", 60, async (viewer) => {
    const parsed = validate(addressSchema, input);
    if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
    if (id !== undefined && !z.uuid().safeParse(id).success) return { ok: false, error: "Address not found." };

    const row = {
      label: parsed.data.label,
      recipient: parsed.data.recipient,
      phone: parsed.data.phone,
      state: parsed.data.state,
      city: parsed.data.city,
      address: parsed.data.address,
      is_default: parsed.data.isDefault,
    };
    const supabase = await createClient();
    const { error } = id
      ? await supabase.from("addresses").update(row).eq("id", id).eq("user_id", viewer.id)
      : await supabase.from("addresses").insert({ ...row, user_id: viewer.id });
    if (error) {
      return { ok: false, error: error.message.includes("address_limit") ? "You can save up to 10 addresses." : "We couldn't save this address." };
    }
    revalidatePath("/account", "layout");
    return { ok: true };
  });
}

export async function deleteAddress(id: unknown): Promise<ActionResult> {
  return withViewer("address", 60, async (viewer) => {
    const parsed = z.uuid().safeParse(id);
    if (!parsed.success) return { ok: false, error: "Address not found." };
    const supabase = await createClient();
    const { error } = await supabase.from("addresses").delete().eq("id", parsed.data).eq("user_id", viewer.id);
    if (error) return { ok: false, error: "We couldn't delete this address." };
    revalidatePath("/account", "layout");
    return { ok: true };
  });
}

/* --------------------------------- Security -------------------------------- */

/**
 * Confirms the current password without touching the visitor's session: a
 * throwaway, non-persisting client signs in and immediately revokes that session.
 */
async function passwordMatches(email: string, password: string): Promise<boolean> {
  const probe = createSupabaseClient(publicEnv.supabaseUrl, publicEnv.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await probe.auth.signInWithPassword({ email, password });
  if (error || !data.session) return false;
  await probe.auth.signOut({ scope: "local" });
  return true;
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  return withViewer("password", 5, async (viewer) => {
    const parsed = validate(changePasswordSchema, input);
    if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
    if (viewer.hasPassword && !(await passwordMatches(viewer.email, parsed.data.currentPassword))) {
      return { ok: false, fieldErrors: { currentPassword: "Your current password is incorrect." } };
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
    if (error) return { ok: false, error: authErrorMessage(error) };
    // Other devices that knew the old password are signed out.
    await supabase.auth.signOut({ scope: "others" });
    return { ok: true };
  });
}

/**
 * Changes the sign-in email at once, with no confirmation emails (the store
 * doesn't send auth emails). Because no inbox check happens, the current
 * password is required, so a stolen session alone can't take the account.
 */
export async function changeEmail(input: unknown): Promise<ActionResult> {
  return withViewer("email", 5, async (viewer) => {
    const parsed = validate(changeEmailSchema, input);
    if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
    const { email, password } = parsed.data;
    if (email === viewer.email.toLowerCase()) return { ok: false, fieldErrors: { email: "That's already your email address." } };
    if (viewer.hasPassword && !(await passwordMatches(viewer.email, password ?? ""))) {
      return { ok: false, fieldErrors: { password: "Your password is incorrect." } };
    }

    const { error } = await createAdminClient().auth.admin.updateUserById(viewer.id, { email, email_confirm: true });
    if (error) {
      if (error.code === "email_exists" || /already (been )?registered|already exists/i.test(error.message)) {
        return { ok: false, fieldErrors: { email: "Another account already uses this email." } };
      }
      return { ok: false, error: authErrorMessage(error) };
    }
    revalidatePath("/account", "layout");
    return { ok: true };
  });
}

export async function deleteAccount(input: unknown): Promise<ActionResult> {
  return withViewer("delete-account", 5, async (viewer) => {
    const parsed = validate(deleteAccountSchema, input);
    if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
    if (viewer.hasPassword && !(await passwordMatches(viewer.email, parsed.data.password ?? ""))) {
      return { ok: false, fieldErrors: { password: "Your password is incorrect." } };
    }

    const admin = createAdminClient();
    if (viewer.role === "admin") {
      const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
      if ((count ?? 0) <= 1) return { ok: false, error: "You're the only admin. Promote another admin before deleting this account." };
    }

    // Orders are kept for accounting (user_id is cleared); profile, addresses and wishlist are removed.
    const { error } = await admin.auth.admin.deleteUser(viewer.id);
    if (error) return { ok: false, error: "We couldn't delete your account. Please contact our concierge." };
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
    return { ok: true };
  });
}
