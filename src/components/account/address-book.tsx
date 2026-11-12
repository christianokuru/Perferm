"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { deleteAddress, saveAddress } from "@/app/actions/account";

import { EditIcon, PinIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Badge, EmptyState } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { focusFirstError } from "@/lib/focus";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { addressSchema, type AddressInput } from "@/lib/validation/schemas";
import type { Address } from "@/lib/account/addresses";

import { AccountHeading } from "./account-pages";

const blank: AddressInput = { label: "Home", recipient: "", phone: "", state: "", city: "", address: "", isDefault: false };

function AddressForm({ initial, states, onDone }: { initial?: Address; states: string[]; onDone: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState<AddressInput>(initial ?? blank);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const set = <K extends keyof AddressInput>(key: K, value: AddressInput[K]) => setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = validate(addressSchema, values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return focusFirstError();
    }
    setPending(true);
    const result = await saveAddress(values, initial?.id);
    setPending(false);
    if (!result.ok) {
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        focusFirstError();
      }
      return toast.error(result.error ?? "Please check the highlighted fields.");
    }
    toast.success(initial ? "Address updated" : "Address saved");
    router.refresh();
    onDone();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 p-5 md:p-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Label" error={errors.label} hint="e.g. Home, Office">
          {(p) => <Input {...p} maxLength={30} value={values.label} onChange={(e) => set("label", e.target.value)} />}
        </Field>
        <Field label="Recipient" error={errors.recipient}>
          {(p) => <Input {...p} autoComplete="name" maxLength={80} value={values.recipient} onChange={(e) => set("recipient", e.target.value)} />}
        </Field>
        <Field label="Phone" error={errors.phone}>
          {(p) => <Input {...p} type="tel" autoComplete="tel" maxLength={20} value={values.phone} onChange={(e) => set("phone", e.target.value)} />}
        </Field>
        <Field label="State" error={errors.state}>
          {(p) => (
            <Select {...p} value={values.state} onChange={(e) => set("state", e.target.value)}>
              <option value="">Choose a state</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="City / area" error={errors.city} className="sm:col-span-2">
          {(p) => <Input {...p} maxLength={60} value={values.city} onChange={(e) => set("city", e.target.value)} />}
        </Field>
        <Field label="Street address" error={errors.address} className="sm:col-span-2">
          {(p) => <Input {...p} autoComplete="street-address" maxLength={200} value={values.address} onChange={(e) => set("address", e.target.value)} />}
        </Field>
      </div>
      <Checkbox label="Use as my default address" checked={values.isDefault} onChange={(e) => set("isDefault", e.target.checked)} />
      <div className="flex gap-2 pt-2">
        <Button variant="ghost" onClick={onDone} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-[2]" loading={pending}>
          {initial ? "Save changes" : "Save address"}
        </Button>
      </div>
    </form>
  );
}

export function AddressBook({ addresses, states }: { addresses: Address[]; states: string[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [deleting, startDelete] = useTransition();

  const remove = (a: Address) => {
    if (!window.confirm(`Delete the address "${a.label}"?`)) return;
    startDelete(async () => {
      const result = await deleteAddress(a.id);
      if (!result.ok) return void toast.error(result.error ?? "We couldn't delete this address.");
      toast.show("Address deleted");
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AccountHeading title="your" accent="addresses" lead="Saved addresses fill in automatically at checkout." />
        <Button icon={<PlusIcon size={16} />} onClick={() => setEditing("new")} disabled={addresses.length >= 10}>
          Add address
        </Button>
      </div>

      {addresses.length ? (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col rounded-[var(--radius-card)] border border-mist p-5">
              <div className="flex items-center gap-2">
                <p className="text-body text-ink">{a.label}</p>
                {a.isDefault ? <Badge tone="saffron">Default</Badge> : null}
              </div>
              <p className="mt-3 flex-1 text-body-sm leading-relaxed text-graphite">
                {a.recipient}
                <br />
                {a.address}
                <br />
                {a.city}, {a.state}
                <br />
                {a.phone}
              </p>
              <div className="mt-5 flex gap-2">
                <Button size="sm" variant="outline" icon={<EditIcon size={14} />} onClick={() => setEditing(a)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<TrashIcon size={14} />}
                  disabled={deleting}
                  onClick={() => remove(a)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<PinIcon size={24} />} title="No saved addresses" description="Add one now and checkout becomes a single tap." />
      )}

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New address" : "Edit address"}>
        {editing !== null ? (
          <AddressForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} states={states} onDone={() => setEditing(null)} />
        ) : null}
      </Sheet>
    </>
  );
}
