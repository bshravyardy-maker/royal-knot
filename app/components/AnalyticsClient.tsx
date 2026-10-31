"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Layers,
  Sparkles,
  PieChart,
  Calendar,
} from "lucide-react";
import { DemoBadge } from "./DemoBadge";
import { createShareLink, revokeShareLink } from "@/actions/analytics";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = any;

const inr = (n: number) => {
  const a = Math.abs(n || 0);
  const s =
    a >= 1e7
      ? (a / 1e7).toFixed(2) + " Cr"
      : a >= 1e5
      ? (a / 1e5).toFixed(2) + " L"
      : a.toLocaleString("en-IN");
  return (n < 0 ? "-" : "") + "₹" + s;
};

interface AnalyticsClientProps {
  weddingProfits: Row[];
  vendorScorecard: Row[];
  dues: Row[];
  overdueDues?: Row[];
  shareTokens: Row[];
  isPublicView?: boolean;
}

export function AnalyticsClient({
  weddingProfits,
  vendorScorecard,
  dues,
  overdueDues = [],
  shareTokens,
  isPublicView = false,
}: AnalyticsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Profit per wedding: sort worst to best (lowest profit first)
  const sortedProfits = [...weddingProfits].sort((a, b) => Number(a.profit || 0) - Number(b.profit || 0));

  // Season totals
  const totalRevenue = weddingProfits.reduce((sum, w) => sum + Number(w.revenue_total || 0), 0);
  const totalVendorCost = weddingProfits.reduce((sum, w) => sum + Number(w.vendor_cost || 0), 0);
  const totalAbsorbed = weddingProfits.reduce((sum, w) => sum + Number(w.absorbed_extras || 0), 0);
  const totalTeamCost = weddingProfits.reduce((sum, w) => sum + Number(w.team_cost || 0), 0);
  const totalNetProfit = totalRevenue - totalVendorCost - totalAbsorbed - totalTeamCost;
  const overallMargin = totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  // Dues split
  const moneyIn = dues.filter((d) => d.direction === "in");
  const moneyOut = dues.filter((d) => d.direction === "out");
  const totalMoneyIn = moneyIn.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalMoneyOut = moneyOut.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const netCashflow30 = totalMoneyIn - totalMoneyOut;

  function handleCreateShareLink() {
    startTransition(async () => {
      const res = await createShareLink();
      if (!res.ok) {
        setFeedback({ type: "err", msg: res.error || "Failed to create link" });
      } else {
        setFeedback({ type: "ok", msg: res.message || "Executive share link generated" });
        router.refresh();
      }
    });
  }

  function handleRevokeToken(token: string) {
    startTransition(async () => {
      const res = await revokeShareLink(token);
      if (!res.ok) {
        setFeedback({ type: "err", msg: res.error || "Failed to revoke link" });
      } else {
        setFeedback({ type: "ok", msg: "Share link revoked" });
        router.refresh();
      }
    });
  }

  function copyToClipboard(url: string, token: string) {
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}${url}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2500);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <PieChart className="w-4 h-4 text-gold" />
            <span>{isPublicView ? "Executive Public Briefing" : "Palace Treasury & Founder Intelligence"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy">
            {isPublicView ? "Executive Performance Summary" : "Founder Analytics & Profitability"}
          </h1>
          <p className="text-xs text-navy/70 mt-1">
            Reconciled unit economics, vendor performance ratings, and 30-day liquidity forecast.
          </p>
        </div>

        {/* Share Link Generation (Hidden in public view) */}
        {!isPublicView && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateShareLink}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-navy font-semibold text-xs shadow-subtle flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <Share2 className="w-4 h-4 text-navy" />
              <span>{isPending ? "Generating..." : "Generate Share Link"}</span>
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            feedback.type === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="font-bold opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Season Totals Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="royal-card p-4 border-l-4 border-l-navy">
          <div className="text-[11px] font-bold uppercase text-gray-500">Season Revenue</div>
          <div className="text-xl font-serif font-bold text-navy mt-1">{inr(totalRevenue)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Contract + Extras</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-amber-500">
          <div className="text-[11px] font-bold uppercase text-gray-500">Vendor Costs</div>
          <div className="text-xl font-serif font-bold text-amber-700 mt-1">{inr(totalVendorCost)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Billed or Agreed</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-purple-500">
          <div className="text-[11px] font-bold uppercase text-gray-500">Absorbed Extras</div>
          <div className="text-xl font-serif font-bold text-purple-700 mt-1">{inr(totalAbsorbed)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Agency concessions</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-blue-500">
          <div className="text-[11px] font-bold uppercase text-gray-500">Team Cost</div>
          <div className="text-xl font-serif font-bold text-blue-700 mt-1">{inr(totalTeamCost)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Logged hours</div>
        </div>

        <div className={`royal-card p-4 border-l-4 ${totalNetProfit >= 0 ? "border-l-emerald-600 bg-emerald-50/20" : "border-l-red-600 bg-red-50/20"}`}>
          <div className="text-[11px] font-bold uppercase text-gray-500">Net Profit</div>
          <div className={`text-xl font-serif font-bold mt-1 ${totalNetProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            {inr(totalNetProfit)}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Bottom line</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-gold">
          <div className="text-[11px] font-bold uppercase text-gray-500">Operating Margin</div>
          <div className="text-xl font-serif font-bold text-gold-dark mt-1">{overallMargin}%</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Avg across season</div>
        </div>
      </div>

      {/* Active Share Links Strip (Only in founder view) */}
      {!isPublicView && shareTokens.length > 0 && (
        <div className="p-4 rounded-xl bg-ivory/80 border border-[#C6A46A]/30 space-y-2">
          <div className="text-xs font-bold text-navy flex items-center space-x-1.5">
            <Share2 className="w-3.5 h-3.5 text-gold" />
            <span>Active Executive Read-Only Share Links ({shareTokens.filter((t) => !t.revoked).length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {shareTokens.map((t) => {
              const isExpired = new Date(t.expires_at).getTime() < Date.now();
              const isInactive = t.revoked || isExpired;
              const sharePath = `/share/${t.token}`;

              return (
                <div
                  key={t.id || t.token}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                    isInactive ? "bg-gray-100 border-gray-200 text-gray-400" : "bg-white border-[#e8e3d8] text-navy"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-mono text-[11px] font-medium truncate max-w-[150px]">{t.token}</span>
                    {t.revoked ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700">Revoked</span>
                    ) : isExpired ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700">Expired</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">Active</span>
                    )}
                  </div>

                  {!isInactive && (
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => copyToClipboard(sharePath, t.token)}
                        className="p-1 text-gray-600 hover:text-gold transition-colors flex items-center space-x-1"
                        title="Copy Share URL"
                      >
                        {copiedToken === t.token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{copiedToken === t.token ? "Copied" : "Copy"}</span>
                      </button>
                      <Link
                        href={sharePath}
                        target="_blank"
                        className="p-1 text-gray-600 hover:text-navy transition-colors"
                        title="Open view"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleRevokeToken(t.token)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        title="Revoke link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profit per Wedding (Sorted Worst to Best) */}
      <div className="royal-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-navy flex items-center space-x-2">
              <span>Wedding Profitability Ledger</span>
              <span className="text-xs font-sans font-normal text-gray-500">(Ranked Worst to Best)</span>
            </h2>
            <p className="text-xs text-gray-500">
              True net profit after vendor settlement, unbilled absorbed client concessions, and team labour.
            </p>
          </div>
        </div>

        {sortedProfits.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">No wedding profit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#C6A46A]/20 text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                  <th className="pb-3 pl-2">Wedding</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Revenue</th>
                  <th className="pb-3 text-right">Vendor Cost</th>
                  <th className="pb-3 text-right">Absorbed</th>
                  <th className="pb-3 text-right">Team Cost</th>
                  <th className="pb-3 text-right">Net Profit</th>
                  <th className="pb-3 text-right">Margin</th>
                  <th className="pb-3 text-center">Status / Driver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {sortedProfits.map((w) => {
                  const isLoss = Number(w.profit || 0) < 0;

                  return (
                    <tr
                      key={w.wedding_id}
                      className={`hover:bg-ivory/60 transition-colors ${
                        isLoss ? "bg-red-50/40 text-red-950 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3.5 pl-2">
                        <div className="font-serif text-sm font-bold text-navy">{w.wedding_title}</div>
                        <div className="text-[10px] text-gray-400">{w.city}</div>
                      </td>
                      <td className="py-3.5 text-gray-500">
                        {w.wedding_date ? new Date(w.wedding_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                      </td>
                      <td className="py-3.5 text-right font-mono">{inr(w.revenue_total)}</td>
                      <td className="py-3.5 text-right font-mono text-amber-700">{inr(w.vendor_cost)}</td>
                      <td className="py-3.5 text-right font-mono text-purple-700">{inr(w.absorbed_extras)}</td>
                      <td className="py-3.5 text-right font-mono text-blue-700">{inr(w.team_cost)}</td>
                      <td className={`py-3.5 text-right font-mono font-bold ${isLoss ? "text-red-700" : "text-emerald-700"}`}>
                        {inr(w.profit)}
                      </td>
                      <td className="py-3.5 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${isLoss ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>
                          {w.margin_pct}%
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        {isLoss ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-sm animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-white" />
                            <span>Loss Driver: {w.loss_reason || "Cost Overrun"}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>Profitable</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vendor Scorecard & Dues in Next 30 Days (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendor Scorecard */}
        <div className="royal-card p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-serif font-bold text-navy flex items-center space-x-2">
              <Star className="w-5 h-5 text-gold fill-gold" />
              <span>Artisan Vendor Scorecard</span>
            </h3>
            <p className="text-xs text-gray-500">
              Tracked arrival punctuality, contract variance %, and engagement ratings.
            </p>
          </div>

          {vendorScorecard.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">No vendor scorecard data.</div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#C6A46A]/20 text-[11px] font-bold uppercase text-gray-500">
                    <th className="pb-2 pl-1">Vendor</th>
                    <th className="pb-2 text-center">Rating</th>
                    <th className="pb-2 text-center">Weddings</th>
                    <th className="pb-2 text-right">On-Time Rate</th>
                    <th className="pb-2 text-right">Bill Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {vendorScorecard.map((v) => {
                    const varianceNum = Number(v.avg_bill_variance_pct || 0);

                    return (
                      <tr key={v.vendor_id} className="hover:bg-ivory/60 transition-colors">
                        <td className="py-3 pl-1">
                          <div className="font-semibold text-navy">{v.vendor_name}</div>
                          <div className="text-[10px] text-gray-400">{v.category}</div>
                        </td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-gold/15 text-gold-dark font-bold text-[11px]">
                            <span>★</span>
                            <span>{v.rating}</span>
                          </span>
                        </td>
                        <td className="py-3 text-center font-mono">{v.weddings_count}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              Number(v.on_time_rate) >= 90
                                ? "bg-emerald-50 text-emerald-800"
                                : Number(v.on_time_rate) >= 70
                                ? "bg-amber-50 text-amber-800"
                                : "bg-red-50 text-red-800"
                            }`}
                          >
                            {v.on_time_rate}%
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              varianceNum > 5
                                ? "bg-red-50 text-red-800"
                                : varianceNum < 0
                                ? "bg-emerald-50 text-emerald-800"
                                : "text-gray-600"
                            }`}
                          >
                            {varianceNum > 0 ? `+${varianceNum}%` : `${varianceNum}%`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dues in Next 30 Days */}
        <div className="royal-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-navy flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gold" />
                <span>30-Day Liquidity Forecast</span>
              </h3>
              <p className="text-xs text-gray-500">
                Receivables from couples (In) vs Vendor disbursements (Out).
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-gray-400">Net 30-Day Flow</div>
              <div className={`font-mono text-sm font-bold ${netCashflow30 >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {inr(netCashflow30)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-[10px] font-bold uppercase text-emerald-800 flex items-center space-x-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                <span>Money In (Receivables)</span>
              </div>
              <div className="text-lg font-serif font-bold text-emerald-900 mt-0.5">{inr(totalMoneyIn)}</div>
              <div className="text-[10px] text-emerald-700">{moneyIn.length} upcoming milestones</div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-[10px] font-bold uppercase text-amber-800 flex items-center space-x-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                <span>Money Out (Payables)</span>
              </div>
              <div className="text-lg font-serif font-bold text-amber-900 mt-0.5">{inr(totalMoneyOut)}</div>
              <div className="text-[10px] text-amber-700">{moneyOut.length} vendor balances</div>
            </div>
          </div>

          {dues.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">No scheduled dues in the next 30 days.</div>
          ) : (
            <div className="overflow-x-auto flex-1 max-h-[320px] overflow-y-auto pr-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#C6A46A]/20 text-[10px] font-bold uppercase text-gray-500">
                    <th className="pb-2 pl-1">Flow</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Due Date</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {dues.map((d) => {
                    const isIn = d.direction === "in";

                    return (
                      <tr key={`${d.direction}-${d.id}`} className="hover:bg-ivory/60 transition-colors">
                        <td className="py-2.5 pl-1">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isIn ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isIn ? "IN" : "OUT"}
                          </span>
                        </td>
                        <td className="py-2.5 max-w-[200px] truncate">
                          <div className="font-semibold text-navy truncate">{d.title}</div>
                          <div className="text-[10px] text-gray-400 truncate">{d.counterparty}</div>
                        </td>
                        <td className="py-2.5 text-gray-500 whitespace-nowrap">
                          {d.due_date ? new Date(d.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "-"}
                        </td>
                        <td className={`py-2.5 text-right font-mono font-bold ${isIn ? "text-emerald-700" : "text-amber-800"}`}>
                          {inr(d.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Overdue Obligations */}
        {overdueDues.length > 0 && (
          <div className="royal-card p-6 flex flex-col border-2 border-red-400 bg-red-50/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-red-800 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>Overdue Obligations</span>
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-300">
                    {overdueDues.length}
                  </span>
                </h3>
                <p className="text-xs text-red-600/80 mt-0.5">
                  Payments past their due date — action required.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto flex-1 max-h-[280px] overflow-y-auto pr-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-red-200 text-[10px] font-bold uppercase text-red-700">
                    <th className="pb-2 pl-1">Flow</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Due Date</th>
                    <th className="pb-2 text-center">Days Late</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100 font-medium">
                  {overdueDues.map((d) => {
                    const isIn = d.direction === "in";
                    return (
                      <tr key={`overdue-${d.direction}-${d.id}`} className="hover:bg-red-50/40 transition-colors">
                        <td className="py-2.5 pl-1">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isIn ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isIn ? "IN" : "OUT"}
                          </span>
                        </td>
                        <td className="py-2.5 max-w-[180px] truncate">
                          <div className="font-semibold text-navy truncate">{d.title}</div>
                          <div className="text-[10px] text-gray-400 truncate">{d.counterparty}</div>
                        </td>
                        <td className="py-2.5 text-gray-500 whitespace-nowrap">
                          {d.due_date ? new Date(d.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "-"}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] border border-red-200">
                            {d.days_overdue ?? "—"} days
                          </span>
                        </td>
                        <td className={`py-2.5 text-right font-mono font-bold text-red-700`}>
                          {inr(d.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
