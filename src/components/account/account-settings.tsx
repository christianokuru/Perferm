"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { changeEmail, changePassword, deleteAccount, updateProfile } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, PasswordInput } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { authErrorMessage } from "@/lib/auth/errors";
import { focusFirstError } from "@/lib/focus";
import { createClient } from "@/lib/supabase/client";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { changeEmailSchema, changePasswordSchema, deleteAccountSchema, profileSchema } from "@/lib/validation/schemas";
import { useSessionStore } from "@/stores/session-store";

import { AccountHeading } from "./account-pages";

export interface SettingsProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  hasPassword: boolean;
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-6 border-t border-mist py-10 md:grid-cols-[16rem_1fr] md:gap-10">
      <div>
        <h2 className="text-subheading font-light text-ink">{title}</h2>
        <p className="mt-2 text-body-sm text-smoke">{description}</p>
      </div>
      <div className="max-w-lg">{children}</div>
    </section>
  );
}

function ProfileForm({ profile }: { profile: SettingsProfile }) {
  const router = useRouter();
  const [values, setValues] = useState({ name: profile.name, phone: profile.phone });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = validate(profileSchema, values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return focusFirstError();
    }
    setErrors({});
    setPending(true);
    const result = await updateProfile(values);
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      return toast.error(result.error ?? "Please check the highlighted fields.");
    }
    useSessionStore.getState().patchUser({ name: parsed.data.name, phone: values.phone });
    toast.success("Profile updated");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Full name" error={errors.name}>
        {(p) => <Input {...p} autoComplete="name" maxLength={80} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />}
      </Field>
      <Field label="Phone" error={errors.phone}>
        {(p) => <Input {...p} type="tel" autoComplete="tel" maxLength={20} placeholder="0801 234 5678" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />}
      </Field>
      <Button type="submit" loading={pending}>
        Save profile
      </Button>
    </form>
  );
}

function EmailForm({ profile }: { profile: SettingsProfile }) {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = validate(changeEmailSchema, values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return focusFirstError();
    }
    if (parsed.data.email === profile.email.toLowerCase()) return setErrors({ email: "That's already your email address." });
    if (profile.hasPassword && !values.password) return setErrors({ password: "Enter your current password" });
    setErrors({});
    setPending(true);
    const result = await changeEmail(values);
    if (!result.ok) {
      setPending(false);
      setErrors(result.fieldErrors ?? {});
      if (result.error) setFormError(result.error);
      return focusFirstError();
    }
    // Pick up the new email in this device's session token.
    await createClient().auth.refreshSession();
    setPending(false);
    useSessionStore.getState().patchUser({ email: parsed.data.email });
    setValues({ email: "", password: "" });
    toast.success("Email updated. Use it next time you sign in.");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? <FormMessage>{formError}</FormMessage> : null}
      <Field label="Current email">{(p) => <Input {...p} value={profile.email} disabled readOnly />}</Field>
      <Field label="New email" error={errors.email}>
        {(p) => <Input {...p} type="email" autoComplete="email" inputMode="email" maxLength={254} value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />}
      </Field>
      {profile.hasPassword ? (
        <Field label="Current password" error={errors.password}>
          {(p) => <PasswordInput {...p} autoComplete="current-password" maxLength={128} value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />}
        </Field>
      ) : null}
      <Button type="submit" variant="outline" loading={pending} disabled={!values.email}>
        Change email
      </Button>
    </form>
  );
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const payload = hasPassword ? values : { ...values, currentPassword: "-" };
    const parsed = validate(changePasswordSchema, payload);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return focusFirstError();
    }
    setErrors({});
    setPending(true);
    const result = await changePassword(payload);
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      if (result.error) setFormError(result.error);
      return focusFirstError();
    }
    setValues(empty);
    toast.success("Password changed — other devices have been signed out");
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? <FormMessage>{formError}</FormMessage> : null}
      {hasPassword ? (
        <Field label="Current password" error={errors.currentPassword}>
          {(p) => <PasswordInput {...p} autoComplete="current-password" maxLength={128} value={values.currentPassword} onChange={(e) => setValues({ ...values, currentPassword: e.target.value })} />}
        </Field>
      ) : (
        <p className="text-body-sm text-smoke">You signed up with Google. Set a password to also sign in with your email.</p>
      )}
      <Field label="New password" error={errors.newPassword} hint="8+ characters with upper & lowercase letters and a number">
        {(p) => <PasswordInput {...p} autoComplete="new-password" maxLength={128} value={values.newPassword} onChange={(e) => setValues({ ...values, newPassword: e.target.value })} />}
      </Field>
      <Field label="Confirm new password" error={errors.confirmPassword}>
        {(p) => <PasswordInput {...p} autoComplete="new-password" maxLength={128} value={values.confirmPassword} onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })} />}
      </Field>
      <Button type="submit" loading={pending}>
        {hasPassword ? "Update password" : "Set password"}
      </Button>
    </form>
  );
}

function SessionsPanel() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const signOutEverywhere = async () => {
    if (!window.confirm("Sign out of Perferm on every device, including this one?")) return;
    setPending(true);
    const { error } = await createClient().auth.signOut({ scope: "global" });
    setPending(false);
    if (error) return toast.error(authErrorMessage(error));
    useSessionStore.getState().markSignedOut();
    toast.show("Signed out of all devices");
    router.replace("/");
    router.refresh();
  };

  return (
    <Button variant="outline" onClick={signOutEverywhere} loading={pending}>
      Sign out of all devices
    </Button>
  );
}

function DangerZone({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [values, setValues] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = validate(deleteAccountSchema, values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return focusFirstError();
    }
    if (hasPassword && !values.password) return setErrors({ password: "Enter your password" });
    setErrors({});
    setPending(true);
    const result = await deleteAccount(values);
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      if (result.error) setFormError(result.error);
      return;
    }
    useSessionStore.getState().markSignedOut();
    toast.show("Your account has been deleted");
    router.replace("/");
    router.refresh();
  };

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Delete account
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-[var(--radius-card)] border border-danger/30 p-5">
      <p className="text-body-sm text-ink">
        This permanently deletes your profile, saved addresses and wishlist. Past orders are kept anonymously for our records. This cannot be undone.
      </p>
      {formError ? <FormMessage>{formError}</FormMessage> : null}
      {hasPassword ? (
        <Field label="Password" error={errors.password}>
          {(p) => <PasswordInput {...p} autoComplete="current-password" maxLength={128} value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />}
        </Field>
      ) : null}
      <Field label='Type "DELETE" to confirm' error={errors.confirm}>
        {(p) => <Input {...p} autoComplete="off" maxLength={6} value={values.confirm} onChange={(e) => setValues({ ...values, confirm: e.target.value })} />}
      </Field>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setConfirming(false)}>
          Keep my account
        </Button>
        <Button type="submit" variant="danger" loading={pending}>
          Delete permanently
        </Button>
      </div>
    </form>
  );
}

/** Profile, email, password, sessions and deletion. Used by the customer account and the admin's own profile page. */
export function AccountSettings({ profile, heading }: { profile: SettingsProfile; heading?: ReactNode }) {
  return (
    <>
      {heading ?? <AccountHeading title="account" accent="settings" />}
      <Panel title="Profile" description="How we address you and reach you about orders.">
        <ProfileForm key={profile.id} profile={profile} />
      </Panel>
      <Panel title="Email" description="The address you sign in with and receive receipts at.">
        <EmailForm profile={profile} />
      </Panel>
      <Panel title="Password" description="Use a strong password you don't use elsewhere.">
        <PasswordForm hasPassword={profile.hasPassword} />
      </Panel>
      <Panel title="Sessions" description="Signed in on a device you no longer use? End every session at once.">
        <SessionsPanel />
      </Panel>
      <Panel title="Delete account" description="Remove your Perferm account and personal data.">
        <DangerZone hasPassword={profile.hasPassword} />
      </Panel>
    </>
  );
}
