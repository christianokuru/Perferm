import { Rating } from "@/components/ui/misc";
import type { Review } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="flex h-full flex-col rounded-[var(--radius-card)] border border-apricot/60 p-5 md:p-6">
      <Rating value={review.rating} />
      <blockquote className="mt-5 flex-1">
        <p className="text-subheading leading-tight font-light tracking-[-0.04em] text-ink">{review.title}</p>
        <p className="mt-3 text-body-sm text-graphite/80">{review.body}</p>
      </blockquote>
      <figcaption className="mt-6 flex items-center justify-between border-t border-mist pt-4 text-caption">
        <span className="text-ink">
          {review.author} <span className="text-smoke">· {review.city}</span>
        </span>
        <time dateTime={review.date} className="text-smoke">
          {formatDate(review.date)}
        </time>
      </figcaption>
    </figure>
  );
}
