"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { CheckIcon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input, PasswordInput } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { Accent } from "@/components/ui/typography";
import { focusFirstError } from "@/lib/focus";
import { cn, safeRedirectPath } from "@/lib/utils";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { forgotPasswordSchema, loginSchema, registerSchema } from "@/lib/validation/schemas";
import { useAuthStore, useCurrentUser } from "@/stores/auth-store";

function AuthHeading({ title, accent, lead }: { title: string; accent: string; lead: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h1 className="text-[3rem] leading-[0.92] font-extralight tracking-[-0.075em] text-ink md:text-[3.75rem]">
        {title} <Accent>{accent}</Accent>
      </h1>
      <p className="mt-4 text-body-sm text-smoke">{lead}</p>
    </div>
  );
}

/** Shown instead of a sign-in/up form when a session already exists. */
function SignedInNotice({ name, next }: { name: string; next: string }) {
  return (
    <div className="space-y-6">
      <AuthHeading title="welcome," accent={name.split(" ")[0]} lead="You're already signed in." />
      <ButtonLink href={next} size="lg" block>
        Continue
      </ButtonLink>
    </div>
  );
}

function useNextPath() {
  return safeRedirectPath(useSearchParams().get("next"));
}

/* -------------------------------------------------------------------------- */

export function LoginForm() {
  const router = useRouter();
  const next = useNextPath();
  const login = useAuthStore((s) => s.login);
  const user = useCurrentUser();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = validate(loginSchema, values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return focusFirstError();
    }
    setErrors({});
    setPending(true);
    const result = await login(parsed.data.email, parsed.data.password);
    setPending(false);
    if (!result.ok) return setFormError(result.error);
    toast.success("Welcome back");
    router.replace(next);
  };

  if (user && !pending) return <SignedInNotice name={user.name} next={next} />;

  return (
    <>
      <AuthHeading
        title="welcome"
        accent="back"
        lead={
          <>
            New to Perferm?{" "}
            <Link href={`/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-ink underline underline-offset-4">
              Create an account
            </Link>
          </>
        }
      />
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError ? <FormMessage>{formError}</FormMessage> : null}
        <Field label="Email" error={errors.email}>
          {(p) => <Input {...p} type="email" autoComplete="email" inputMode="email" maxLength={254} value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />}
        </Field>
        <Field label="Password" error={errors.password}>
          {(p) => <PasswordInput {...p} autoComplete="current-password" maxLength={128} value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />}
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-body-sm text-smoke underline-offset-4 hover:text-ink hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="primary" size="lg" block loading={pending}>
          Sign in
        </Button>
      </form>
    </>
  );
}

/* -------------------------------------------------------------------------- */

const passwordRules = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "Uppercase", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Lowercase", test: (v: string) => /[a-z]/.test(v) },
  { label: "Number", test: (v: string) => /\d/.test(v) },
];

export function RegisterForm() {
  const router = useRouter();
  const next = useNextPath();
  const register = useAuthStore((s) => s.register);
  const user = useCurrentUser();
  const [values, setValues] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", acceptTerms: false });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = validate(registerSchema, values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return focusFirstError();
    }
    setErrors({});
    setPending(true);
    const { name, email, phone, password } = parsed.data;
    const result = await register({ name, email, phone, password });
    setPending(false);
    if (!result.ok) return setFormError(result.error);
    toast.success(`Welcome to Perferm, ${name.split(" ")[0]}`);
    router.replace(next);
  };

  if (user && !pending) return <SignedInNotice name={user.name} next={next} />;

  return (
    <>
      <AuthHeading
        title="join the"
        accent="house"
        lead={
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-ink underline underline-offset-4">
              Sign in
            </Link>
          </>
        }
      />
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError ? <FormMessage>{formError}</FormMessage> : null}
        <Field label="Full name" error={errors.name}>
          {(p) => <Input {...p} autoComplete="name" maxLength={80} value={values.name} onChange={(e) => set("name", e.target.value)} />}
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Email" error={errors.email}>
            {(p) => <Input {...p} type="email" autoComplete="email" inputMode="email" maxLength={254} value={values.email} onChange={(e) => set("email", e.target.value)} />}
          </Field>
          <Field label="Phone" error={errors.phone}>
            {(p) => <Input {...p} type="tel" autoComplete="tel" inputMode="tel" maxLength={20} placeholder="0801 234 5678" value={values.phone} onChange={(e) => set("phone", e.target.value)} />}
          </Field>
        </div>
        <Field label="Password" error={errors.password}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" maxLength={128} value={values.password} onChange={(e) => set("password", e.target.value)} />}
        </Field>
        <ul className="-mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1" aria-label="Password requirements">
          {passwordRules.map((rule) => {
            const met = rule.test(values.password);
            return (
              <li key={rule.label} className={cn("flex items-center gap-1 text-caption", met ? "text-success" : "text-smoke")}>
                <CheckIcon size={12} className={met ? "opacity-100" : "opacity-30"} />
                {rule.label}
              </li>
            );
          })}
        </ul>
        <Field label="Confirm password" error={errors.confirmPassword}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" maxLength={128} value={values.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} />}
        </Field>
        <Checkbox
          checked={values.acceptTerms}
          onChange={(e) => set("acceptTerms", e.target.checked)}
          error={errors.acceptTerms}
          label={
            <>
              I agree to the{" "}
              <Link href="/terms" className="underline underline-offset-2">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-2">
                privacy policy
              </Link>
              .
            </>
          }
        />
        <Button type="submit" variant="primary" size="lg" block loading={pending}>
          Create account
        </Button>
      </form>
    </>
  );
}

/* -------------------------------------------------------------------------- */

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = validate(forgotPasswordSchema, { email });
    if (!parsed.ok) return setError(parsed.errors.email);
    setError(null);
    setPending(true);
    // TODO(supabase): supabase.auth.resetPasswordForEmail(email, { redirectTo }).
    await new Promise((r) => setTimeout(r, 600));
    setPending(false);
    setSent(true);
  };

  return (
    <>
      <AuthHeading title="reset your" accent="password" lead="Enter the email on your account and we'll send you a secure reset link." />
      {sent ? (
        <div className="space-y-6">
          {/* Same message whether or not the account exists — no user enumeration. */}
          <FormMessage tone="success">If an account exists for {email}, a reset link is on its way. It expires in 30 minutes.</FormMessage>
          <Link href="/login" className="inline-block text-body-sm text-ink underline underline-offset-4">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field label="Email" error={error ?? undefined}>
            {(p) => <Input {...p} type="email" autoComplete="email" inputMode="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Button type="submit" variant="primary" size="lg" block loading={pending}>
            Send reset link
          </Button>
          <Link href="/login" className="block text-center text-body-sm text-smoke hover:text-ink">
            Remembered it? Sign in
          </Link>
        </form>
      )}
    </>
  );
}
