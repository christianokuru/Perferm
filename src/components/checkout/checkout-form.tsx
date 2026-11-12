"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { prepareCheckout, quoteBag } from "@/app/actions/checkout";
import { LockIcon, StoreIcon, TruckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ChoiceCard, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import type { Quote } from "@/lib/checkout/pricing";
import { siteConfig } from "@/lib/config/site";
import { deliveryZones } from "@/lib/data/delivery-zones";
import { formatNaira } from "@/lib/money";
import { providerInfo } from "@/lib/payments/types";
import type { FulfilmentMethod, Order, PaymentProvider } from "@/lib/types";
import { focusFirstError } from "@/lib/focus";
import { createReference } from "@/lib/utils";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { checkoutSchema } from "@/lib/validation/schemas";
import type { User } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useOrderStore } from "@/stores/order-store";

import { OrderSummary } from "./order-summary";
import { usePaymentGateway } from "./use-payment-gateway";

function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="flex items-baseline gap-3 text-subheading font-light text-ink">
      <span className="text-caption text-smoke tabular-nums">0{step}</span>
      {title}
    </h2>
  );
}

/**
 * One-page checkout. Every total shown and charged comes from the server
 * quote; the browser cart only supplies product IDs and quantities.
 */
export function CheckoutForm({ user }: { user: User | null }) {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const reconcile = useCartStore((s) => s.reconcile);
  const clearCart = useCartStore((s) => s.clear);
  const addOrder = useOrderStore((s) => s.add);
  const { pay, dialog } = usePaymentGateway();

  const defaultAddress = user?.addresses.find((a) => a.isDefault) ?? user?.addresses[0];

  const [contact, setContact] = useState({
    email: user?.email ?? "",
    name: user?.name ?? "",
    phone: user?.phone ?? defaultAddress?.phone ?? "",
  });
  const [method, setMethod] = useState<FulfilmentMethod>("delivery");
  const [delivery, setDelivery] = useState({
    state: defaultAddress?.state ?? "",
    city: defaultAddress?.city ?? "",
    address: defaultAddress?.address ?? "",
    notes: "",
  });
  const [provider, setProvider] = useState<PaymentProvider>("paystack");
  const [errors, setErrors] = useState<FieldErrors>({});
  const clearError = (key: string) =>
    setErrors((current) => {
      if (!(key in current)) return current;
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
  const updateContact = (key: keyof typeof contact, value: string) => {
    setContact((c) => ({ ...c, [key]: value }));
    clearError(key);
  };
  const updateDelivery = (key: keyof typeof delivery, value: string) => {
    setDelivery((d) => ({ ...d, [key]: value }));
    clearError(`fulfilment.${key}`);
  };
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);

  const cartPayload = useMemo(
    () => lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
    [lines],
  );

  // Live, server-side re-pricing whenever the bag or destination changes.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setQuoting(true);
      const result = await quoteBag({
        lines: cartPayload,
        fulfilment: method === "pickup" ? { method } : { method, state: delivery.state || undefined },
      });
      if (cancelled) return;
      setQuoting(false);
      if (result.ok) {
        setQuote(result.quote);
        // Correct any stale or tampered display prices in the saved bag.
        reconcile(result.quote.lines);
      } else setFormError(result.error);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [cartPayload, method, delivery.state, reconcile]);

  const zone = deliveryZones.find((z) => z.state === delivery.state);

  const buildPayload = () => ({
    ...contact,
    provider,
    lines: cartPayload,
    fulfilment: method === "pickup" ? { method } : { method, ...delivery },
  });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const payload = buildPayload();
    const local = validate(checkoutSchema, payload);
    if (!local.ok) {
      setErrors(local.errors);
      focusFirstError();
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const prepared = await prepareCheckout(payload);
      if (!prepared.ok) {
        if (prepared.quote) {
          setQuote(prepared.quote);
          reconcile(prepared.quote.lines);
        }
        setErrors(prepared.fieldErrors ?? {});
        setFormError(prepared.error ?? "Please check the highlighted fields.");
        focusFirstError();
        return;
      }

      const reference = createReference();
      const outcome = await pay({
        provider,
        reference,
        amount: prepared.quote.totals.total,
        email: prepared.customer.email,
        name: prepared.customer.name,
        phone: prepared.customer.phone,
      });

      if (outcome.status === "cancelled") {
        toast.show("Payment cancelled — your bag is saved.");
        return;
      }
      if (outcome.status === "failed") {
        setFormError(outcome.message);
        return;
      }

      const order: Order = {
        reference,
        createdAt: new Date().toISOString(),
        status: "paid",
        customer: prepared.customer,
        fulfilment:
          prepared.fulfilment.method === "pickup"
            ? { method: "pickup" }
            : {
                method: "delivery",
                state: prepared.fulfilment.state,
                city: prepared.fulfilment.city,
                address: prepared.fulfilment.address,
                notes: prepared.fulfilment.notes || undefined,
              },
        payment: { provider, mode: outcome.mode, transactionId: outcome.transactionId },
        lines: prepared.quote.lines,
        totals: prepared.quote.totals,
      };
      addOrder(order);
      clearCart();
      router.push(`/checkout/success?ref=${encodeURIComponent(reference)}`);
    } catch {
      setFormError("Something went wrong on our side. You have not been charged — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const total = quote?.totals.total ?? 0;
  const stateChosen = Boolean(delivery.state);
  const canPay = Boolean(quote?.lines.length) && (method === "pickup" || stateChosen);

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
      <div className="space-y-12">
        {/* 01 Contact */}
        <section className="space-y-5" aria-labelledby="contact-step">
          <div id="contact-step">
            <StepHeading step={1} title="Contact" />
          </div>
          {!user ? (
            <p className="text-body-sm text-smoke">
              Have an account?{" "}
              <Link href="/login?next=/checkout" className="text-ink underline underline-offset-4">
                Sign in
              </Link>{" "}
              for faster checkout.
            </p>
          ) : null}
          <Field label="Email" error={errors.email}>
            {(p) => (
              <Input {...p} type="email" autoComplete="email" inputMode="email" maxLength={254} value={contact.email} onChange={(e) => updateContact("email", e.target.value)} />
            )}
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Full name" error={errors.name}>
              {(p) => <Input {...p} autoComplete="name" maxLength={80} value={contact.name} onChange={(e) => updateContact("name", e.target.value)} />}
            </Field>
            <Field label="Phone" error={errors.phone} hint="For delivery updates via SMS / WhatsApp">
              {(p) => (
                <Input {...p} type="tel" autoComplete="tel" inputMode="tel" maxLength={20} placeholder="0801 234 5678" value={contact.phone} onChange={(e) => updateContact("phone", e.target.value)} />
              )}
            </Field>
          </div>
        </section>

        {/* 02 Fulfilment */}
        <section className="space-y-5" aria-labelledby="fulfilment-step">
          <div id="fulfilment-step">
            <StepHeading step={2} title="Delivery or pickup" />
          </div>
          <div role="radiogroup" aria-labelledby="fulfilment-step" className="grid gap-3">
            <ChoiceCard
              name="fulfilment"
              value="delivery"
              checked={method === "delivery"}
              onChange={() => setMethod("delivery")}
              icon={<TruckIcon />}
              title="Deliver to me"
              description="All 36 states + FCT · fee depends on your state"
              aside={zone ? formatNaira(zone.fee) : null}
            />
            <ChoiceCard
              name="fulfilment"
              value="pickup"
              checked={method === "pickup"}
              onChange={() => setMethod("pickup")}
              icon={<StoreIcon />}
              title="Pick up at the boutique"
              description={`${siteConfig.boutique.street}, ${siteConfig.boutique.area} · ${siteConfig.boutique.hours}`}
              aside="Free"
            />
          </div>

          {method === "delivery" ? (
            <div className="grid grid-cols-1 animate-fade-in gap-5 sm:grid-cols-2">
              <Field label="State" error={errors["fulfilment.state"]} hint={zone ? `${zone.eta} · ${formatNaira(zone.fee)}` : undefined}>
                {(p) => (
                  <Select {...p} autoComplete="address-level1" value={delivery.state} onChange={(e) => updateDelivery("state", e.target.value)}>
                    <option value="">Choose your state</option>
                    {[...deliveryZones]
                      .sort((a, b) => a.state.localeCompare(b.state))
                      .map((z) => (
                        <option key={z.state} value={z.state}>
                          {z.state} — {formatNaira(z.fee)}
                        </option>
                      ))}
                  </Select>
                )}
              </Field>
              <Field label="City / area" error={errors["fulfilment.city"]}>
                {(p) => <Input {...p} autoComplete="address-level2" maxLength={60} placeholder="e.g. Lekki Phase 1" value={delivery.city} onChange={(e) => updateDelivery("city", e.target.value)} />}
              </Field>
              <Field label="Street address" error={errors["fulfilment.address"]} className="sm:col-span-2">
                {(p) => <Input {...p} autoComplete="street-address" maxLength={200} placeholder="House number, street, estate" value={delivery.address} onChange={(e) => updateDelivery("address", e.target.value)} />}
              </Field>
              <Field label="Delivery notes" optional error={errors["fulfilment.notes"]} className="sm:col-span-2">
                {(p) => <Textarea {...p} rows={3} maxLength={300} placeholder="Landmark, gate code, best time to call…" value={delivery.notes} onChange={(e) => updateDelivery("notes", e.target.value)} />}
              </Field>
            </div>
          ) : (
            <p className="animate-fade-in rounded-[var(--radius-card)] border border-mist p-4 text-body-sm text-graphite">
              We&apos;ll message you when your order is wrapped and ready — usually within 2 hours. Please bring a valid ID and your order reference.
            </p>
          )}
        </section>

        {/* 03 Payment */}
        <section className="space-y-5" aria-labelledby="payment-step">
          <div id="payment-step">
            <StepHeading step={3} title="Payment" />
          </div>
          <div role="radiogroup" aria-labelledby="payment-step" className="grid gap-3">
            {(Object.keys(providerInfo) as PaymentProvider[]).map((p) => (
              <ChoiceCard
                key={p}
                name="provider"
                value={p}
                checked={provider === p}
                onChange={() => setProvider(p)}
                title={`Pay with ${providerInfo[p].name}`}
                description={providerInfo[p].methods}
              />
            ))}
          </div>
          {errors.provider ? <p className="text-caption text-danger">{errors.provider}</p> : null}
          <p className="flex items-center gap-2 text-caption text-smoke">
            <LockIcon size={14} /> Payments are processed securely by {providerInfo[provider].name}. We never see or store your card details.
          </p>
        </section>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <OrderSummary quote={quote} loading={quoting} method={method} stateChosen={stateChosen} />
        <div className="mt-4 space-y-3">
          {formError ? <FormMessage>{formError}</FormMessage> : null}
          {quote?.issues.length ? (
            <FormMessage>{quote.issues.map((i) => i.message).join(" ")}</FormMessage>
          ) : null}
          <Button type="submit" variant="accent" size="lg" block loading={submitting} disabled={!canPay || quoting}>
            {method === "delivery" && !stateChosen ? "Choose a delivery state" : `Pay ${formatNaira(total)}`}
          </Button>
          <p className="text-center text-caption text-smoke">
            By placing your order you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
      {dialog}
    </form>
  );
}
