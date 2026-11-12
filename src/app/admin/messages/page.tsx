import type { Metadata } from "next";

import { MessagesAdmin } from "@/components/admin/inbox-admin";
import { listMessages, listSubscribers, parsePage } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Messages" };

const STATUSES = ["new", "handled", "archived"] as const;

export default async function Page({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdmin("/admin/messages");
  const params = await searchParams;
  const status = STATUSES.find((s) => s === params.status) ?? (params.status === "all" ? null : "new");
  const page = parsePage(params.page);
  const [messages, subscribers] = await Promise.all([listMessages(status, page), listSubscribers(1)]);
  return <MessagesAdmin {...messages} status={status} page={page} subscriberCount={subscribers.total} recentSubscribers={subscribers.items.slice(0, 8)} />;
}
