import "server-only";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPhone } from "@/lib/validation/fields";

export interface Address {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  state: string;
  city: string;
  address: string;
  isDefault: boolean;
}

/** The signed-in customer's address book (scoped explicitly: RLS also lets admins read all rows). */
export async function listMyAddresses(): Promise<Address[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("id, label, recipient, phone, state, city, address, is_default")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load addresses: ${error.message}`);
  return (data ?? []).map((a) => ({
    id: a.id,
    label: a.label,
    recipient: a.recipient,
    phone: formatPhone(a.phone),
    state: a.state,
    city: a.city,
    address: a.address,
    isDefault: a.is_default,
  }));
}
