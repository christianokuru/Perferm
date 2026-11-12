"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, PasswordInput } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { changePasswordSchema, profileSchema } from "@/lib/validation/schemas";
import { useAuthStore, useCurrentUser, type User } from "@/stores/auth-store";

import { AccountHeading } from "./account-pages";

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
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

function ProfileForm({ user }: { user: User }) {
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [values, setValues] = useState({ name: user.name, phone: user.phone });
  const [errors, setErrors] = useState<FieldErrors>({});

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = validate(profileSchema, values);
    if (!parsed.ok) return setErrors(parsed.errors);
    setErrors({});
    const result = updateProfile(parsed.data);
    if (result.ok) toast.success("Profile updated");
    else toast.error(result.error);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Email" hint="Contact the concierge to change your sign-in email.">
        {(p) => <Input {...p} value={user.email} disabled readOnly />}
      </Field>
      <Field label="Full name" error={errors.name}>
        {(p) => <Input {...p} autoComplete="name" maxLength={80} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />}
      </Field>
      <Field label="Phone" error={errors.phone}>
        {(p) => <Input {...p} type="tel" autoComplete="tel" maxLength={20} value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />}
      </Field>
      <Button type="submit">Save profile</Button>
    </form>
  );
}

function PasswordForm() {
  const changePassword = useAuthStore((s) => s.changePassword);
  const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = validate(changePasswordSchema, values);
    if (!parsed.ok) return setErrors(parsed.errors);
    setErrors({});
    setPending(true);
    const result = await changePassword(parsed.data.currentPassword, parsed.data.newPassword);
    setPending(false);
    if (!result.ok) return setFormError(result.error);
    setValues(empty);
    toast.success("Password changed");
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? <FormMessage>{formError}</FormMessage> : null}
      <Field label="Current password" error={errors.currentPassword}>
        {(p) => <PasswordInput {...p} autoComplete="current-password" maxLength={128} value={values.currentPassword} onChange={(e) => setValues({ ...values, currentPassword: e.target.value })} />}
      </Field>
      <Field label="New password" error={errors.newPassword} hint="8+ characters with upper & lowercase letters and a number">
        {(p) => <PasswordInput {...p} autoComplete="new-password" maxLength={128} value={values.newPassword} onChange={(e) => setValues({ ...values, newPassword: e.target.value })} />}
      </Field>
      <Field label="Confirm new password" error={errors.confirmPassword}>
        {(p) => <PasswordInput {...p} autoComplete="new-password" maxLength={128} value={values.confirmPassword} onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })} />}
      </Field>
      <Button type="submit" loading={pending}>
        Update password
      </Button>
    </form>
  );
}

function DangerZone() {
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [confirming, setConfirming] = useState(false);

  return confirming ? (
    <div className="space-y-4 rounded-[var(--radius-card)] border border-danger/30 p-5">
      <p className="text-body-sm text-ink">This permanently deletes your profile and saved addresses. This cannot be undone.</p>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setConfirming(false)}>
          Keep my account
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            deleteAccount();
            toast.show("Your account has been deleted");
          }}
        >
          Yes, delete it
        </Button>
      </div>
    </div>
  ) : (
    <Button variant="danger" onClick={() => setConfirming(true)}>
      Delete account
    </Button>
  );
}

export function AccountSettings() {
  const user = useCurrentUser();
  if (!user) return null;
  return (
    <>
      <AccountHeading title="account" accent="settings" />
      <Panel title="Profile" description="How we address you and reach you about orders.">
        <ProfileForm key={user.id} user={user} />
      </Panel>
      <Panel title="Password" description="Use a strong password you don't use elsewhere.">
        <PasswordForm />
      </Panel>
      <Panel title="Delete account" description="Remove your Perferm account and personal data.">
        <DangerZone />
      </Panel>
    </>
  );
}
