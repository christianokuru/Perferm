import "server-only";

import { orderStatusLabels } from "@/lib/catalog/labels";
import { siteConfig } from "@/lib/config/site";
import { formatNaira } from "@/lib/money";
import type { Order } from "@/lib/types";

/** Escapes every interpolated value — customer-supplied text is never trusted as HTML. */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f4f2;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-size:22px;letter-spacing:-0.5px;font-weight:300">${esc(siteConfig.name)}</td></tr>
<tr><td style="padding-top:24px"><h1 style="margin:0;font-size:26px;font-weight:300;letter-spacing:-0.8px">${esc(title)}</h1></td></tr>
<tr><td style="padding-top:16px;font-size:15px;line-height:1.6;color:#333">${body}</td></tr>
<tr><td style="padding-top:32px;font-size:12px;color:#6f6f6f;border-top:1px solid #eee">${esc(siteConfig.legalName)} · ${esc(siteConfig.boutique.street)}, ${esc(siteConfig.boutique.area)}, ${esc(siteConfig.boutique.city)}</td></tr>
</table></td></tr></table></body></html>`;
}

function lineItems(order: Order): string {
  const rows = order.lines
    .map(
      (l) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(l.name)}<br><span style="color:#6f6f6f;font-size:13px">${esc(l.house)} · ${esc(l.variantLabel)} · Qty ${l.quantity}</span></td>
<td align="right" style="padding:8px 0;border-bottom:1px solid #eee;white-space:nowrap">${esc(formatNaira(l.unitPrice * l.quantity))}</td></tr>`,
    )
    .join("");
  const fulfilment = order.fulfilment.method === "pickup" ? "Boutique pickup" : `Delivery · ${esc(order.fulfilment.state)}`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;font-size:14px">${rows}
<tr><td style="padding-top:12px;color:#6f6f6f">Subtotal</td><td align="right" style="padding-top:12px">${esc(formatNaira(order.totals.subtotal))}</td></tr>
<tr><td style="color:#6f6f6f">${fulfilment}</td><td align="right">${order.totals.deliveryFee ? esc(formatNaira(order.totals.deliveryFee)) : "Free"}</td></tr>
<tr><td style="padding-top:8px;font-size:16px">Total</td><td align="right" style="padding-top:8px;font-size:16px">${esc(formatNaira(order.totals.total))}</td></tr></table>`;
}

function destination(order: Order): string {
  const f = order.fulfilment;
  return f.method === "pickup"
    ? `<p><strong>Pickup:</strong> ${esc(f.location ?? `${siteConfig.boutique.street}, ${siteConfig.boutique.area}`)}. Bring a valid ID and your order reference.</p>`
    : `<p><strong>Delivering to:</strong> ${esc(order.customer.name)}, ${esc(f.address)}, ${esc(f.city)}, ${esc(f.state)}</p>`;
}

export function orderConfirmationEmail(order: Order, orderUrl: string) {
  const first = order.customer.name.split(" ")[0];
  const html = layout(
    `Thank you, ${first}`,
    `<p>Your order <strong>${esc(order.reference)}</strong> is confirmed and our concierge is preparing it now.</p>
${lineItems(order)}${destination(order)}
<p><a href="${esc(orderUrl)}" style="display:inline-block;margin-top:8px;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px">View your order</a></p>
<p style="color:#6f6f6f;font-size:13px">Questions? Reply to this email or WhatsApp ${esc(siteConfig.contact.phone)}.</p>`,
  );
  const text = `Thank you, ${first}. Your order ${order.reference} is confirmed. Total ${formatNaira(order.totals.total)}. View it: ${orderUrl}`;
  return { subject: `Order ${order.reference} confirmed`, html, text };
}

const statusCopy: Partial<Record<Order["status"], string>> = {
  processing: "Your order is being carefully wrapped by our concierge.",
  shipped: "Your order is on its way. Our dispatch rider will call before arriving.",
  ready_for_pickup: "Your order is wrapped and waiting for you at the boutique. Bring a valid ID and your order reference.",
  delivered: "Your order has been delivered. We hope you love it — we'd be grateful for a review.",
  cancelled: "Your order has been cancelled. If you were charged, our concierge will contact you about your refund.",
};

export function orderStatusEmail(order: Order, orderUrl: string) {
  const label = order.status === "delivered" && order.fulfilment.method === "pickup" ? "Collected" : orderStatusLabels[order.status];
  const message = statusCopy[order.status] ?? `Your order status is now: ${label}.`;
  const html = layout(
    `${label}`,
    `<p>Order <strong>${esc(order.reference)}</strong>: ${esc(message)}</p>
<p><a href="${esc(orderUrl)}" style="display:inline-block;margin-top:8px;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px">Track your order</a></p>`,
  );
  return { subject: `Order ${order.reference}: ${label}`, html, text: `Order ${order.reference}: ${message} ${orderUrl}` };
}

export function newOrderAlertEmail(order: Order, adminUrl: string) {
  const html = layout(
    `New order ${order.reference}`,
    `<p>${esc(order.customer.name)} · ${esc(order.customer.email)} · ${esc(order.customer.phone)}</p>
${order.stockIssue ? `<p style="color:#b42318"><strong>Stock warning:</strong> at least one item was oversold. Check the order before dispatch.</p>` : ""}
${lineItems(order)}${destination(order)}
${order.fulfilment.method === "delivery" && order.fulfilment.notes ? `<p><strong>Notes:</strong> ${esc(order.fulfilment.notes)}</p>` : ""}
<p><a href="${esc(adminUrl)}">Open in the dashboard</a></p>`,
  );
  return {
    subject: `${order.payment.mode === "demo" ? "[TEST] " : ""}New order ${order.reference} — ${formatNaira(order.totals.total)}`,
    html,
    text: `New order ${order.reference} from ${order.customer.name}: ${formatNaira(order.totals.total)}. ${adminUrl}`,
  };
}

export function contactNotificationEmail(input: { name: string; email: string; topic: string; message: string }) {
  const html = layout(
    `New message: ${input.topic}`,
    `<p><strong>${esc(input.name)}</strong> &lt;${esc(input.email)}&gt;</p><p style="white-space:pre-wrap">${esc(input.message)}</p>
<p style="color:#6f6f6f;font-size:13px">Reply directly to this email to answer the customer.</p>`,
  );
  return { subject: `[Concierge] ${input.topic} — ${input.name}`, html, text: `${input.name} <${input.email}>\n\n${input.message}` };
}
