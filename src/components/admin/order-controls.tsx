"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { addOrderNote, setOrderStatus } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { orderStatusLabels } from "@/lib/catalog/labels";
import type { FulfilmentMethod, OrderStatus } from "@/lib/types";

type Target = "processing" | "shipped" | "ready_for_pickup" | "delivered" | "cancelled";

/** Mirrors the database state machine so only valid next steps are offered. */
function nextStatuses(status: OrderStatus, fulfilment: FulfilmentMethod): Target[] {
  const handoff: Target = fulfilment === "delivery" ? "shipped" : "ready_for_pickup";
  switch (status) {
    case "pending":
      return ["cancelled"];
    case "paid":
      return ["processing", handoff, "cancelled"];
    case "processing":
      return [handoff, "cancelled"];
    case "shipped":
      return ["delivered"];
    case "ready_for_pickup":
      return ["delivered", "cancelled"];
    default:
      return [];
  }
}

export function OrderStatusControl({ orderId, status, fulfilment }: { orderId: string; status: OrderStatus; fulfilment: FulfilmentMethod }) {
  const router = useRouter();
  const options = nextStatuses(status, fulfilment);
  const [target, setTarget] = useState<Target | "">(options[0] ?? "");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  if (!options.length) {
    return <p className="text-body-sm text-smoke">This order is {orderStatusLabels[status].toLowerCase()} — no further updates.</p>;
  }

  const label = (s: Target) => (s === "delivered" && fulfilment === "pickup" ? "Collected" : orderStatusLabels[s]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!target) return;
    if (target === "cancelled" && !window.confirm("Cancel this order? Paid items are returned to stock; refunds are handled with the gateway.")) return;
    setPending(true);
    const result = await setOrderStatus({ orderId, status: target, note: note || undefined });
    setPending(false);
    if (!result.ok) return toast.error(result.error ?? "We couldn't update this order.");
    toast.success(`Marked as ${label(target).toLowerCase()} — the customer has been emailed`);
    setNote("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Update status" hint={status === "pending" ? "Paid is set automatically once the gateway confirms payment." : "The customer is emailed about each update."}>
        {(p) => (
          <Select {...p} value={target} onChange={(e) => setTarget(e.target.value as Target)}>
            {options.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {target === "cancelled" ? (
        <Field label="Reason" optional hint="Shown to the customer">
          {(p) => <Textarea {...p} rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
      ) : null}
      <Button type="submit" block loading={pending} variant={target === "cancelled" ? "danger" : "primary"}>
        {target ? `Mark as ${label(target).toLowerCase()}` : "Update"}
      </Button>
    </form>
  );
}

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return setError("Write a note");
    setPending(true);
    const result = await addOrderNote({ orderId, note });
    setPending(false);
    if (!result.ok) return setError(result.fieldErrors?.note ?? result.error);
    setError(undefined);
    setNote("");
    toast.success("Note added");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="Internal note" hint="Only visible to admins" error={error}>
        {(p) => <Textarea {...p} rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Rider assigned, customer asked for evening delivery" />}
      </Field>
      <Button type="submit" variant="outline" size="sm" loading={pending}>
        Add note
      </Button>
    </form>
  );
}
