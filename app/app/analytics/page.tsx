import { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { AnalyticsClient } from "@/components/AnalyticsClient";

export const metadata: Metadata = {
  title: "Founder Analytics & Profitability | THE ROYAL KNOT",
  description: "Executive ledger, unit profit per wedding, vendor scorecard and 30-day liquidity forecast.",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  try {
    const db = getSupabaseAdmin();

    const [profitRes, scorecardRes, duesRes, overdueRes, tokensRes] = await Promise.all([
      db.from("wedding_profit").select("*"),
      db.from("vendor_scorecard").select("*").order("rating", { ascending: false }),
      db.from("dues_next_30_days").select("*").order("due_date", { ascending: true }),
      db.from("overdue_dues").select("*").order("days_overdue", { ascending: false }),
      db.from("share_tokens").select("*").order("created_at", { ascending: false }),
    ]);

    // Tolerate overdueRes error if migration 8 is pending run
    const firstError = [profitRes, scorecardRes, duesRes, tokensRes].find((r) => r.error)?.error;
    if (firstError) throw new Error(firstError.message);

    return (
      <AnalyticsClient
        weddingProfits={profitRes.data ?? []}
        vendorScorecard={scorecardRes.data ?? []}
        dues={duesRes.data ?? []}
        overdueDues={overdueRes.data ?? []}
        shareTokens={tokensRes.data ?? []}
        isPublicView={false}
      />
    );
  } catch (e: any) {
    const errorMsg = e instanceof Error ? e.message : "Failed to load analytics";
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 space-y-2">
          <p className="font-serif font-bold text-lg">Analytics Ledger Notice</p>
          <p className="text-sm">{errorMsg}</p>
          <p className="text-xs text-red-700">
            Ensure Phase 5, Phase 6, and Phase 7 migrations have been applied in your Supabase SQL Editor.
          </p>
        </div>
      </div>
    );
  }
}
