"use server";

import { headers } from "next/headers";

import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { validate } from "@/lib/validation/fields";
import { newsletterSchema } from "@/lib/validation/schemas";

type Result = { ok: true } | { ok: false; error: string };

export async function subscribeToNewsletter(input: unknown): Promise<Result> {
  const limit = await rateLimit(clientKey(await headers(), "newsletter"), 5, 10 * 60_000);
  if (!limit.ok) return { ok: false, error: "Too many attempts. Please try again in a few minutes." };

  const parsed = validate(newsletterSchema, input);
  if (!parsed.ok) return { ok: false, error: parsed.errors.email ?? "Please check your email address." };
  // Honeypot filled — pretend success so bots learn nothing.
  if (parsed.data.website) return { ok: true };

  // Upsert re-activates a past unsubscribe and never reveals whether the email was already on the list.
  const { error } = await createAdminClient()
    .from("newsletter_subscribers")
    .upsert({ email: parsed.data.email, unsubscribed_at: null, source: "site" }, { onConflict: "email" });
  if (error) {
    console.error("[newsletter] upsert failed", error);
    return { ok: false, error: "We couldn't subscribe you right now. Please try again." };
  }
  return { ok: true };
}
