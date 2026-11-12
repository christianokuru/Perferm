import { ReviewCard } from "@/components/reviews/review-card";
import { Accent, Eyebrow } from "@/components/ui/typography";
import type { Review } from "@/lib/types";

export function Testimonials({ reviews }: { reviews: Review[] }) {
  return (
    <section aria-labelledby="reviews-title" className="py-16 md:py-24">
      <div className="container-page flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <Eyebrow>Clients</Eyebrow>
          <h2 id="reviews-title" className="text-heading font-light text-ink">
            in their <Accent>words</Accent>
          </h2>
        </div>
        <p className="text-body-sm text-smoke">Verified reviews from Perferm clients</p>
      </div>
      <ul className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 md:scroll-px-6 md:px-6 xl:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        {reviews.map((review) => (
          <li key={review.id} className="relative w-[84%] shrink-0 snap-start sm:w-[48%] lg:w-[31%]">
            <ReviewCard review={review} />
          </li>
        ))}
      </ul>
    </section>
  );
}
