"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { trackOrder } from "@/app/actions/track";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { focusFirstError } from "@/lib/focus";
import type { Order } from "@/lib/types";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { trackOrderSchema } from "@/lib/validation/schemas";

import { OrderDetails, OrderStatusBadge, OrderTimeline } from "./order-details";

export function TrackOrder() {
  const params = useSearchParams();
  const [values, setValues] = useState({ reference: params.get("ref") ?? "", email: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = validate(trackOrderSchema, values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return focusFirstError();
    }
    setErrors({});
    setPending(true);
    const result = await trackOrder(values);
    setPending(false);
    if (!result.ok) {
      setOrder(null);
      setErrors(result.fieldErrors ?? {});
      return setFormError(result.error ?? "Please check the highlighted fields.");
    }
    setOrder(result.order);
  };

  return (
    <div className="space-y-10">
      <form onSubmit={onSubmit} noValidate className="grid max-w-2xl grid-cols-1 gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Order reference" error={errors.reference}>
          {(p) => <Input {...p} autoComplete="off" maxLength={11} placeholder="PF-XXXXXXXX" value={values.reference} onChange={(e) => setValues({ ...values, reference: e.target.value })} />}
        </Field>
        <Field label="Email used at checkout" error={errors.email}>
          {(p) => <Input {...p} type="email" autoComplete="email" inputMode="email" maxLength={254} value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />}
        </Field>
        <Button type="submit" loading={pending} className="h-12">
          Track
        </Button>
        {formError ? (
          <div className="sm:col-span-3">
            <FormMessage>{formError}</FormMessage>
          </div>
        ) : null}
      </form>

      {order ? (
        <section className="animate-fade-up rounded-[var(--radius-card)] border border-mist p-5 md:p-8" aria-live="polite">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h2 className="font-mono text-[1.5rem] tracking-tight text-ink">{order.reference}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <OrderTimeline order={order} />
          <div className="mt-8">
            <OrderDetails order={order} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
