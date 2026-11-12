"use client";

import { useState, type FormEvent } from "react";

import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { Honeypot } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { validate } from "@/lib/validation/fields";
import { newsletterSchema } from "@/lib/validation/schemas";
import { subscribeToNewsletter } from "@/app/actions/newsletter";

export function NewsletterForm({ className, tone = "light" }: { className?: string; tone?: "light" | "saffron" }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validate(newsletterSchema, { email, website });
    if (!result.ok) {
      setError(result.errors.email ?? "Please check your email");
      return;
    }
    setError(null);
    setState("submitting");
    const response = await subscribeToNewsletter(result.data);
    if (response.ok) {
      setState("done");
    } else {
      setState("idle");
      setError(response.error);
    }
  };

  if (state === "done") {
    return (
      <p role="status" className={cn("flex items-center gap-2 text-body-sm", tone === "saffron" ? "text-ink" : "text-success", className)}>
        <CheckIcon size={18} /> Welcome to the inner circle. Your first letter is on its way.
      </p>
    );
  }

  const onSaffron = tone === "saffron";

  return (
    <form onSubmit={onSubmit} noValidate className={cn("relative", className)}>
      <Honeypot value={website} onChange={setWebsite} />
      <label htmlFor={`newsletter-${tone}`} className="sr-only">
        Email address
      </label>
      <div
        className={cn(
          "flex h-13 items-center rounded-[var(--radius-input)] border pl-5",
          onSaffron ? "border-2 border-ink/80 bg-transparent" : "border-mist bg-white focus-within:border-ink",
          error && "border-danger",
        )}
      >
        <input
          id={`newsletter-${tone}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `newsletter-${tone}-error` : undefined}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent text-body outline-none",
            onSaffron ? "text-ink placeholder:text-ink/60" : "text-ink placeholder:text-smoke/70",
          )}
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          aria-label="Subscribe"
          className={cn(
            "mr-1 flex size-11 items-center justify-center rounded-full transition-colors disabled:opacity-50",
            onSaffron ? "bg-ink text-white hover:bg-graphite" : "bg-ink text-white hover:bg-saffron hover:text-ink",
          )}
        >
          <ArrowRightIcon size={18} />
        </button>
      </div>
      {error ? (
        <p id={`newsletter-${tone}-error`} role="alert" className={cn("mt-2 px-1 text-caption", onSaffron ? "text-ink" : "text-danger")}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
