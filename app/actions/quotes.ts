"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface ActionResult<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface CreateQuoteRequestInput {
  wedding_id: string;
  category: string;
  guest_count: number;
  scope_description?: string;
  requested_deadline?: string;
}

export interface AddVendorQuoteInput {
  quote_request_id: string;
  vendor_id: string;
  price_per_plate: number;
  extra_hour_rate: number;
  inclusions: string[];
  notes?: string;
  custom_total?: number;
}

// 1. Create a New Quote Request
export async function createQuoteRequestAction(
  data: CreateQuoteRequestInput
): Promise<ActionResult<{ id: string }>> {
  if (!data.wedding_id) {
    return { success: false, error: "Please select a wedding." };
  }
  if (!data.category) {
    return { success: false, error: "Please choose a vendor service category." };
  }
  const guests = Number(data.guest_count);
  if (isNaN(guests) || guests <= 0) {
    return { success: false, error: "Guest count must be at least 1." };
  }

  try {
    const supabase = getSupabaseAdmin();

    const insertPayload = {
      wedding_id: data.wedding_id,
      category: data.category,
      guest_count: guests,
      scope_description: data.scope_description?.trim() || null,
      requested_deadline: data.requested_deadline || null,
      status: "Open" as const,
      is_demo: false,
    };

    const { data: created, error } = await supabase
      .from("quote_requests")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("createQuoteRequestAction error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/vendor-quotes");
    revalidatePath(`/weddings/${data.wedding_id}`);
    revalidatePath("/");

    return {
      success: true,
      message: "Quote request published to vendor network!",
      data: { id: created.id },
    };
  } catch (err: any) {
    console.error("createQuoteRequestAction unexpected error:", err);
    return { success: false, error: err.message || "Failed to create quote request." };
  }
}

// 2. Add a Vendor Quote to an existing Request
export async function addVendorQuoteAction(
  data: AddVendorQuoteInput
): Promise<ActionResult<{ id: string }>> {
  if (!data.quote_request_id) {
    return { success: false, error: "Missing quote request ID." };
  }
  if (!data.vendor_id) {
    return { success: false, error: "Please select a vendor." };
  }

  try {
    const supabase = getSupabaseAdmin();

    // Fetch the request to verify open status & get guest count
    const { data: request, error: reqErr } = await supabase
      .from("quote_requests")
      .select("status, guest_count")
      .eq("id", data.quote_request_id)
      .single();

    if (reqErr || !request) {
      return { success: false, error: "Target quote request not found." };
    }

    if (request.status !== "Open") {
      return {
        success: false,
        error: `Cannot submit quote: Request is already ${request.status}.`,
      };
    }

    const pricePerPlate = Number(data.price_per_plate) || 0;
    const extraHourRate = Number(data.extra_hour_rate) || 0;
    const guests = Number(request.guest_count) || 400;

    // Calculate total: price_per_plate * guest_count (or custom_total if provided)
    const computedTotal =
      data.custom_total && data.custom_total > 0
        ? Number(data.custom_total)
        : pricePerPlate > 0
        ? pricePerPlate * guests
        : extraHourRate;

    const insertPayload = {
      quote_request_id: data.quote_request_id,
      vendor_id: data.vendor_id,
      price_per_plate: pricePerPlate,
      extra_hour_rate: extraHourRate,
      inclusions: Array.isArray(data.inclusions) ? data.inclusions : [],
      total: computedTotal,
      amount: computedTotal,
      status: "Submitted" as const,
      notes: data.notes?.trim() || null,
      is_demo: false,
    };

    const { data: createdQuote, error: insertErr } = await supabase
      .from("vendor_quotes")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertErr) {
      console.error("addVendorQuoteAction error:", insertErr);
      return { success: false, error: insertErr.message };
    }

    revalidatePath("/vendor-quotes");
    revalidatePath(`/vendor-quotes/${data.quote_request_id}`);
    revalidatePath(`/vendors/${data.vendor_id}`);

    return {
      success: true,
      message: "Vendor quotation added successfully!",
      data: { id: createdQuote.id },
    };
  } catch (err: any) {
    console.error("addVendorQuoteAction unexpected error:", err);
    return { success: false, error: err.message || "Failed to submit quote." };
  }
}

// 3. Award Quote (Atomic Postgres RPC)
export async function awardQuoteAction(
  quoteId: string
): Promise<ActionResult<{ weddingVendorId: string }>> {
  if (!quoteId) {
    return { success: false, error: "Missing quote ID." };
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: weddingVendorId, error } = await supabase.rpc("award_quote", {
      p_quote_id: quoteId,
    });

    if (error) {
      console.error("award_quote RPC error:", error);
      return {
        success: false,
        error: error.message || "Failed to award quote. Please verify that the quote request is still Open.",
      };
    }

    revalidatePath("/vendor-quotes");
    revalidatePath("/weddings");
    revalidatePath("/vendors");
    revalidatePath("/");

    return {
      success: true,
      message: "Quote awarded successfully! Vendor has been contracted for the wedding.",
      data: { weddingVendorId },
    };
  } catch (err: any) {
    console.error("awardQuoteAction unexpected error:", err);
    return { success: false, error: err.message || "An unexpected error occurred while awarding quote." };
  }
}
