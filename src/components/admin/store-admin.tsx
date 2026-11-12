"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { saveSettings, setCustomerRole, updateZone } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import type { AdminCustomer, AdminZone } from "@/lib/admin/queries";
import type { StoreSettings } from "@/lib/catalog/repository";
import { focusFirstError } from "@/lib/focus";
import { formatNaira, koboToNaira } from "@/lib/money";
import { providerInfo, type GatewayOption } from "@/lib/payments/types";
import { formatDate, initials } from "@/lib/utils";
import { formatPhone, validate, type FieldErrors } from "@/lib/validation/fields";
import { settingsFormSchema, zoneFormSchema } from "@/lib/validation/admin";

import { AdminCard, AdminHeading } from "./admin-shell";
import { Pagination } from "./pagination";
import { SearchBox } from "./search-box";

/* ------------------------------- Customers -------------------------------- */

function RoleButton({ customer }: { customer: AdminCustomer }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const promote = customer.role === "customer";

  const onClick = () => {
    const message = promote
      ? `Give ${customer.name || customer.email} full admin access to orders, products and settings?`
      : `Remove admin access from ${customer.name || customer.email}?`;
    if (!window.confirm(message)) return;
    start(async () => {
      const result = await setCustomerRole(customer.id, promote ? "admin" : "customer");
      if (!result.ok) return void toast.error(result.error ?? "We couldn't change this role.");
      toast.success(promote ? "Admin access granted" : "Admin access removed");
      router.refresh();
    });
  };

  return (
    <Button size="sm" variant={promote ? "ghost" : "outline"} loading={pending} onClick={onClick}>
      {promote ? "Make admin" : "Remove admin"}
    </Button>
  );
}

export function CustomersAdmin({
  items,
  total,
  q,
  page,
  currentUserId,
}: {
  items: AdminCustomer[];
  total: number;
  q: string;
  page: number;
  currentUserId: string;
}) {
  return (
    <>
      <AdminHeading title="Customers" description={`${total} registered account${total === 1 ? "" : "s"}${q ? " match your search" : ""}`} />
      <div className="mb-4">
        <SearchBox placeholder="Name, email or phone" defaultValue={q} />
      </div>
      <AdminCard className="overflow-hidden">
        {items.length ? (
          <ul className="divide-y divide-mist">
            {items.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pearl text-caption text-ink">{initials(u.name || u.email)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-ink">
                    {u.name || "—"} {u.role === "admin" ? <span className="ml-1 text-caption text-saffron">Admin</span> : null}
                    {u.id === currentUserId ? <span className="ml-1 text-caption text-smoke">(you)</span> : null}
                  </p>
                  <p className="truncate text-caption text-smoke">
                    {u.email}
                    {u.phone ? ` · ${formatPhone(u.phone)}` : ""}
                  </p>
                </div>
                <div className="text-right text-caption">
                  <p className="text-ink">
                    {u.orderCount} order{u.orderCount === 1 ? "" : "s"} · {formatNaira(u.totalSpent)}
                  </p>
                  <p className="text-smoke">Joined {formatDate(u.createdAt)}</p>
                </div>
                {u.id !== currentUserId ? <RoleButton customer={u} /> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={q ? "No matches" : "No customers yet"} description={q ? "Try a different search." : "Accounts created on the storefront appear here."} />
        )}
      </AdminCard>
      <Pagination page={page} total={total} pageSize={25} basePath="/admin/customers" params={{ q: q || undefined }} />
    </>
  );
}

/* -------------------------------- Delivery -------------------------------- */

function ZoneRow({ zone }: { zone: AdminZone }) {
  const router = useRouter();
  const [fee, setFee] = useState(String(koboToNaira(zone.fee)));
  const [eta, setEta] = useState(zone.eta);
  const [active, setActive] = useState(zone.active);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const dirty = fee !== String(koboToNaira(zone.fee)) || eta !== zone.eta || active !== zone.active;

  const save = async () => {
    const parsed = validate(zoneFormSchema, { fee, eta, active });
    if (!parsed.ok) return setError(Object.values(parsed.errors)[0]);
    setError(null);
    setPending(true);
    const result = await updateZone(zone.state, { fee, eta, active });
    setPending(false);
    if (!result.ok) return setError(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? "Couldn't save");
    toast.success(`${zone.state} updated`);
    router.refresh();
  };

  return (
    <tr className={active ? undefined : "bg-pearl/50"}>
      <th scope="row" className="px-4 py-2.5 text-left font-normal text-ink">
        {zone.state}
      </th>
      <td className="px-4 py-2.5">
        <label className="sr-only" htmlFor={`fee-${zone.state}`}>
          {zone.state} fee in naira
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-smoke">₦</span>
          <input
            id={`fee-${zone.state}`}
            inputMode="numeric"
            value={fee}
            onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))}
            className="h-9 w-24 rounded-full border border-mist px-3 text-body-sm outline-none focus:border-ink"
          />
        </div>
        {error ? <p className="mt-1 text-caption text-danger">{error}</p> : null}
      </td>
      <td className="px-4 py-2.5">
        <label className="sr-only" htmlFor={`eta-${zone.state}`}>
          {zone.state} estimated delivery time
        </label>
        <input
          id={`eta-${zone.state}`}
          value={eta}
          maxLength={40}
          onChange={(e) => setEta(e.target.value)}
          className="h-9 w-full min-w-36 rounded-full border border-mist px-3 text-body-sm outline-none focus:border-ink"
        />
      </td>
      <td className="px-4 py-2.5">
        <label className="flex items-center gap-2 text-body-sm text-graphite">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-ink" />
          {active ? "Delivering" : "Paused"}
        </label>
      </td>
      <td className="px-4 py-2.5 text-right">
        <Button size="sm" variant={dirty ? "primary" : "ghost"} disabled={!dirty} loading={pending} onClick={save}>
          Save
        </Button>
      </td>
    </tr>
  );
}

export function DeliveryAdmin({ zones }: { zones: AdminZone[] }) {
  return (
    <>
      <AdminHeading title="Delivery fees" description="Set the fee and estimate for each state, or pause delivery to a state. Boutique pickup is always free." />
      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-body-sm">
            <caption className="sr-only">Delivery fee per state</caption>
            <thead className="border-b border-mist bg-pearl/60 text-left text-caption text-smoke">
              <tr>
                <th scope="col" className="px-4 py-3 font-normal">State</th>
                <th scope="col" className="px-4 py-3 font-normal">Fee</th>
                <th scope="col" className="px-4 py-3 font-normal">Estimate</th>
                <th scope="col" className="px-4 py-3 font-normal">Status</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Save</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {zones.map((z) => (
                <ZoneRow key={`${z.state}-${z.fee}-${z.eta}-${z.active}`} zone={z} />
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </>
  );
}

/* -------------------------------- Settings -------------------------------- */

export function SettingsAdmin({ settings, gateways }: { settings: StoreSettings; gateways: GatewayOption[] }) {
  const router = useRouter();
  const [values, setValues] = useState<StoreSettings>(settings);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = validate(settingsFormSchema, values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return focusFirstError();
    }
    setErrors({});
    setPending(true);
    const result = await saveSettings(values);
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      return setFormError(result.error ?? "Please check the highlighted fields.");
    }
    toast.success("Settings saved — live on the storefront");
    router.refresh();
  };

  const modeLabel = (g: GatewayOption | undefined) =>
    !g?.mode ? "Not configured — add API keys" : g.mode === "live" ? "API keys connected" : "Test mode (no keys yet)";

  return (
    <form onSubmit={onSubmit} noValidate>
      <AdminHeading title="Store settings" actions={<Button type="submit" loading={pending}>Save settings</Button>} />
      {formError ? (
        <div className="mb-6">
          <FormMessage>{formError}</FormMessage>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard className="space-y-5 p-5 md:p-6">
          <h2 className="text-body text-ink">Store</h2>
          <Field label="Store name" error={errors.storeName}>
            {(p) => <Input {...p} maxLength={60} value={values.storeName} onChange={(e) => set("storeName", e.target.value)} />}
          </Field>
          <Field label="Support email" error={errors.supportEmail} hint="Order alerts and concierge messages go here unless STORE_INBOX_EMAIL is set.">
            {(p) => <Input {...p} type="email" maxLength={254} value={values.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />}
          </Field>
          <Field label="Support phone" error={errors.supportPhone}>
            {(p) => <Input {...p} type="tel" maxLength={20} value={values.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} />}
          </Field>
          <Field label="Announcement bar" optional error={errors.announcement} hint={`${values.announcement.length}/120 · shown first in the top bar`}>
            {(p) => <Input {...p} maxLength={120} value={values.announcement} onChange={(e) => set("announcement", e.target.value)} />}
          </Field>
        </AdminCard>
        <div className="space-y-6">
          <AdminCard className="space-y-5 p-5 md:p-6">
            <h2 className="text-body text-ink">Boutique pickup</h2>
            <Checkbox label="Offer free boutique pickup" checked={values.pickupEnabled} onChange={(e) => set("pickupEnabled", e.target.checked)} />
            <Field label="Pickup address" error={errors.pickupAddress}>
              {(p) => <Input {...p} maxLength={200} value={values.pickupAddress} onChange={(e) => set("pickupAddress", e.target.value)} />}
            </Field>
            <Field label="Opening hours" error={errors.pickupHours}>
              {(p) => <Input {...p} maxLength={80} value={values.pickupHours} onChange={(e) => set("pickupHours", e.target.value)} />}
            </Field>
          </AdminCard>
          <AdminCard className="space-y-4 p-5 md:p-6">
            <h2 className="text-body text-ink">Payment gateways</h2>
            {(["paystack", "flutterwave"] as const).map((provider) => {
              const key = provider === "paystack" ? "paystackEnabled" : "flutterwaveEnabled";
              const gateway = gateways.find((g) => g.provider === provider);
              return (
                <div key={provider}>
                  <Checkbox
                    label={providerInfo[provider].name}
                    checked={values[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    error={provider === "paystack" ? errors.paystackEnabled : undefined}
                  />
                  <p className="mt-1 pl-8 text-caption text-smoke">{modeLabel(gateway)}</p>
                </div>
              );
            })}
            <p className="text-caption text-smoke">API keys live in server environment variables and are never stored in the dashboard.</p>
          </AdminCard>
        </div>
      </div>
    </form>
  );
}
