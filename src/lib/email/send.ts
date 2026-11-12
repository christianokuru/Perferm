import "server-only";

import { serverEnv } from "@/lib/config/server-env";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** De-duplicates retries on Resend's side (e.g. `order-paid/<id>`). */
  idempotencyKey?: string;
}

/**
 * Sends through Resend's REST API. Never throws: email is a side effect and
 * must not break checkout or admin flows. Returns whether it was accepted.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  if (!serverEnv.resendApiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${message.subject}"`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.resendApiKey}`,
        "Content-Type": "application/json",
        ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: serverEnv.emailFrom,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[email] Resend rejected "${message.subject}" (${res.status}): ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[email] failed to send "${message.subject}"`, error);
    return false;
  }
}
