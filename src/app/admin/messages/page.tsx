import type { Metadata } from "next";
import { Suspense } from "react";

import { MessagesAdmin } from "@/components/admin/inbox-admin";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { listMessages, listSubscribers, parsePage } from "@/lib/admin/queries";
import { withAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Messages" };

const STATUSES = ["new", "handled", "archived"] as const;

export default function Page(props: PageProps<"/admin/messages">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MessagesContent {...props} />
    </Suspense>
  );
}

async function MessagesContent({ searchParams }: PageProps<"/admin/messages">) {
  const params = await searchParams;
  const status = STATUSES.find((s) => s === params.status) ?? (params.status === "all" ? null : "new");
  const page = parsePage(params.page);
  const [, [messages, subscribers]] = await withAdmin("/admin/messages", () => Promise.all([listMessages(status, page), listSubscribers(1)]));
  return <MessagesAdmin {...messages} status={status} page={page} subscriberCount={subscribers.total} recentSubscribers={subscribers.items.slice(0, 8)} />;
}
