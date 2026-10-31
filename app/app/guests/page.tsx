import React from "react";
import { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { GuestsClient } from "@/components/GuestsClient";

export const metadata: Metadata = {
  title: "Guest Hospitality & RSVPs | THE ROYAL KNOT",
  description: "Palatial room allocations, dietary protocols, and guest itineraries across destination weddings.",
};

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const supabase = getSupabaseAdmin();

  const [guestsRes, weddingsRes] = await Promise.all([
    supabase.from("guests").select("*").order("created_at", { ascending: false }),
    supabase.from("weddings").select("id, title").order("wedding_date", { ascending: true }),
  ]);

  const guests = guestsRes.data || [];
  const weddings = weddingsRes.data || [];

  return <GuestsClient initialGuests={guests} weddingsList={weddings} />;
}
