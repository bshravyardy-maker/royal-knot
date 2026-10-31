"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { Stage, TaskStage } from "@/lib/types";

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

export interface ActionResult<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

// 1. Create Enquiry
export async function createEnquiryAction(data: CreateEnquiryInput): Promise<ActionResult> {
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
    const supabase = getSupabaseAdmin();

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
      is_demo: false, // Live intake
    };

    const { data: inserted, error } = await (supabase
      .from("enquiries") as any)
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
      message: `Enquiry for ${inserted?.couple_name} created successfully!`,
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

// 1B. Public Portal Inquiry (Couples & Guests)
export interface PublicInquiryInput {
  inquiry_type: "couple_inquiry" | "guest_request" | "general_query";
  name: string;
  phone: string;
  email?: string;
  destination?: string;
  message: string;
}

export async function submitPublicInquiryAction(data: PublicInquiryInput): Promise<ActionResult> {
  if (!data.name || data.name.trim().length < 2) {
    return { success: false, error: "Please enter your name." };
  }
  if (!data.phone || data.phone.trim().length < 8) {
    return { success: false, error: "A valid contact phone number is required." };
  }
  if (!data.message || data.message.trim().length < 5) {
    return { success: false, error: "Please write your query or celebration request." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const isCouple = data.inquiry_type === "couple_inquiry";

    const insertPayload = {
      couple_name: isCouple ? data.name.trim() : `${data.name.trim()} (Guest Inquiry)`,
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
      guests: isCouple ? 400 : 1,
      budget: isCouple ? 8000000 : 50000,
      theme: isCouple ? "Palace Romance" : "Guest Hospitality & RSVP Protocol",
      source: "Client & Guest Portal",
      package: isCouple ? "Full-Service" : "Partial / Day-of",
      city: data.destination || "Jaipur",
      notes: `[Portal Inquiry - ${data.inquiry_type.toUpperCase()}] ${data.message.trim()}`,
      stage: "New" as const,
      is_demo: false,
    };

    const { data: created, error } = await (supabase
      .from("enquiries") as any)
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("submitPublicInquiryAction error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/enquiries");

    return {
      success: true,
      message: "Your royal request has been received! A concierge partner will connect shortly.",
      data: { id: created?.id },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit request." };
  }
}

// 2. Update Enquiry Stage
export async function updateEnquiryStageAction(
  enquiryId: string,
  newStage: Stage
): Promise<ActionResult> {
  if (!enquiryId) return { success: false, error: "Missing enquiry ID." };

  const validStages: Stage[] = ["New", "Contacted", "Meeting", "Proposal", "Won", "Lost"];
  if (!validStages.includes(newStage)) {
    return { success: false, error: `Invalid stage: ${newStage}` };
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await (supabase
      .from("enquiries") as any)
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq("id", enquiryId)
      .select()
      .single();

    if (error) {
      console.error("updateEnquiryStageAction error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/enquiries");
    revalidatePath(`/enquiries/${enquiryId}`);

    return {
      success: true,
      message: `Stage successfully updated to "${newStage}"`,
      data,
    };
  } catch (err: any) {
    console.error("updateEnquiryStageAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to update enquiry stage.",
    };
  }
}

// 3. Sign Contract & Upload Signature to Private Storage
export async function signContractAction(payload: {
  enquiryId: string;
  signaturePngBase64: string;
  coupleName: string;
  totalValue: number;
  package: string;
  weddingDate?: string;
  guests: number;
  terms: string;
}): Promise<ActionResult<{ contractId: string; signedUrl: string; signed_at: string }>> {
  if (!payload.enquiryId) return { success: false, error: "Missing enquiry ID." };
  if (!payload.signaturePngBase64 || !payload.signaturePngBase64.includes("base64,")) {
    return { success: false, error: "Invalid signature graphic. Please draw signature on canvas." };
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. Process base64 PNG
    const base64Data = payload.signaturePngBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const filePath = `sig_${payload.enquiryId}_${Date.now()}.png`;

    // 2. Upload to private Storage bucket 'signatures'
    const { error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(filePath, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return {
        success: false,
        error: `Failed to upload signature image: ${uploadError.message}. Make sure migration 02 has been applied.`,
      };
    }

    // 3. Insert contract record with server-generated signed_at
    const contractPayload = {
      enquiry_id: payload.enquiryId,
      couple_name: payload.coupleName,
      title: `Palatial Wedding Service Agreement - ${payload.coupleName}`,
      total_value: Number(payload.totalValue) || 0,
      signature_url: filePath,
      signed_at: new Date().toISOString(),
      status: "Signed" as const,
      terms: payload.terms,
      is_demo: false,
    };

    const { data: contract, error: contractErr } = await (supabase
      .from("contracts") as any)
      .insert(contractPayload)
      .select()
      .single();

    if (contractErr) {
      console.error("Contract insert error:", contractErr);
      return { success: false, error: `Failed to save contract record: ${contractErr.message}` };
    }

    // 4. Generate signed URL valid for 24 hours
    const { data: signedData, error: signUrlErr } = await supabase.storage
      .from("signatures")
      .createSignedUrl(filePath, 60 * 60 * 24);

    if (signUrlErr) {
      console.warn("createSignedUrl warning:", signUrlErr.message);
    }

    revalidatePath(`/enquiries/${payload.enquiryId}`);
    revalidatePath("/enquiries");

    return {
      success: true,
      message: "Palatial Service Agreement signed and archived successfully!",
      data: {
        contractId: contract.id,
        signedUrl: signedData?.signedUrl || "",
        signed_at: contract.signed_at,
      },
    };
  } catch (err: any) {
    console.error("signContractAction unexpected error:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during contract signing.",
    };
  }
}

// 4. Record Booking Deposit (Atomic RPC)
export async function recordBookingDepositAction(
  enquiryId: string,
  amount: number
): Promise<ActionResult<{ weddingId: string }>> {
  if (!enquiryId) return { success: false, error: "Missing enquiry ID." };
  if (!amount || Number(amount) <= 0) {
    return { success: false, error: "Deposit amount must be greater than 0." };
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: weddingId, error } = await (supabase.rpc as any)("record_booking_deposit", {
      p_enquiry_id: enquiryId,
      p_amount: Number(amount),
    });

    if (error) {
      console.error("record_booking_deposit RPC error:", error);
      return {
        success: false,
        error: error.message || "Failed to execute booking deposit transaction.",
      };
    }

    revalidatePath("/");
    revalidatePath("/enquiries");
    revalidatePath(`/enquiries/${enquiryId}`);
    revalidatePath("/weddings");
    revalidatePath(`/weddings/${weddingId}`);
    revalidatePath("/wedding-tasks");

    return {
      success: true,
      message: "Booking deposit recorded! Royal Wedding activated and tasks generated.",
      data: { weddingId },
    };
  } catch (err: any) {
    console.error("recordBookingDepositAction unexpected error:", err);
    return {
      success: false,
      error: err.message || "Unexpected failure while recording deposit.",
    };
  }
}

// 5. Update Wedding Task Stage
export async function updateTaskStageAction(
  taskId: string,
  newStage: TaskStage
): Promise<ActionResult> {
  if (!taskId) return { success: false, error: "Missing task ID." };

  const validStages: TaskStage[] = ["To Plan", "In Progress", "Blocked", "Done"];
  if (!validStages.includes(newStage)) {
    return { success: false, error: `Invalid task stage: ${newStage}` };
  }

  try {
    const supabase = getSupabaseAdmin();

    const updatePayload: any = {
      stage: newStage,
      updated_at: new Date().toISOString(),
    };

    if (newStage === "Done") {
      updatePayload.completed_at = new Date().toISOString();
    } else {
      updatePayload.completed_at = null;
    }

    const { data, error } = await (supabase
      .from("wedding_tasks") as any)
      .update(updatePayload)
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("updateTaskStageAction error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/wedding-tasks");
    revalidatePath("/weddings");

    return {
      success: true,
      message: `Task moved to ${newStage}`,
      data,
    };
  } catch (err: any) {
    console.error("updateTaskStageAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to update task stage.",
    };
  }
}
