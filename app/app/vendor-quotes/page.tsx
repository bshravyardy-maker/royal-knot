import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  FileSpreadsheet,
  Crown,
  Calendar,
  Users,
  Coins,
  Sparkles,
  ArrowRight,
  Plus,
  AlertCircle,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { DemoBadge } from "@/components/DemoBadge";
import { QuoteRequestListClient } from "@/components/QuoteRequestListClient";
import { QuoteRequest } from "@/lib/types";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Vendor RFPs & Competing Quotes | THE ROYAL KNOT",
  description:
    "Evaluate competing vendor quotes, price per plate rate cards, contract inclusions, and tender awards.",
};

export default async function VendorQuotesPage() {
  let requests: QuoteRequest[] = [];
  let weddingsList: { id: string; title: string; guest_count: number }[] = [];
  let errorMsg: string | null = null;

  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch quote requests
    const { data: reqData, error: reqErr } = await (supabase
      .from("quote_requests") as any)
      .select(`
        *,
        wedding:weddings (
          id,
          title,
          city,
          guest_count
        )
      `)
      .order("created_at", { ascending: false });

    if (reqErr) throw reqErr;

    // 2. Fetch quotes counts for each request
    const { data: quotesData } = await (supabase
      .from("vendor_quotes") as any)
      .select("id, quote_request_id");

    const countMap: Record<string, number> = {};
    if (quotesData) {
      (quotesData as any[]).forEach((q: any) => {
        countMap[q.quote_request_id] = (countMap[q.quote_request_id] || 0) + 1;
      });
    }

    requests = ((reqData || []) as any[]).map((r: any) => ({
      ...r,
      quotes_count: countMap[r.id] || 0,
    }));

    // 3. Fetch weddings for the New Request modal
    const { data: wedData } = await supabase
      .from("weddings")
      .select("id, title, guest_count")
      .order("wedding_date", { ascending: true });

    if (wedData) {
      weddingsList = wedData;
    }
  } catch (err: any) {
    console.error("VendorQuotesPage error:", err);
    errorMsg = err.message || "Failed to load quote requests.";
  }

  return (
    <QuoteRequestListClient
      initialRequests={requests}
      weddingsList={weddingsList}
      errorMsg={errorMsg}
    />
  );
}
