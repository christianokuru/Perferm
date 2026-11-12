import type { Metadata } from "next";
import { Suspense } from "react";

import { ReviewsAdmin } from "@/components/admin/inbox-admin";
import { PageSkeleton } from "@/components/providers/hydration-gate";
import { listReviewsForAdmin, parsePage } from "@/lib/admin/queries";
import { withAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Reviews" };

const STATUSES = ["pending", "approved", "rejected"] as const;

export default function Page(props: PageProps<"/admin/reviews">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReviewsContent {...props} />
    </Suspense>
  );
}

async function ReviewsContent({ searchParams }: PageProps<"/admin/reviews">) {
  const params = await searchParams;
  const status = STATUSES.find((s) => s === params.status) ?? null;
  const page = parsePage(params.page);
  const [, result] = await withAdmin("/admin/reviews", () => listReviewsForAdmin(status, page));
  return <ReviewsAdmin {...result} status={status} page={page} />;
}
