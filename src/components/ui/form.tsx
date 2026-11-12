"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { CheckIcon, ChevronDownIcon, EyeIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Field wrapper — wires label, hint and error to the control for a11y.        */
/* -------------------------------------------------------------------------- */

interface FieldRenderProps {
  id: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  srOnlyLabel?: boolean;
  children: (props: FieldRenderProps) => ReactNode;
}

export function Field({ label, error, hint, optional, className, srOnlyLabel, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className={cn("flex items-baseline justify-between px-1 text-body-sm text-ink", srOnlyLabel && "sr-only")}>
        <span>{label}</span>
        {optional ? <span className="text-caption text-smoke">Optional</span> : null}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint && !error ? (
        <p id={hintId} className="px-1 text-caption text-smoke">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="px-1 text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                    */
/* -------------------------------------------------------------------------- */

export const controlClasses =
  "h-12 w-full rounded-[var(--radius-input)] border border-mist bg-white px-5 text-body text-ink placeholder:text-smoke/70 transition-colors duration-200 outline-none hover:border-graphite/30 focus:border-ink focus-visible:outline-none aria-[invalid=true]:border-danger disabled:bg-pearl disabled:text-smoke";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlClasses, "h-auto min-h-32 rounded-[20px] py-3.5 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(controlClasses, "cursor-pointer appearance-none pr-11", className)} {...props}>
        {children}
      </select>
      <ChevronDownIcon size={16} className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-smoke" />
    </div>
  );
}

export function PasswordInput(props: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className="pr-14" {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-smoke hover:text-ink"
      >
        <EyeIcon size={18} off={visible} />
      </button>
    </div>
  );
}

export function Checkbox({
  label,
  className,
  error,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: ReactNode; error?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="group flex cursor-pointer items-start gap-3 text-body-sm text-graphite">
        <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            className="peer absolute inset-0 cursor-pointer appearance-none rounded-md border border-graphite/40 transition-colors checked:border-ink checked:bg-ink"
            aria-invalid={error ? true : undefined}
            {...props}
          />
          <CheckIcon size={14} className="pointer-events-none relative text-white opacity-0 peer-checked:opacity-100" />
        </span>
        <span>{label}</span>
      </label>
      {error ? (
        <p role="alert" className="mt-1.5 pl-8 text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Large selectable card used for fulfilment and payment choices. */
export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  icon,
  aside,
  disabled,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-4 rounded-[var(--radius-card)] border p-4 transition-colors duration-200 md:p-5",
        checked ? "border-ink bg-pearl/60" : "border-mist hover:border-graphite/30",
        disabled && "cursor-not-allowed opacity-50 hover:border-mist",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        disabled={disabled}
        checked={checked}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:outline peer-focus-visible:outline-saffron",
          checked ? "border-ink" : "border-graphite/40",
        )}
      >
        <span className={cn("size-2.5 rounded-full bg-ink transition-transform", checked ? "scale-100" : "scale-0")} />
      </span>
      {icon ? <span className="mt-0.5 text-ink">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-body text-ink">{title}</span>
        {description ? <span className="mt-1 block text-body-sm text-smoke">{description}</span> : null}
      </span>
      {aside ? <span className="shrink-0 text-body-sm text-ink">{aside}</span> : null}
    </label>
  );
}

export function FormMessage({ tone = "error", children }: { tone?: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[var(--radius-card)] border px-4 py-3 text-body-sm",
        tone === "error" ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
      )}
    >
      {children}
    </div>
  );
}

/** Invisible honeypot input — bots fill it, humans never see it. */
export function Honeypot({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} name="website" />
      </label>
    </div>
  );
}
