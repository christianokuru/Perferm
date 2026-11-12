"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { getReviewEligibility, submitReview, type ReviewEligibility } from "@/app/actions/reviews";
import { StarIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/form";
import { focusFirstError } from "@/lib/focus";
import { cn } from "@/lib/utils";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { reviewSchema } from "@/lib/validation/schemas";
import { useSessionStatus } from "@/stores/session-store";

function StarPicker({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-body-sm text-ink">Your rating</legend>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => onChange(n)}
            className={cn("flex size-10 items-center justify-center rounded-full transition-colors hover:bg-pearl", n <= value ? "text-saffron" : "text-mist")}
          >
            <StarIcon size={22} filled={n <= value} />
          </button>
        ))}
      </div>
      {error ? <p className="mt-1 text-caption text-danger">{error}</p> : null}
    </fieldset>
  );
}

/** Verified-purchase review form. Eligibility is decided on the server (delivered order, one review each). */
export function ReviewForm({ productId, productSlug }: { productId: string; productSlug: string }) {
  const status = useSessionStatus();
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [values, setValues] = useState({ rating: 0, title: "", body: "", city: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;
    void getReviewEligibility(productId).then((result) => !cancelled && setEligibility(result));
    return () => {
      cancelled = true;
    };
  }, [productId, status]);

  if (!eligibility) return null;

  const shell = (children: React.ReactNode) => (
    <div id="write-review" className="scroll-mt-24 rounded-[var(--radius-card)] bg-white p-5 md:p-6">
      {children}
    </div>
  );

  if (done || eligibility.state === "reviewed") {
    const approved = eligibility.state === "reviewed" && eligibility.status === "approved";
    return shell(
      <p className="text-body-sm text-graphite">
        {done || !approved ? "Thank you — your review is with our concierge and will appear once approved." : "Thank you for reviewing this fragrance."}
      </p>,
    );
  }
  if (eligibility.state === "anonymous") {
    return shell(
      <p className="text-body-sm text-graphite">
        Bought this fragrance?{" "}
        <Link href={`/login?next=${encodeURIComponent(`/product/${productSlug}#write-review`)}`} className="text-ink underline underline-offset-4">
          Sign in
        </Link>{" "}
        to share a verified review.
      </p>,
    );
  }
  if (eligibility.state === "not_purchased") {
    return shell(<p className="text-body-sm text-graphite">Reviews are written by clients once their order of this fragrance has been delivered.</p>);
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const payload = { productId, ...values };
    const parsed = validate(reviewSchema, payload);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return focusFirstError();
    }
    setErrors({});
    setPending(true);
    const result = await submitReview(payload);
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      return setFormError(result.error ?? "Please check the highlighted fields.");
    }
    setDone(true);
  };

  return shell(
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <h3 className="text-subheading font-light text-ink">Write a review</h3>
      {formError ? <FormMessage>{formError}</FormMessage> : null}
      <StarPicker value={values.rating} onChange={(rating) => setValues({ ...values, rating })} error={errors.rating} />
      <Field label="Title" error={errors.title}>
        {(p) => <Input {...p} maxLength={80} value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} />}
      </Field>
      <Field label="Your review" error={errors.body}>
        {(p) => <Textarea {...p} rows={4} maxLength={1500} value={values.body} onChange={(e) => setValues({ ...values, body: e.target.value })} />}
      </Field>
      <Field label="City" optional error={errors.city}>
        {(p) => <Input {...p} maxLength={60} placeholder="e.g. Lekki, Lagos" value={values.city} onChange={(e) => setValues({ ...values, city: e.target.value })} />}
      </Field>
      <Button type="submit" loading={pending}>
        Submit review
      </Button>
    </form>,
  );
}
