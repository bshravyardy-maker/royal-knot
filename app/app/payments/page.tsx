import { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import PaymentsClient from "@/components/PaymentsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payments, Vendor Bills & Reconciliation | THE ROYAL KNOT",
  description:
    "Palatial financial management, client payment milestones, double-payment guards, and vendor bill matching.",
};

export default async function PaymentsPage() {
  try {
    const db = getSupabaseAdmin();
    const [pay, bal, bills, extras, inv, wed] = await Promise.all([
      db.from("client_payments").select("*").order("due_date", { ascending: true }),
      db.from("vendor_balances").select("*"),
      db.from("vendor_bill_status").select("*").order("billed_at", { ascending: false }),
      db.from("extra_charges").select("*").order("created_at", { ascending: false }),
      db.from("client_invoice").select("*"),
      db.from("weddings").select("*"),
    ]);
    const firstError = [pay, bal, bills, extras, inv, wed].find((r) => r.error)?.error;
    if (firstError) throw new Error(firstError.message);

    return (
      <PaymentsClient
        payments={pay.data ?? []}
        balances={bal.data ?? []}
        bills={bills.data ?? []}
        extras={extras.data ?? []}
        invoices={inv.data ?? []}
        weddings={wed.data ?? []}
      />
    );
  } catch (e) {
    const m = e instanceof Error ? e.message : "Unknown error";
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
          <p className="font-semibold">Payments could not load</p>
          <p className="mt-1 text-sm">{m}</p>
          <p className="mt-2 text-sm">If this mentions a missing view or table, run the Phase 5 migration in the Supabase SQL Editor.</p>
        </div>
      </div>
    );
  }
}
