"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string; message?: string };

function fail(e: unknown): Result {
  const m = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "Something went wrong";
  return { ok: false, error: m };
}

export async function markClientPaymentReceived(paymentId: string): Promise<Result> {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await (db
      .from("client_payments") as any)
      .update({ paid_at: new Date().toISOString() })
      .eq("id", paymentId)
      .is("paid_at", null)
      .select("id");
    if (error) return fail(error);
    if (!data || data.length === 0) return { ok: true, message: "Already marked as received" };
    revalidatePath("/payments");
    return { ok: true, message: "Payment marked as received" };
  } catch (e) {
    return fail(e);
  }
}

export async function addVendorBill(weddingVendorId: string, amount: number, note: string): Promise<Result> {
  try {
    if (!weddingVendorId) return { ok: false, error: "Choose a vendor" };
    if (!(amount > 0)) return { ok: false, error: "Enter a bill amount above zero" };
    const db = getSupabaseAdmin();
    const { error } = await (db
      .from("vendor_bills") as any)
      .insert({ wedding_vendor_id: weddingVendorId, amount, note: note.trim() || null });
    if (error) return fail(error);
    revalidatePath("/payments");
    return { ok: true, message: "Vendor bill recorded" };
  } catch (e) {
    return fail(e);
  }
}

export async function addExtraCharge(
  weddingId: string,
  description: string,
  qty: number,
  unitPrice: number,
  clientBillable: boolean
): Promise<Result> {
  try {
    if (!weddingId) return { ok: false, error: "Choose a wedding" };
    if (!description.trim()) return { ok: false, error: "Describe the extra charge" };
    if (!(qty > 0)) return { ok: false, error: "Quantity must be above zero" };
    if (!(unitPrice >= 0)) return { ok: false, error: "Enter a valid unit price" };
    const db = getSupabaseAdmin();
    const { error } = await (db.from("extra_charges") as any).insert({
      wedding_id: weddingId,
      description: description.trim(),
      qty,
      unit_price: unitPrice,
      client_billable: clientBillable,
    });
    if (error) return fail(error);
    revalidatePath("/payments");
    return { ok: true, message: clientBillable ? "Extra added and billed to the client" : "Extra recorded (not billed to the client)" };
  } catch (e) {
    return fail(e);
  }
}

export async function payVendor(billId: string, amount: number, key: string): Promise<Result> {
  try {
    if (!billId) return { ok: false, error: "Choose a bill" };
    if (!(amount > 0)) return { ok: false, error: "Enter an amount above zero" };
    const db = getSupabaseAdmin();
    const { data, error } = await (db.rpc as any)("pay_vendor", { p_bill_id: billId, p_amount: amount, p_key: key });
    if (error) return fail(error);
    revalidatePath("/payments");
    if (data && data.status === "duplicate") {
      return { ok: true, message: "This payment was already recorded. Nothing was charged twice." };
    }
    return { ok: true, message: "Vendor payment recorded" };
  } catch (e) {
    return fail(e);
  }
}
