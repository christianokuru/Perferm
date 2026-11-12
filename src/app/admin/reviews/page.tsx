import type { Metadata } from "next";

import { ReviewsAdmin } from "@/components/admin/inbox-admin";
import { listReviewsForAdmin, parsePage } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Reviews" };

const STATUSES = ["pending", "approved", "rejected"] as const;

export default async function Page({ searchParams }: PageProps<"/admin/reviews">) {
  await requireAdmin("/admin/reviews");
  const params = await searchParams;
  const status = STATUSES.find((s) => s === params.status) ?? null;
  const page = parsePage(params.page);
  const result = await listReviewsForAdmin(status, page);
  return <ReviewsAdmin {...result} status={status} page={page} />;
}
