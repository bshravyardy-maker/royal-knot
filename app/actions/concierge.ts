"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSessionAction } from "@/actions/auth";
import {
  GuestPassport,
  GuestPortalData,
  GuestRsvpSubmission,
  GuestTransportUpdate,
  WeddingItineraryItem,
} from "@/lib/types";

export interface ActionResult<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/**
 * Computes a SHA-256 hash of a raw bearer token.
 * Only this hash is ever stored in or matched against the database.
 */
export async function hashBearerToken(rawToken: string): Promise<string> {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}

/**
 * Generates a cryptographically strong random bearer token (48 hex chars).
 */
export async function generateCryptographicBearerToken(): Promise<string> {
  return crypto.randomBytes(24).toString("hex");
}

// -----------------------------------------------------------------------------
// 1. GUEST-FACING ACTIONS (Authenticated via cryptographically hashed token)
// -----------------------------------------------------------------------------

/**
 * Fetches personalised wedding passport data for an invited guest.
 * Verifies SHA-256 token hash, checks revocation and expiration,
 * and strictly returns only this specific guest's personal information.
 */
export async function getGuestPassportByToken(
  rawToken: string
): Promise<ActionResult<GuestPortalData>> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length < 16) {
    return { success: false, error: "Invalid or malformed passport token." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const tokenHash = await hashBearerToken(rawToken);

    // 1. Fetch passport by token_hash
    const { data: passport, error: passErr } = await (supabase
      .from("guest_passports") as any)
      .select("*")
      .eq("token_hash", tokenHash)
      .single();

    if (passErr || !passport) {
      return {
        success: false,
        error: "This royal passport could not be found. Please contact the wedding coordination team.",
      };
    }

    if (passport.revoked) {
      return {
        success: false,
        error: "This digital passport has been revoked or reissued by the agency concierge desk.",
      };
    }

    const isExpired = new Date(passport.expires_at).getTime() < Date.now();
    if (isExpired) {
      return {
        success: false,
        error: "This wedding passport has expired. Please request a renewed link from the palace concierge.",
      };
    }

    // 2. Fetch specific guest record
    const { data: guest, error: guestErr } = await (supabase
      .from("guests") as any)
      .select("id, name, party_size, side, rsvp_status, dietary_notes, hotel_assigned, room_number, wedding_id")
      .eq("id", passport.guest_id)
      .single();

    if (guestErr || !guest) {
      return { success: false, error: "Guest profile not found on palace roster." };
    }

    // Enforce consistency check: passport wedding_id must match guest wedding_id
    if (guest.wedding_id !== passport.wedding_id) {
      return { success: false, error: "Database consistency mismatch between guest and wedding assignment." };
    }

    // 3. Fetch wedding & couple details
    const { data: wedding, error: wedErr } = await (supabase
      .from("weddings") as any)
      .select("id, title, wedding_date, wedding_end_date, venue, city, couple_id")
      .eq("id", passport.wedding_id)
      .single();

    let coupleNames = "The Royal Couple";
    if (wedding?.couple_id) {
      const { data: couple } = await (supabase
        .from("couples") as any)
        .select("partner_1_name, partner_2_name")
        .eq("id", wedding.couple_id)
        .single();
      if (couple) {
        coupleNames = `${couple.partner_1_name} & ${couple.partner_2_name}`;
      }
    } else if (wedding?.title) {
      coupleNames = wedding.title.replace(/Wedding|Vivah|Royal/gi, "").trim();
    }

    // 4. Fetch 3-Day Wedding Itinerary
    const { data: itineraryRows } = await (supabase
      .from("wedding_itineraries") as any)
      .select("*")
      .eq("wedding_id", passport.wedding_id)
      .order("day_number", { ascending: true })
      .order("sort_order", { ascending: true });

    let itinerary: WeddingItineraryItem[] = itineraryRows || [];

    // Fallback: If no custom wedding_itineraries exist yet, generate from schedule_items
    if (itinerary.length === 0) {
      const { data: scheduleRows } = await (supabase
        .from("schedule_items") as any)
        .select("id, event_name, title, venue_sublocation, start_time, end_time")
        .eq("wedding_id", passport.wedding_id)
        .order("start_time", { ascending: true });

      if (scheduleRows && scheduleRows.length > 0) {
        itinerary = scheduleRows.map((s: any, idx: number) => ({
          id: s.id,
          wedding_id: passport.wedding_id,
          day_number: (idx % 3) + 1,
          day_title: `Day ${(idx % 3) + 1}: Palatial Celebration`,
          event_name: s.event_name || s.title || "Royal Ceremony",
          start_time: s.start_time
            ? new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "05:00 PM",
          end_time: s.end_time
            ? new Date(s.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : undefined,
          venue_sublocation: s.venue_sublocation || wedding?.venue || "Palace Courtyard",
          dress_code: idx === 0 ? "Royal Heritage Pastels" : idx === 1 ? "Imperial Sangeet Velvet & Gold" : "Traditional Shahi Rajputana",
          description: "Exclusive celebration for palace dignitaries and family guests.",
          location_map_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${s.venue_sublocation || ""} ${wedding?.venue || ""} ${wedding?.city || "Jaipur"}`
          )}`,
          sort_order: idx,
          is_demo: false,
          created_at: new Date().toISOString(),
        }));
      } else {
        // Default 3-day royal itinerary template
        itinerary = [
          {
            id: `itin-1-${passport.wedding_id}`,
            wedding_id: passport.wedding_id,
            day_number: 1,
            day_title: "Day 1: Imperial Mehendi & Sufi Serenade",
            event_name: "Palace Welcome & Sufi Mehfil",
            start_time: "04:30 PM",
            end_time: "08:30 PM",
            venue_sublocation: "Kesar Kyari Courtyard",
            dress_code: "Royal Emeralds & Heritage Leheriya",
            description: "Traditional afternoon henna application followed by live Sufi musical ensemble under the palace stars.",
            location_map_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding?.venue || "Jaipur")}`,
            sort_order: 1,
            is_demo: true,
            created_at: new Date().toISOString(),
          },
          {
            id: `itin-2-${passport.wedding_id}`,
            wedding_id: passport.wedding_id,
            day_number: 2,
            day_title: "Day 2: Royal Sangeet & Shahi Banquet",
            event_name: "Grand Sangeet & Folk Dancers",
            start_time: "07:00 PM",
            end_time: "11:30 PM",
            venue_sublocation: "Durbar Dining Hall & Gardens",
            dress_code: "Imperial Velvets, Tuxedos & Heavy Zari",
            description: "Cocktail reception, choreographed family dance performances, and 108-dish royal silver thali banquet.",
            location_map_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding?.venue || "Jaipur")}`,
            sort_order: 2,
            is_demo: true,
            created_at: new Date().toISOString(),
          },
          {
            id: `itin-3-${passport.wedding_id}`,
            wedding_id: passport.wedding_id,
            day_number: 3,
            day_title: "Day 3: Shahi Vivah & Vidai Reception",
            event_name: "Vedic Pheras & Royal Reception",
            start_time: "05:00 PM",
            end_time: "10:30 PM",
            venue_sublocation: "Lake Pavilion Mandap",
            dress_code: "Traditional Shahi Safa & Crimson Silks",
            description: "Solemn wedding vows around the holy fire, terrace fireworks, and dinner honoring the newly wed couple.",
            location_map_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding?.venue || "Jaipur")}`,
            sort_order: 3,
            is_demo: true,
            created_at: new Date().toISOString(),
          },
        ];
      }
    }

    // 5. Update last_accessed_at telemetry
    await (supabase.from("guest_passports") as any)
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", passport.id);

    const portalData: GuestPortalData = {
      guest: {
        id: guest.id,
        name: guest.name,
        party_size: Number(guest.party_size) || 1,
        side: guest.side || "Both",
        rsvp_status: guest.rsvp_status || "Pending",
        dietary_notes: guest.dietary_notes,
        hotel_assigned: guest.hotel_assigned || wedding?.venue?.split(",")[0] || "Heritage Palace Hotel",
        room_number: guest.room_number || "Palace Wing Suite",
      },
      passport: {
        id: passport.id,
        welcome_message: passport.welcome_message || `We are deeply honored to welcome you to the royal wedding celebration of ${coupleNames}. Your presence graces our celebration.`,
        airport_pickup_required: Boolean(passport.airport_pickup_required),
        arrival_flight_train: passport.arrival_flight_train || undefined,
        arrival_time: passport.arrival_time || undefined,
        pickup_location: passport.pickup_location || undefined,
        transport_status: passport.transport_status || "Not Required",
        assigned_driver_name: passport.assigned_driver_name || undefined,
        assigned_driver_phone: passport.assigned_driver_phone || undefined,
        vehicle_details: passport.vehicle_details || undefined,
        departure_flight_train: passport.departure_flight_train || undefined,
        departure_time: passport.departure_time || undefined,
        departure_transport_notes: passport.departure_transport_notes || undefined,
        meal_preference: passport.meal_preference || "Royal Rajputana Thali",
        special_assistance: passport.special_assistance || undefined,
        expires_at: passport.expires_at,
      },
      wedding: {
        id: wedding?.id || passport.wedding_id,
        title: wedding?.title || "Palace Vivah Celebration",
        wedding_date: wedding?.wedding_date || new Date().toISOString().split("T")[0],
        wedding_end_date: wedding?.wedding_end_date || undefined,
        venue: wedding?.venue || "Rambagh Palace, Jaipur",
        city: wedding?.city || "Jaipur",
        couple_names: coupleNames,
      },
      itinerary,
      conciergeContact: {
        lead_name: "Raghvendra Singh Rathore",
        role: "Senior Wedding Concierge & Protocol Officer",
        phone: "+91 98290 11002",
        email: "concierge@royalknot.in",
        emergency_desk: "+91 141 238 5700 (Palace Desk Ext. 401)",
      },
    };

    return { success: true, data: portalData };
  } catch (err: any) {
    console.error("getGuestPassportByToken error:", err);
    return { success: false, error: err.message || "Failed to load wedding passport." };
  }
}

/**
 * Submits or updates an RSVP decision and preferences from the guest portal.
 * Authenticated exclusively by the guest's secret rawToken (re-hashed with SHA-256).
 * Reuses guests.rsvp_status and guests.dietary_notes as the single source of truth.
 */
export async function submitGuestRsvpAction(
  rawToken: string,
  submission: GuestRsvpSubmission
): Promise<ActionResult> {
  if (!rawToken || !submission?.rsvp_status) {
    return { success: false, error: "Missing required RSVP details." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const tokenHash = await hashBearerToken(rawToken);

    // 1. Look up passport by hash
    const { data: passport, error: passErr } = await (supabase
      .from("guest_passports") as any)
      .select("id, guest_id, wedding_id, revoked, expires_at, transport_status")
      .eq("token_hash", tokenHash)
      .single();

    if (passErr || !passport || passport.revoked) {
      return { success: false, error: "Invalid, expired or revoked passport link." };
    }

    if (new Date(passport.expires_at).getTime() < Date.now()) {
      return { success: false, error: "This passport link has expired." };
    }

    // 2. Update guests table (single source of truth for RSVP & dietary notes)
    const dietaryValue = submission.dietary_notes?.trim()
      ? `${submission.meal_preference} • ${submission.dietary_notes.trim()}`
      : submission.meal_preference;

    const { error: guestUpdateErr } = await (supabase
      .from("guests") as any)
      .update({
        rsvp_status: submission.rsvp_status,
        dietary_notes: dietaryValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", passport.guest_id);

    if (guestUpdateErr) {
      return { success: false, error: guestUpdateErr.message };
    }

    // 3. Update passport table with concierge transport & assistance specifics
    let transportStatus = passport.transport_status;
    if (submission.airport_pickup_required && transportStatus === "Not Required") {
      transportStatus = "Requested";
    }

    const { error: passUpdateErr } = await (supabase
      .from("guest_passports") as any)
      .update({
        meal_preference: submission.meal_preference,
        special_assistance: submission.special_assistance?.trim() || null,
        airport_pickup_required: Boolean(submission.airport_pickup_required),
        arrival_flight_train: submission.arrival_flight_train?.trim() || null,
        departure_flight_train: submission.departure_flight_train?.trim() || null,
        transport_status: transportStatus,
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", passport.id);

    if (passUpdateErr) {
      return { success: false, error: passUpdateErr.message };
    }

    revalidatePath("/guests");
    return {
      success: true,
      message: submission.rsvp_status === "Attending"
        ? "Your royal banquet RSVP is confirmed! We look forward to welcoming you."
        : "Your RSVP response has been respectfully recorded. Thank you for notifying us.",
    };
  } catch (err: any) {
    console.error("submitGuestRsvpAction error:", err);
    return { success: false, error: err.message || "Failed to submit RSVP." };
  }
}

// -----------------------------------------------------------------------------
// 2. AGENCY MANAGEMENT ACTIONS (Protected by staff session verification)
// -----------------------------------------------------------------------------

async function verifyStaffAuthorization(): Promise<ActionResult> {
  const session = await getSessionAction();
  if (!session?.email) {
    return { success: false, error: "Unauthorized access. Staff credentials required." };
  }
  return { success: true };
}

/**
 * Agency fetches concierge passes and hospitality statistics for a wedding or all weddings.
 */
export async function getAgencyConciergeDataAction(
  weddingId?: string
): Promise<ActionResult<{ passes: any[]; summary: any }>> {
  const auth = await verifyStaffAuthorization();
  if (!auth.success) return auth;

  try {
    const supabase = getSupabaseAdmin();

    let query = (supabase.from("guest_passports") as any).select(`
      id,
      guest_id,
      wedding_id,
      welcome_message,
      airport_pickup_required,
      arrival_flight_train,
      arrival_time,
      pickup_location,
      transport_status,
      assigned_driver_name,
      assigned_driver_phone,
      vehicle_details,
      departure_flight_train,
      departure_time,
      departure_transport_notes,
      meal_preference,
      special_assistance,
      revoked,
      expires_at,
      last_accessed_at,
      created_at
    `);

    if (weddingId && weddingId !== "All") {
      query = query.eq("wedding_id", weddingId);
    }

    const { data: passesRows, error } = await query;
    if (error) {
      console.warn("Could not query guest_passports:", error.message);
      return { success: true, data: { passes: [], summary: { totalPasses: 0, requestedPickups: 0, activePasses: 0 } } };
    }

    const passes = passesRows || [];
    const totalPasses = passes.length;
    const activePasses = passes.filter((p: any) => !p.revoked && new Date(p.expires_at).getTime() > Date.now()).length;
    const requestedPickups = passes.filter((p: any) => p.airport_pickup_required || p.transport_status === "Requested").length;

    return {
      success: true,
      data: {
        passes,
        summary: {
          totalPasses,
          activePasses,
          requestedPickups,
        },
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Agency generates or retrieves a unique QR code passport for an invited guest.
 * Generates a cryptographically random token, stores its SHA-256 hash in DB,
 * and returns the raw bearer token ONLY to the authorized agency UI.
 */
export async function generateOrGetGuestPassportAction(
  guestId: string
): Promise<ActionResult<{ rawToken: string; passportId: string; passUrl: string }>> {
  const auth = await verifyStaffAuthorization();
  if (!auth.success) return auth;

  if (!guestId) return { success: false, error: "Guest ID is required." };

  try {
    const supabase = getSupabaseAdmin();

    // 1. Verify guest exists and fetch wedding_id
    const { data: guest, error: gErr } = await (supabase
      .from("guests") as any)
      .select("id, name, wedding_id, is_demo")
      .eq("id", guestId)
      .single();

    if (gErr || !guest) {
      return { success: false, error: "Guest record not found." };
    }

    // 2. Generate a fresh, cryptographically strong random bearer token
    const rawToken = await generateCryptographicBearerToken();
    const tokenHash = await hashBearerToken(rawToken);

    // 60-day expiration window
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    // 3. Upsert into guest_passports (unique constraint on guest_id)
    const { data: savedPass, error: saveErr } = await (supabase
      .from("guest_passports") as any)
      .upsert(
        {
          guest_id: guest.id,
          wedding_id: guest.wedding_id,
          token_hash: tokenHash,
          revoked: false,
          revoked_at: null,
          expires_at: expiresAt,
          is_demo: Boolean(guest.is_demo),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "guest_id" }
      )
      .select("id")
      .single();

    if (saveErr) {
      console.error("generateOrGetGuestPassportAction save error:", saveErr);
      return { success: false, error: saveErr.message };
    }

    revalidatePath("/guests");

    return {
      success: true,
      message: `Digital passport generated for ${guest.name}`,
      data: {
        rawToken,
        passportId: savedPass?.id || guest.id,
        passUrl: `/passport/${rawToken}`,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Regenerates a guest passport (e.g. if link was misplaced or compromised).
 * Invalidates the previous token hash and generates a fresh cryptographically random token.
 */
export async function regenerateGuestPassportAction(
  guestId: string
): Promise<ActionResult<{ rawToken: string; passUrl: string }>> {
  const auth = await verifyStaffAuthorization();
  if (!auth.success) return auth;

  if (!guestId) return { success: false, error: "Missing guest ID." };

  try {
    const supabase = getSupabaseAdmin();
    const { data: guest } = await (supabase.from("guests") as any)
      .select("id, wedding_id, is_demo")
      .eq("id", guestId)
      .single();

    if (!guest) return { success: false, error: "Guest not found." };

    const rawToken = await generateCryptographicBearerToken();
    const tokenHash = await hashBearerToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await (supabase
      .from("guest_passports") as any)
      .upsert(
        {
          guest_id: guest.id,
          wedding_id: guest.wedding_id,
          token_hash: tokenHash,
          revoked: false,
          revoked_at: null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "guest_id" }
      );

    if (error) return { success: false, error: error.message };

    revalidatePath("/guests");
    return {
      success: true,
      message: "New secure passport access key issued.",
      data: {
        rawToken,
        passUrl: `/passport/${rawToken}`,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Revokes a guest's passport access immediately.
 */
export async function revokeGuestPassportAction(
  guestId: string
): Promise<ActionResult> {
  const auth = await verifyStaffAuthorization();
  if (!auth.success) return auth;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await (supabase
      .from("guest_passports") as any)
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("guest_id", guestId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/guests");
    return { success: true, message: "Passport access has been revoked." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Agency manages transport logistics, airport pickups, and assigned drivers.
 */
export async function updateGuestTransportAction(
  data: GuestTransportUpdate
): Promise<ActionResult> {
  const auth = await verifyStaffAuthorization();
  if (!auth.success) return auth;

  if (!data.guest_id) return { success: false, error: "Missing guest ID." };

  try {
    const supabase = getSupabaseAdmin();

    const updatePayload = {
      airport_pickup_required: Boolean(data.airport_pickup_required),
      arrival_flight_train: data.arrival_flight_train?.trim() || null,
      arrival_time: data.arrival_time || null,
      pickup_location: data.pickup_location?.trim() || null,
      transport_status: data.transport_status,
      assigned_driver_name: data.assigned_driver_name?.trim() || null,
      assigned_driver_phone: data.assigned_driver_phone?.trim() || null,
      vehicle_details: data.vehicle_details?.trim() || null,
      departure_flight_train: data.departure_flight_train?.trim() || null,
      departure_time: data.departure_time || null,
      departure_transport_notes: data.departure_transport_notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase
      .from("guest_passports") as any)
      .update(updatePayload)
      .eq("guest_id", data.guest_id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/guests");
    return { success: true, message: "Transport arrangements updated successfully." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
