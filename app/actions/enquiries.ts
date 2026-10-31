"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface CreateEnquiryInput {
  couple_name: string;
  phone: string;
  email?: string;
  wedding_date?: string;
  guests: number;
  budget: number;
  theme?: string;
  source?: string;
  package: string;
  city?: string;
  notes?: string;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export async function createEnquiryAction(data: CreateEnquiryInput): Promise<ActionResult> {
  // 1. Validation
  if (!data.couple_name || data.couple_name.trim().length < 3) {
    return { success: false, error: "Couple names are required (e.g. 'Aarav & Meera')." };
  }

  const cleanPhone = (data.phone || "").replace(/\D/g, "");
  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, error: "A valid phone number with at least 10 digits is required." };
  }

  const guests = Number(data.guests);
  if (isNaN(guests) || guests <= 0) {
    return { success: false, error: "Guest count must be at least 1." };
  }

  const budget = Number(data.budget);
  if (isNaN(budget) || budget <= 0) {
    return { success: false, error: "Maximum budget must be greater than 0." };
  }

  if (!data.package) {
    return { success: false, error: "Please select a wedding package." };
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const insertPayload = {
      couple_name: data.couple_name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
      wedding_date: data.wedding_date || null,
      guests: guests,
      budget: budget,
      theme: data.theme?.trim() || "Palace Romance",
      source: data.source?.trim() || "Direct / Website",
      package: data.package,
      city: data.city || "Jaipur",
      notes: data.notes?.trim() || null,
      stage: "New" as const,
      is_demo: false, // Explicitly not demo data
    };

    const { data: inserted, error } = await supabaseAdmin
      .from("enquiries")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert enquiry error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/enquiries");

    return {
      success: true,
      message: `Enquiry for ${inserted.couple_name} created successfully!`,
      data: inserted,
    };
  } catch (err: any) {
    console.error("createEnquiryAction unexpected error:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred while saving enquiry.",
    };
  }
}
