"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface ActionResult<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface AddGuestInput {
  wedding_id: string;
  name: string;
  email?: string;
  phone: string;
  rsvp_status?: "Attending" | "Declined" | "Pending";
  dietary_requirements?: string;
  room_allocation?: string;
  table_number?: string;
  is_vip?: boolean;
  notes?: string;
}

export async function addGuestAction(data: AddGuestInput): Promise<ActionResult<{ id: string }>> {
  if (!data.wedding_id) return { success: false, error: "Please choose a wedding." };
  if (!data.name?.trim()) return { success: false, error: "Guest name is required." };
  if (!data.phone?.trim()) return { success: false, error: "Phone number is required." };

  try {
    const supabase = getSupabaseAdmin();
    const insertPayload = {
      wedding_id: data.wedding_id,
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone.trim(),
      rsvp_status: data.rsvp_status || "Pending",
      dietary_requirements: data.dietary_requirements?.trim() || null,
      room_allocation: data.room_allocation?.trim() || null,
      table_number: data.table_number?.trim() || null,
      is_vip: Boolean(data.is_vip),
      notes: data.notes?.trim() || null,
      is_demo: false,
    };

    const { data: created, error } = await (supabase
      .from("guests") as any)
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("addGuestAction error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/guests");
    return { success: true, message: "Guest invited to palace celebration!", data: { id: created?.id } };
  } catch (err: any) {
    console.error("addGuestAction unexpected error:", err);
    return { success: false, error: err.message || "Failed to add guest." };
  }
}

export async function updateGuestRsvpAction(
  guestId: string,
  rsvp_status: "Attending" | "Declined" | "Pending"
): Promise<ActionResult> {
  if (!guestId) return { success: false, error: "Missing guest ID." };

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await (supabase
      .from("guests") as any)
      .update({ rsvp_status, updated_at: new Date().toISOString() })
      .eq("id", guestId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/guests");
    return { success: true, message: `RSVP updated to ${rsvp_status}` };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update RSVP." };
  }
}

export async function deleteGuestAction(guestId: string): Promise<ActionResult> {
  if (!guestId) return { success: false, error: "Missing guest ID." };

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await (supabase.from("guests") as any).delete().eq("id", guestId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/guests");
    return { success: true, message: "Guest removed from roster." };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to remove guest." };
  }
}
