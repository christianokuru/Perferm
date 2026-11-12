"use server";

import { headers } from "next/headers";

import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { contactSchema } from "@/lib/validation/schemas";

type Result = { ok: true } | { ok: false; error?: string; fieldErrors?: FieldErrors };

export async function sendContactMessage(input: unknown): Promise<Result> {
  const limit = rateLimit(clientKey(await headers(), "contact"), 3, 10 * 60_000);
  if (!limit.ok) return { ok: false, error: "You've sent a few messages already — please try again shortly." };

  const parsed = validate(contactSchema, input);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
  if (parsed.data.website) return { ok: true };

  // TODO(supabase): persist to `contact_messages` and notify the concierge inbox.
  return { ok: true };
}
