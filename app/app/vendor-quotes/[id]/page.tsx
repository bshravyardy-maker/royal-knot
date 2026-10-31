import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { QuoteComparisonClient } from "@/components/QuoteComparisonClient";
import { QuoteRequest, VendorQuote, Vendor } from "@/lib/types";

export const revalidate = 0;

export default async function QuoteRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  let quoteRequest: QuoteRequest | null = null;
  let quotes: VendorQuote[] = [];
  let vendorsList: Vendor[] = [];
  let errorMessage: string | null = null;

  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch quote request with wedding details
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
      .eq("id", id)
      .maybeSingle();

    if (reqErr) throw reqErr;
    if (!reqData) notFound();
    quoteRequest = reqData;

    // 2. Fetch all quotes for this request with vendor profile
    const { data: quotesData, error: quotesErr } = await (supabase
      .from("vendor_quotes") as any)
      .select(`
        *,
        vendor:vendors (*)
      `)
      .eq("quote_request_id", id)
      .order("created_at", { ascending: true });

    if (!quotesErr && quotesData) {
      quotes = quotesData;
    }

    // 3. Fetch all vendors for the Add Quote modal
    const { data: vendorsData } = await supabase
      .from("vendors")
      .select("*")
      .order("rating", { ascending: false });

    if (vendorsData) {
      vendorsList = vendorsData;
    }
  } catch (err: any) {
    console.error("QuoteRequestDetailPage error:", err);
    errorMessage = err.message || "Failed to load quote request details.";
  }

  if (errorMessage) {
    return (
      <div className="royal-card p-12 text-center max-w-xl mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-serif font-bold text-navy mb-2">
          Unable to Load Quote Comparison
        </h2>
        <p className="text-xs text-navy/70 mb-6">{errorMessage}</p>
        <Link href="/vendor-quotes" className="btn-gold text-xs py-2 px-4 inline-flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          <span>Return to Vendor Quotes</span>
        </Link>
      </div>
    );
  }

  if (!quoteRequest) notFound();

  return (
    <QuoteComparisonClient
      quoteRequest={quoteRequest}
      initialQuotes={quotes}
      vendorsList={vendorsList}
    />
  );
}
