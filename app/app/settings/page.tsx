import React from "react";
import { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/SettingsClient";

export const metadata: Metadata = {
  title: "Agency Settings & Governance | THE ROYAL KNOT",
  description: "Brand credentials, team management, package pricing, and Supabase security configurations.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = getSupabaseAdmin();

  const [teamRes, pkgRes] = await Promise.all([
    supabase.from("team_members").select("*").order("name", { ascending: true }),
    supabase.from("packages").select("*").order("starting_price", { ascending: true }),
  ]);

  const teamMembers = teamRes.data || [];
  const packages = pkgRes.data || [];

  return <SettingsClient teamMembers={teamMembers} packages={packages} />;
}
