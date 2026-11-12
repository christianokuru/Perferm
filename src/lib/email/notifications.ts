import "server-only";

import { siteConfig } from "@/lib/config/site";
import { serverEnv } from "@/lib/config/server-env";
import { getOrderById } from "@/lib/orders/repository";
import { createAdminClient } from "@/lib/supabase/admin";

import { sendEmail } from "./send";
import { newOrderAlertEmail, orderConfirmationEmail, orderStatusEmail } from "./templates";

/** Where store alerts go: STORE_INBOX_EMAIL, else the support email in settings. */
export async function storeInbox(): Promise<string | null> {
  if (serverEnv.storeInbox) return serverEnv.storeInbox;
  const { data } = await createAdminClient().from("store_settings").select("support_email").eq("id", 1).maybeSingle();
  return data?.support_email ?? null;
}

function orderLink(order: { reference: string; userId?: string | null }): string {
  // Account holders get their account page; guests get order tracking (reference + email).
  return order.userId
    ? `${siteConfig.url}/account/orders/${order.reference}`
    : `${siteConfig.url}/track?ref=${encodeURIComponent(order.reference)}`;
}

export async function sendOrderPaidEmails(orderId: string): Promise<void> {
  const order = await getOrderById(orderId);
  if (!order) return;
  const customer = orderConfirmationEmail(order, orderLink(order));
  const inbox = await storeInbox();
  const alert = newOrderAlertEmail(order, `${siteConfig.url}/admin/orders/${order.reference}`);
  await Promise.all([
    sendEmail({ to: order.customer.email, ...customer, idempotencyKey: `order-paid/${order.id}` }),
    inbox ? sendEmail({ to: inbox, ...alert, replyTo: order.customer.email, idempotencyKey: `order-alert/${order.id}` }) : null,
  ]);
}

export async function sendOrderStatusUpdate(orderId: string): Promise<void> {
  const order = await getOrderById(orderId);
  if (!order || order.status === "pending" || order.status === "paid") return;
  const email = orderStatusEmail(order, orderLink(order));
  await sendEmail({ to: order.customer.email, ...email, idempotencyKey: `order-status/${order.id}/${order.status}` });
}
