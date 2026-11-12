"use server";

import { headers } from "next/headers";
import { after } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { storeInbox } from "@/lib/email/notifications";
import { sendEmail } from "@/lib/email/send";
import { contactNotificationEmail } from "@/lib/email/templates";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { contactSchema } from "@/lib/validation/schemas";

type Result = { ok: true } | { ok: false; error?: string; fieldErrors?: FieldErrors };

const topicLabels: Record<string, string> = {
  order: "An order",
  recommendation: "Recommendation",
  wholesale: "Wholesale & events",
  press: "Press",
  other: "Other",
};

/** Concierge enquiries: stored for the admin inbox and forwarded to the store's email. */
export async function sendContactMessage(input: unknown): Promise<Result> {
  const limit = await rateLimit(clientKey(await headers(), "contact"), 3, 10 * 60_000);
  if (!limit.ok) return { ok: false, error: "You've sent a few messages already — please try again shortly." };

  const parsed = validate(contactSchema, input);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
  // Honeypot filled: pretend success so bots learn nothing.
  if (parsed.data.website) return { ok: true };

  const { name, email, topic, message } = parsed.data;
  const user = await getSessionUser();
  const { error } = await createAdminClient().from("contact_messages").insert({ name, email, topic, message, user_id: user?.id ?? null });
  if (error) {
    console.error("[contact] insert failed", error);
    return { ok: false, error: "We couldn't send your message. Please try again or WhatsApp us." };
  }

  after(async () => {
    const inbox = await storeInbox();
    if (inbox) await sendEmail({ to: inbox, replyTo: email, ...contactNotificationEmail({ name, email, topic: topicLabels[topic] ?? topic, message }) });
  });
  return { ok: true };
}
