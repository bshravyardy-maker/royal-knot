"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface ActionResult<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface CreateContractInput {
  wedding_id: string;
  title: string;
  contract_type: "Client Agreement" | "Vendor Contract" | "Venue Booking";
  contract_value: number;
  status?: "Draft" | "Sent" | "Signed" | "Terminated";
  notes?: string;
}

export async function createContractAction(
  data: CreateContractInput
): Promise<ActionResult<{ id: string }>> {
  if (!data.wedding_id) return { success: false, error: "Please select a wedding." };
  if (!data.title?.trim()) return { success: false, error: "Contract title is required." };

  try {
    const supabase = getSupabaseAdmin();
    const insertPayload = {
      wedding_id: data.wedding_id,
      title: data.title.trim(),
      contract_type: data.contract_type,
      contract_value: Number(data.contract_value) || 0,
      status: data.status || "Draft",
      signed_at: data.status === "Signed" ? new Date().toISOString() : null,
      is_demo: false,
    };

    const { data: created, error } = await (supabase
      .from("contracts") as any)
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("createContractAction error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/contracts");
    return { success: true, message: "Contract document registered!", data: { id: created?.id } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create contract." };
  }
}

export async function updateContractStatusAction(
  contractId: string,
  status: "Draft" | "Sent" | "Signed" | "Terminated"
): Promise<ActionResult> {
  if (!contractId) return { success: false, error: "Missing contract ID." };

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await (supabase
      .from("contracts") as any)
      .update({
        status,
        signed_at: status === "Signed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/contracts");
    return { success: true, message: `Contract status updated to ${status}` };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update contract." };
  }
}
