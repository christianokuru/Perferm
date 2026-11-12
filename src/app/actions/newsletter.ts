"use server";

import { headers } from "next/headers";

import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { validate } from "@/lib/validation/fields";
import { newsletterSchema } from "@/lib/validation/schemas";

type Result = { ok: true } | { ok: false; error: string };

export async function subscribeToNewsletter(input: unknown): Promise<Result> {
  const limit = rateLimit(clientKey(await headers(), "newsletter"), 5, 10 * 60_000);
  if (!limit.ok) return { ok: false, error: "Too many attempts. Please try again in a few minutes." };

  const parsed = validate(newsletterSchema, input);
  if (!parsed.ok) return { ok: false, error: parsed.errors.email ?? "Please check your email address." };
  // Honeypot filled — pretend success so bots learn nothing.
  if (parsed.data.website) return { ok: true };

  // TODO(supabase): insert into `newsletter_subscribers` (unique email) / sync to ESP.
  return { ok: true };
}
