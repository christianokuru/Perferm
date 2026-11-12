"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteReview, moderateReview, setMessageStatus } from "@/app/actions/admin";
import { DownloadIcon, MailIcon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, Rating } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import type { AdminMessage, AdminReview } from "@/lib/admin/queries";
import { cn, formatDate } from "@/lib/utils";

import { AdminCard, AdminHeading } from "./admin-shell";
import { Pagination } from "./pagination";

function FilterTabs<T extends string>({ basePath, current, tabs }: { basePath: string; current: T | null; tabs: Array<{ value: T | null; label: string; param?: string }> }) {
  return (
    <nav aria-label="Filter" className="no-scrollbar -mx-4 mb-4 flex gap-1 overflow-x-auto px-4">
      {tabs.map((t) => (
        <Link
          key={t.label}
          href={t.param ? `${basePath}?status=${t.param}` : t.value ? `${basePath}?status=${t.value}` : basePath}
          aria-current={current === t.value ? "page" : undefined}
          className={cn("flex h-9 shrink-0 items-center rounded-full px-4 text-body-sm", current === t.value ? "bg-ink text-white" : "bg-white text-ink hover:bg-mist")}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/* --------------------------------- Reviews --------------------------------- */

function ReviewActions({ review }: { review: AdminReview }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (action: () => Promise<{ ok: boolean; error?: string }>, message: string) =>
    start(async () => {
      const result = await action();
      if (!result.ok) return void toast.error(result.error ?? "Something went wrong.");
      toast.success(message);
      router.refresh();
    });

  return (
    <div className="flex flex-wrap gap-2">
      {review.status !== "approved" ? (
        <Button size="sm" disabled={pending} onClick={() => run(() => moderateReview(review.id, "approved"), "Review published")}>
          Approve
        </Button>
      ) : null}
      {review.status !== "rejected" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => moderateReview(review.id, "rejected"), "Review hidden")}>
          {review.status === "approved" ? "Unpublish" : "Reject"}
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => window.confirm("Delete this review permanently?") && run(() => deleteReview(review.id), "Review deleted")}
      >
        Delete
      </Button>
    </div>
  );
}

export function ReviewsAdmin({ items, total, status, page }: { items: AdminReview[]; total: number; status: AdminReview["status"] | null; page: number }) {
  return (
    <>
      <AdminHeading title="Reviews" description="Customers who received an order can review it. Nothing is published until you approve it." />
      <FilterTabs
        basePath="/admin/reviews"
        current={status}
        tabs={[
          { value: null, label: "All" },
          { value: "pending", label: "Awaiting approval" },
          { value: "approved", label: "Published" },
          { value: "rejected", label: "Rejected" },
        ]}
      />
      {items.length ? (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id}>
              <AdminCard className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Rating value={r.rating} />
                  <Badge tone={r.status === "approved" ? "saffron" : r.status === "pending" ? "outline" : "light"}>{r.status}</Badge>
                  {r.verified ? <Badge tone="light">Verified purchase</Badge> : null}
                  <span className="text-caption text-smoke">{formatDate(r.createdAt)}</span>
                </div>
                <div>
                  <p className="text-body text-ink">{r.title}</p>
                  <p className="mt-1 text-body-sm whitespace-pre-line text-graphite">{r.body}</p>
                  <p className="mt-2 text-caption text-smoke">
                    {r.author}
                    {r.city ? `, ${r.city}` : ""} on{" "}
                    {r.productSlug ? (
                      <Link href={`/product/${r.productSlug}`} className="underline underline-offset-2 hover:text-ink">
                        {r.productName}
                      </Link>
                    ) : (
                      r.productName
                    )}
                  </p>
                </div>
                <ReviewActions review={r} />
              </AdminCard>
            </li>
          ))}
        </ul>
      ) : (
        <AdminCard>
          <EmptyState title="No reviews here" description="New reviews from customers appear here for approval." />
        </AdminCard>
      )}
      <Pagination page={page} total={total} pageSize={25} basePath="/admin/reviews" params={{ status: status ?? undefined }} />
    </>
  );
}

/* --------------------------------- Messages -------------------------------- */

const topicLabels: Record<AdminMessage["topic"], string> = {
  order: "Order",
  recommendation: "Recommendation",
  wholesale: "Wholesale",
  press: "Press",
  other: "Other",
};

function MessageActions({ message }: { message: AdminMessage }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const update = (status: AdminMessage["status"], done: string) =>
    start(async () => {
      const result = await setMessageStatus(message.id, status);
      if (!result.ok) return void toast.error(result.error ?? "Something went wrong.");
      toast.success(done);
      router.refresh();
    });

  return (
    <div className="flex flex-wrap gap-2">
      <ButtonLink
        href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: your Perferm enquiry`)}`}
        size="sm"
        icon={<MailIcon size={14} />}
      >
        Reply
      </ButtonLink>
      {message.status === "new" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => update("handled", "Marked as handled")}>
          Mark handled
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => update("new", "Moved back to new")}>
          Mark as new
        </Button>
      )}
      {message.status !== "archived" ? (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => update("archived", "Archived")}>
          Archive
        </Button>
      ) : null}
    </div>
  );
}

export function MessagesAdmin({
  items,
  total,
  status,
  page,
  subscriberCount,
  recentSubscribers,
}: {
  items: AdminMessage[];
  total: number;
  status: AdminMessage["status"] | null;
  page: number;
  subscriberCount: number;
  recentSubscribers: Array<{ id: string; email: string; created_at: string; unsubscribed_at: string | null }>;
}) {
  return (
    <>
      <AdminHeading title="Messages" description="Concierge enquiries from the contact form, and newsletter sign-ups." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div>
          <FilterTabs
            basePath="/admin/messages"
            current={status}
            tabs={[
              { value: "new", label: "New" },
              { value: "handled", label: "Handled" },
              { value: "archived", label: "Archived" },
              { value: null, label: "All", param: "all" },
            ]}
          />
          {items.length ? (
            <ul className="space-y-3">
              {items.map((m) => (
                <li key={m.id}>
                  <AdminCard className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={m.status === "new" ? "saffron" : "light"}>{m.status}</Badge>
                      <Badge tone="outline">{topicLabels[m.topic]}</Badge>
                      <span className="text-caption text-smoke">{formatDate(m.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <p className="text-body-sm text-ink">
                      {m.name} · <span className="text-smoke">{m.email}</span>
                    </p>
                    <p className="text-body-sm whitespace-pre-line text-graphite">{m.message}</p>
                    <MessageActions message={m} />
                  </AdminCard>
                </li>
              ))}
            </ul>
          ) : (
            <AdminCard>
              <EmptyState title="Inbox zero" description="New concierge messages appear here and are emailed to the store inbox." />
            </AdminCard>
          )}
          <Pagination page={page} total={total} pageSize={25} basePath="/admin/messages" params={{ status: status ?? "all" }} />
        </div>

        <AdminCard className="self-start p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-body text-ink">Newsletter</h2>
              <p className="mt-1 text-caption text-smoke">
                {subscriberCount} subscriber{subscriberCount === 1 ? "" : "s"}
              </p>
            </div>
            <a href="/admin/subscribers/export" className="inline-flex h-9 items-center gap-2 rounded-full border border-mist px-4 text-body-sm text-ink hover:border-ink" download>
              <DownloadIcon size={14} /> CSV
            </a>
          </div>
          {recentSubscribers.length ? (
            <ul className="mt-4 space-y-2 text-body-sm">
              {recentSubscribers.map((s) => (
                <li key={s.id} className="flex justify-between gap-3">
                  <span className={cn("truncate", s.unsubscribed_at ? "text-smoke line-through" : "text-ink")}>{s.email}</span>
                  <span className="shrink-0 text-caption text-smoke">{formatDate(s.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-body-sm text-smoke">No subscribers yet.</p>
          )}
        </AdminCard>
      </div>
    </>
  );
}
