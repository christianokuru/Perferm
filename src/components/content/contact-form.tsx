"use client";

import { useState, type FormEvent } from "react";

import { sendContactMessage } from "@/app/actions/contact";
import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Honeypot, Input, Select, Textarea } from "@/components/ui/form";
import { focusFirstError } from "@/lib/focus";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { contactSchema } from "@/lib/validation/schemas";

const topics = [
  { value: "recommendation", label: "Help me choose a fragrance" },
  { value: "order", label: "An existing order" },
  { value: "wholesale", label: "Corporate & wedding gifting" },
  { value: "press", label: "Press & partnerships" },
  { value: "other", label: "Something else" },
];

const empty = { name: "", email: "", topic: "", message: "", website: "" };

export function ContactForm() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (key: keyof typeof empty, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = validate(contactSchema, values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return focusFirstError();
    }
    setErrors({});
    setPending(true);
    const result = await sendContactMessage(parsed.data);
    setPending(false);
    if (result.ok) {
      setSent(true);
      setValues(empty);
    } else {
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error ?? "Please check the highlighted fields.");
    }
  };

  if (sent) {
    return (
      <div role="status" className="rounded-[var(--radius-card)] bg-pearl p-8">
        <span className="flex size-12 items-center justify-center rounded-full bg-saffron text-ink">
          <CheckIcon size={22} />
        </span>
        <p className="mt-6 text-subheading font-light text-ink">Thank you — your message is with our concierge.</p>
        <p className="mt-2 text-body-sm text-smoke">We reply within a few hours, Monday to Saturday.</p>
        <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-5">
      <Honeypot value={values.website} onChange={(v) => set("website", v)} />
      {formError ? <FormMessage>{formError}</FormMessage> : null}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Name" error={errors.name}>
          {(p) => <Input {...p} autoComplete="name" maxLength={80} value={values.name} onChange={(e) => set("name", e.target.value)} />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(p) => <Input {...p} type="email" autoComplete="email" maxLength={254} value={values.email} onChange={(e) => set("email", e.target.value)} />}
        </Field>
      </div>
      <Field label="How can we help?" error={errors.topic}>
        {(p) => (
          <Select {...p} value={values.topic} onChange={(e) => set("topic", e.target.value)}>
            <option value="">Choose a topic</option>
            {topics.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Message" error={errors.message} hint={`${values.message.length}/2000`}>
        {(p) => <Textarea {...p} rows={6} maxLength={2000} placeholder="Tell us about the scents you love, the occasion, your budget…" value={values.message} onChange={(e) => set("message", e.target.value)} />}
      </Field>
      <Button type="submit" variant="primary" size="lg" loading={pending}>
        Send message
      </Button>
    </form>
  );
}
