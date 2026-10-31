import { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { AnalyticsClient } from "@/components/AnalyticsClient";
import { Lock, Sparkles, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Executive Intelligence Briefing | THE ROYAL KNOT",
  description: "Read-only executive analytics briefing on palatial wedding operations and financial performance.",
};

export const dynamic = "force-dynamic";

interface SharePageProps {
  params: {
    token: string;
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = params;

  try {
    const db = getSupabaseAdmin();

    // 1. Validate share token (exists, not revoked, not expired)
    const { data: shareToken, error: tokenErr } = await db
      .from("share_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenErr || !shareToken) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-navy">Invalid Share Link</h1>
            <p className="text-xs text-gray-500">
              This executive briefing link does not exist or may have been typed incorrectly.
            </p>
            <Link href="/" className="inline-block px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold">
              Return to Agency Portal
            </Link>
          </div>
        </div>
      );
    }

    const isExpired = new Date(shareToken.expires_at).getTime() < Date.now();
    if (shareToken.revoked || isExpired) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200 p-8 text-center shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-navy">
              {shareToken.revoked ? "Briefing Link Revoked" : "Share Link Expired"}
            </h1>
            <p className="text-xs text-gray-500">
              {shareToken.revoked
                ? "This executive intelligence link was manually revoked by the agency founder."
                : "This link expired after its 7-day security window. Please request a refreshed link from the founder."}
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-mono text-gray-400">Token ID: {token}</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. Fetch Aggregates Only (No phone numbers, no emails, no signatures)
    const [profitRes, scorecardRes, duesRes, overdueRes] = await Promise.all([
      db.from("wedding_profit").select("wedding_id, wedding_title, wedding_date, city, revenue_total, vendor_cost, absorbed_extras, team_cost, profit, margin_pct, loss_reason, is_demo"),
      db.from("vendor_scorecard").select("vendor_id, vendor_name, category, rating, weddings_count, on_time_rate, avg_bill_variance_pct, is_demo"),
      db.from("dues_next_30_days").select("id, wedding_id, title, counterparty, amount, due_date, direction"),
      db.from("overdue_dues").select("id, wedding_id, title, counterparty, amount, due_date, direction, days_overdue"),
    ]);

    // Sanitize counterparty for public view (mask specific personal names to generic role)
    const sanitizedDues = (duesRes.data ?? []).map((d: any) => ({
      ...d,
      counterparty: d.direction === "in" ? "Client Party" : d.counterparty,
    }));
    const sanitizedOverdue = (overdueRes.data ?? []).map((d: any) => ({
      ...d,
      counterparty: d.direction === "in" ? "Client Party" : d.counterparty,
    }));

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 p-4 rounded-xl bg-navy text-ivory flex items-center justify-between border border-[#C6A46A]/40 shadow-sm">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-gold flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gold tracking-widest uppercase">
                THE ROYAL KNOT • Executive Briefing
              </p>
              <p className="text-xs text-ivory/80">
                Verified high-level financial summary. Personal contact information and client signatures omitted.
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-1 rounded bg-white/10 text-ivory/80 border border-white/20">
            Valid until {new Date(shareToken.expires_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
          </span>
        </div>

        <AnalyticsClient
          weddingProfits={profitRes.data ?? []}
          vendorScorecard={scorecardRes.data ?? []}
          dues={sanitizedDues}
          overdueDues={sanitizedOverdue}
          shareTokens={[]}
          isPublicView={true}
        />
      </div>
    );
  } catch (err: any) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        Failed to load executive briefing: {err?.message || "Unknown error"}
      </div>
    );
  }
}
