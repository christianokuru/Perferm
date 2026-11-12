"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import { formatNaira, koboToNaira, naira } from "@/lib/money";
import type { DeliveryZone } from "@/lib/types";
import { formatDate, initials } from "@/lib/utils";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { settingsFormSchema, zoneFormSchema } from "@/lib/validation/admin";
import { useAdminStore, type StoreSettings } from "@/stores/admin-store";
import { useAllUsers } from "@/stores/auth-store";
import { useOrderStore } from "@/stores/order-store";

import { AdminCard, AdminHeading } from "./admin-shell";

/* ------------------------------- Customers -------------------------------- */

export function CustomersAdmin() {
  const users = useAllUsers();
  const orders = useOrderStore((s) => s.orders);

  return (
    <>
      <AdminHeading title="Customers" description={`${users.length} registered accounts`} />
      <AdminCard className="overflow-hidden">
        {users.length ? (
          <ul className="divide-y divide-mist">
            {users.map((u) => {
              const mine = orders.filter((o) => o.customer.email === u.email);
              const spent = mine.reduce((n, o) => n + o.totals.total, 0);
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <span className="flex size-10 items-center justify-center rounded-full bg-pearl text-caption text-ink">{initials(u.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm text-ink">
                      {u.name} {u.role === "admin" ? <span className="ml-1 text-caption text-saffron">Admin</span> : null}
                    </p>
                    <p className="truncate text-caption text-smoke">{u.email} · {u.phone}</p>
                  </div>
                  <div className="text-right text-caption">
                    <p className="text-ink">{mine.length} orders · {formatNaira(spent)}</p>
                    <p className="text-smoke">Joined {formatDate(u.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="No customers yet" description="Accounts created on the storefront appear here." />
        )}
      </AdminCard>
    </>
  );
}

/* -------------------------------- Delivery -------------------------------- */

function ZoneRow({ zone }: { zone: DeliveryZone }) {
  const updateZone = useAdminStore((s) => s.updateZone);
  const [fee, setFee] = useState(String(koboToNaira(zone.fee)));
  const [eta, setEta] = useState(zone.eta);
  const [error, setError] = useState<string | null>(null);
  const dirty = fee !== String(koboToNaira(zone.fee)) || eta !== zone.eta;

  const save = () => {
    const parsed = validate(zoneFormSchema, { fee, eta });
    if (!parsed.ok) return setError(Object.values(parsed.errors)[0]);
    setError(null);
    updateZone(zone.state, { fee: naira(parsed.data.fee), eta: parsed.data.eta });
    toast.success(`${zone.state} updated`);
  };

  return (
    <tr>
      <th scope="row" className="px-4 py-2.5 text-left font-normal text-ink">{zone.state}</th>
      <td className="px-4 py-2.5">
        <label className="sr-only" htmlFor={`fee-${zone.state}`}>{zone.state} fee in naira</label>
        <div className="flex items-center gap-1.5">
          <span className="text-smoke">₦</span>
          <input id={`fee-${zone.state}`} inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} className="h-9 w-24 rounded-full border border-mist px-3 text-body-sm outline-none focus:border-ink" />
        </div>
        {error ? <p className="mt-1 text-caption text-danger">{error}</p> : null}
      </td>
      <td className="px-4 py-2.5">
        <label className="sr-only" htmlFor={`eta-${zone.state}`}>{zone.state} estimated delivery time</label>
        <input id={`eta-${zone.state}`} value={eta} maxLength={40} onChange={(e) => setEta(e.target.value)} className="h-9 w-full min-w-36 rounded-full border border-mist px-3 text-body-sm outline-none focus:border-ink" />
      </td>
      <td className="px-4 py-2.5 text-right">
        <Button size="sm" variant={dirty ? "primary" : "ghost"} disabled={!dirty} onClick={save}>Save</Button>
      </td>
    </tr>
  );
}

export function DeliveryAdmin() {
  const zones = useAdminStore((s) => s.zones);
  const sorted = [...zones].sort((a, b) => a.state.localeCompare(b.state));
  return (
    <>
      <AdminHeading title="Delivery fees" description="Set the delivery fee and estimate for each state. Pickup is always free." />
      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-body-sm">
            <caption className="sr-only">Delivery fee per state</caption>
            <thead className="border-b border-mist bg-pearl/60 text-left text-caption text-smoke">
              <tr>
                <th scope="col" className="px-4 py-3 font-normal">State</th>
                <th scope="col" className="px-4 py-3 font-normal">Fee</th>
                <th scope="col" className="px-4 py-3 font-normal">Estimate</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Save</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {sorted.map((z) => <ZoneRow key={`${z.state}-${z.fee}-${z.eta}`} zone={z} />)}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </>
  );
}

/* -------------------------------- Settings -------------------------------- */

export function SettingsAdmin() {
  const settings = useAdminStore((s) => s.settings);
  const saveSettings = useAdminStore((s) => s.saveSettings);
  const resetDemoData = useAdminStore((s) => s.resetDemoData);
  const [values, setValues] = useState<StoreSettings>(settings);
  const [errors, setErrors] = useState<FieldErrors>({});
  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = validate(settingsFormSchema, values);
    if (!parsed.ok) return setErrors(parsed.errors);
    if (!parsed.data.paystackEnabled && !parsed.data.flutterwaveEnabled) {
      return setErrors({ paystackEnabled: "Keep at least one payment gateway enabled" });
    }
    setErrors({});
    saveSettings(parsed.data);
    toast.success("Settings saved");
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <AdminHeading title="Store settings" actions={<Button type="submit">Save settings</Button>} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard className="space-y-5 p-5 md:p-6">
          <h2 className="text-body text-ink">Store</h2>
          <Field label="Store name" error={errors.storeName}>{(p) => <Input {...p} maxLength={60} value={values.storeName} onChange={(e) => set("storeName", e.target.value)} />}</Field>
          <Field label="Support email" error={errors.supportEmail}>{(p) => <Input {...p} type="email" maxLength={254} value={values.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />}</Field>
          <Field label="Support phone" error={errors.supportPhone}>{(p) => <Input {...p} type="tel" maxLength={20} value={values.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} />}</Field>
          <Field label="Announcement bar" error={errors.announcement} hint={`${values.announcement.length}/120`}>{(p) => <Input {...p} maxLength={120} value={values.announcement} onChange={(e) => set("announcement", e.target.value)} />}</Field>
        </AdminCard>
        <div className="space-y-6">
          <AdminCard className="space-y-5 p-5 md:p-6">
            <h2 className="text-body text-ink">Boutique pickup</h2>
            <Checkbox label="Offer free boutique pickup" checked={values.pickupEnabled} onChange={(e) => set("pickupEnabled", e.target.checked)} />
            <Field label="Pickup address" error={errors.pickupAddress}>{(p) => <Input {...p} maxLength={200} value={values.pickupAddress} onChange={(e) => set("pickupAddress", e.target.value)} />}</Field>
            <Field label="Opening hours" error={errors.pickupHours}>{(p) => <Input {...p} maxLength={80} value={values.pickupHours} onChange={(e) => set("pickupHours", e.target.value)} />}</Field>
          </AdminCard>
          <AdminCard className="space-y-4 p-5 md:p-6">
            <h2 className="text-body text-ink">Payment gateways</h2>
            <Checkbox label="Paystack" checked={values.paystackEnabled} onChange={(e) => set("paystackEnabled", e.target.checked)} error={errors.paystackEnabled} />
            <Checkbox label="Flutterwave" checked={values.flutterwaveEnabled} onChange={(e) => set("flutterwaveEnabled", e.target.checked)} />
            <p className="text-caption text-smoke">API keys are configured as environment variables, never stored in the dashboard.</p>
          </AdminCard>
          <AdminCard className="space-y-3 p-5 md:p-6">
            <h2 className="text-body text-ink">Demo data</h2>
            <p className="text-body-sm text-smoke">Restore the original catalogue, delivery fees and settings in this browser.</p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (!window.confirm("Reset products, delivery fees and settings to the defaults?")) return;
                resetDemoData();
                setValues(useAdminStore.getState().settings);
                toast.show("Demo data restored");
              }}
            >
              Reset demo data
            </Button>
          </AdminCard>
        </div>
      </div>
    </form>
  );
}
