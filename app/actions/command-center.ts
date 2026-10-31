"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface ActionResult<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/**
 * 1. Mark Vendor / Team Member Arrived
 * Sets arrived_at = now() on the server.
 * Idempotent: ignores the call if already set (no overwrite on double-click).
 */
export async function markArrived(scheduleItemId: string): Promise<ActionResult> {
  if (!scheduleItemId) {
    return { success: false, error: "Missing schedule item ID." };
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch current item to check if already arrived
    const { data: item, error: fetchErr } = await (supabase
      .from("schedule_items") as any)
      .select("id, arrived_at, title, event_name")
      .eq("id", scheduleItemId)
      .single();

    if (fetchErr) {
      console.error("markArrived fetch error:", fetchErr);
      return { success: false, error: fetchErr.message };
    }

    // Double-click protection: if already set, safely ignore and return current state
    if (item && item.arrived_at) {
      return {
        success: true,
        message: `${item.title || item.event_name || "Vendor"} is already checked in.`,
        data: item,
      };
    }

    // 2. Set arrived_at on the server
    const nowIso = new Date().toISOString();
    const { data: updated, error: updateErr } = await (supabase
      .from("schedule_items") as any)
      .update({
        arrived_at: nowIso,
        status: "Done",
        updated_at: nowIso,
      })
      .eq("id", scheduleItemId)
      .select()
      .single();

    if (updateErr) {
      console.error("markArrived update error:", updateErr);
      return { success: false, error: updateErr.message };
    }

    revalidatePath("/command-center");
    return {
      success: true,
      message: `${updated?.title || updated?.event_name || "Vendor"} marked as arrived at ${new Date(nowIso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.`,
      data: updated,
    };
  } catch (err: any) {
    console.error("markArrived unexpected error:", err);
    return {
      success: false,
      error: err.message || "Failed to mark item as arrived.",
    };
  }
}

/**
 * 2. Log Day-of Incident
 */
export async function logIncident(
  weddingId: string,
  title: string,
  severity: "Low" | "Medium" | "High",
  ownerId?: string
): Promise<ActionResult> {
  if (!weddingId) {
    return { success: false, error: "Missing wedding ID." };
  }
  if (!title || title.trim().length < 3) {
    return { success: false, error: "Please enter a descriptive incident title (at least 3 characters)." };
  }

  const validSeverities = ["Low", "Medium", "High"];
  if (!validSeverities.includes(severity)) {
    return { success: false, error: "Severity must be Low, Medium, or High." };
  }

  try {
    const supabase = getSupabaseAdmin();

    const insertPayload = {
      wedding_id: weddingId,
      title: title.trim(),
      severity,
      owner_id: ownerId || null,
      reported_by: ownerId || null,
      status: "Open" as const,
      is_demo: false,
    };

    const { data: inserted, error } = await (supabase
      .from("incidents") as any)
      .insert(insertPayload)
      .select(`
        *,
        owner:team_members!incidents_owner_id_fkey(id, name, role)
      `)
      .single();

    if (error) {
      // Fallback without join if constraint name differs
      const { data: insertedFallback, error: fallbackErr } = await (supabase
        .from("incidents") as any)
        .insert(insertPayload)
        .select()
        .single();

      if (fallbackErr) {
        console.error("logIncident insert error:", fallbackErr);
        return { success: false, error: fallbackErr.message };
      }

      revalidatePath("/command-center");
      return {
        success: true,
        message: `Incident logged: "${title.trim()}" (Severity: ${severity})`,
        data: insertedFallback,
      };
    }

    revalidatePath("/command-center");
    return {
      success: true,
      message: `Incident logged: "${title.trim()}" (Severity: ${severity})`,
      data: inserted,
    };
  } catch (err: any) {
    console.error("logIncident unexpected error:", err);
    return {
      success: false,
      error: err.message || "Failed to log incident.",
    };
  }
}

/**
 * 3. Resolve Incident
 * Requires resolution note.
 * Sets resolved_at on the server.
 * Rejects already Resolved incidents.
 */
export async function resolveIncident(
  incidentId: string,
  resolution: string
): Promise<ActionResult> {
  if (!incidentId) {
    return { success: false, error: "Missing incident ID." };
  }
  if (!resolution || resolution.trim().length < 3) {
    return { success: false, error: "A resolution note is required to resolve this incident." };
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch incident to verify current state
    const { data: incident, error: fetchErr } = await (supabase
      .from("incidents") as any)
      .select("id, status, title, resolved_at")
      .eq("id", incidentId)
      .single();

    if (fetchErr) {
      console.error("resolveIncident fetch error:", fetchErr);
      return { success: false, error: fetchErr.message };
    }

    if (incident && (incident.status === "Resolved" || incident.resolved_at)) {
      return {
        success: false,
        error: `Incident "${incident.title}" has already been resolved.`,
      };
    }

    // 2. Update with resolution on the server
    const nowIso = new Date().toISOString();
    const cleanResolution = resolution.trim();

    const { data: updated, error: updateErr } = await (supabase
      .from("incidents") as any)
      .update({
        status: "Resolved",
        resolution: cleanResolution,
        resolution_notes: cleanResolution,
        resolved_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", incidentId)
      .select()
      .single();

    if (updateErr) {
      console.error("resolveIncident update error:", updateErr);
      return { success: false, error: updateErr.message };
    }

    revalidatePath("/command-center");
    return {
      success: true,
      message: `Incident resolved: "${incident.title}"`,
      data: updated,
    };
  } catch (err: any) {
    console.error("resolveIncident unexpected error:", err);
    return {
      success: false,
      error: err.message || "Failed to resolve incident.",
    };
  }
}
