import React from "react";
import { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ContractsClient } from "@/components/ContractsClient";

export const metadata: Metadata = {
  title: "Contracts & Legal Vault | THE ROYAL KNOT",
  description: "Digital service level agreements, vendor contracts, and executed leases across destination palaces.",
};

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const supabase = getSupabaseAdmin();

  const [contractsRes, weddingsRes] = await Promise.all([
    supabase.from("contracts").select("*").order("created_at", { ascending: false }),
    supabase.from("weddings").select("id, title").order("wedding_date", { ascending: true }),
  ]);

  const contracts = contractsRes.data || [];
  const weddings = weddingsRes.data || [];

  return <ContractsClient initialContracts={contracts} weddingsList={weddings} />;
}
