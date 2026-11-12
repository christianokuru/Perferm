import { NextResponse } from "next/server";

import { getViewer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** CSV export of active newsletter subscribers (admins only). */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "admin") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email, source, created_at")
    .is("unsubscribed_at", null)
    .order("created_at", { ascending: true })
    .limit(50_000);
  if (error) return NextResponse.json({ error: "Export failed" }, { status: 500 });

  // Neutralise spreadsheet formula injection (=, +, -, @) and quote every cell.
  const cell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
  const rows = [["email", "source", "subscribed_at"], ...(data ?? []).map((r) => [r.email, r.source, r.created_at])];
  const csv = rows.map((r) => r.map((v) => cell(String(v))).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="perferm-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
