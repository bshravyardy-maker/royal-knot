"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Crown,
  FileSpreadsheet,
  Check,
  Minus,
  Star,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  Loader2,
  Plus,
  Coins,
  Building,
  Users,
  Calendar,
  ArrowLeft,
  X,
  HelpCircle,
} from "lucide-react";
import { DemoBadge } from "./DemoBadge";
import { AddQuoteModal } from "./AddQuoteModal";
import { awardQuoteAction } from "@/actions/quotes";
import { QuoteRequest, VendorQuote, Vendor } from "@/lib/types";

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

interface QuoteComparisonClientProps {
  quoteRequest: QuoteRequest;
  initialQuotes: VendorQuote[];
  vendorsList: Vendor[];
}

export function QuoteComparisonClient({
  quoteRequest,
  initialQuotes,
  vendorsList,
}: QuoteComparisonClientProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<VendorQuote[]>(initialQuotes);
  const [requestStatus, setRequestStatus] = useState(quoteRequest.status);
  const [awardedQuoteId, setAwardedQuoteId] = useState(quoteRequest.awarded_quote_id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmQuoteToAward, setConfirmQuoteToAward] = useState<VendorQuote | null>(null);
  const [isAwarding, setIsAwarding] = useState(false);
  const [awardError, setAwardError] = useState<string | null>(null);
  const [awardSuccessMsg, setAwardSuccessMsg] = useState<string | null>(null);

  const isRequestClosed = requestStatus === "Closed" || requestStatus === "Awarded";

  // Calculate lowest total among submitted or active quotes
  const validTotals = quotes.map((q) => Number(q.total || q.amount || 0)).filter((t) => t > 0);
  const lowestTotal = validTotals.length > 0 ? Math.min(...validTotals) : null;

  // Collect all unique inclusions across quotes
  const allInclusions = Array.from(
    new Set(
      quotes.flatMap((q) => (Array.isArray(q.inclusions) ? q.inclusions : []))
    )
  );

  async function handleConfirmAward() {
    if (!confirmQuoteToAward) return;
    setIsAwarding(true);
    setAwardError(null);
    setAwardSuccessMsg(null);

    try {
      const res = await awardQuoteAction(confirmQuoteToAward.id);

      if (!res.success) {
        setAwardError(res.error || "Failed to award quote.");
        setIsAwarding(false);
      } else {
        // Update local state
        setAwardedQuoteId(confirmQuoteToAward.id);
        setRequestStatus("Closed");
        setQuotes((prev) =>
          prev.map((q) => {
            if (q.id === confirmQuoteToAward.id) {
              return { ...q, status: "Awarded" };
            }
            return { ...q, status: "Closed" };
          })
        );
        setAwardSuccessMsg(
          `Contract successfully awarded to ${confirmQuoteToAward.vendor?.name || "Vendor"}! Sibling quotes have been closed.`
        );
        setIsAwarding(false);
        setConfirmQuoteToAward(null);
      }
    } catch (err: any) {
      setAwardError(err.message || "An unexpected error occurred while awarding.");
      setIsAwarding(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Link href="/vendor-quotes" className="hover:underline">
              Vendor Quotes
            </Link>
            <span>/</span>
            <span>RFP Tender Comparison</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy">
              {quoteRequest.category}
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                isRequestClosed
                  ? "bg-purple-50 text-purple-800 border-purple-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {isRequestClosed ? "Awarded / Closed" : "Open for Quotes"}
            </span>
            {quoteRequest.is_demo ? <DemoBadge /> : null}
          </div>
          <p className="text-xs sm:text-sm text-navy/70 mt-1">
            {quoteRequest.wedding?.title} • {quoteRequest.guest_count} Guests • {quotes.length} Quotes Received
          </p>
        </div>

        {/* Action Button */}
        <div>
          {!isRequestClosed ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-gold text-xs sm:text-sm py-2 px-4 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vendor Quote</span>
            </button>
          ) : (
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold">
              <Crown className="w-4 h-4 text-gold-dark" />
              <span>Tender Completed & Awarded</span>
            </div>
          )}
        </div>
      </div>

      {awardSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{awardSuccessMsg}</span>
        </div>
      )}

      {awardError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{awardError}</span>
        </div>
      )}

      {/* Scope Card */}
      {quoteRequest.scope_description && (
        <div className="royal-card p-4 text-xs bg-ivory/50 border border-[#C6A46A]/20">
          <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">
            Published Palatial Scope
          </span>
          <p className="text-navy/80 leading-relaxed">{quoteRequest.scope_description}</p>
        </div>
      )}

      {/* Quotes Side-by-Side Comparison Matrix */}
      {quotes.length === 0 ? (
        <div className="royal-card p-12 text-center">
          <FileSpreadsheet className="w-12 h-12 text-gold/60 mx-auto mb-3" />
          <h3 className="text-lg font-serif font-bold text-navy">
            No quotations submitted yet
          </h3>
          <p className="text-xs text-navy/60 max-w-sm mx-auto mt-1 mb-5">
            Log quotations from your artisan vendor network to compare pricing per plate, total budget, overtime rates, and inclusions.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-gold text-xs py-2 px-4 inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Quote</span>
          </button>
        </div>
      ) : (
        <div className="royal-card p-6 overflow-x-auto shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-serif font-bold text-navy">
                Side-by-Side Rate Card & Inclusions Comparison
              </h3>
              <p className="text-xs text-navy/60">
                Aligned comparison across all submitted proposals for {quoteRequest.guest_count} guests
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              {/* Row 1: Vendor Header */}
              <tr className="border-b-2 border-gray-200">
                <th className="py-4 px-4 w-52 text-xs font-bold uppercase text-navy/60 bg-gray-50/50">
                  Vendor Partner
                </th>
                {quotes.map((q) => {
                  const isAwarded = q.status === "Awarded" || q.id === awardedQuoteId;
                  const isClosed = q.status === "Closed" && !isAwarded;

                  return (
                    <th
                      key={q.id}
                      className={`py-4 px-4 align-top text-left transition-all ${
                        isAwarded
                          ? "bg-amber-50/80 border-2 border-gold rounded-t-xl"
                          : isClosed
                          ? "bg-gray-100/60 opacity-60"
                          : "bg-white"
                      }`}
                    >
                      {isAwarded && (
                        <div className="inline-flex items-center space-x-1 bg-gold text-navy text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 shadow-sm">
                          <Crown className="w-3 h-3 text-white" />
                          <span>Winner / Awarded</span>
                        </div>
                      )}
                      <h4 className="text-base font-serif font-bold text-navy">
                        {q.vendor?.name || "Vendor"}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-gray-500 font-sans font-normal">
                        <span>{q.vendor?.city}</span>
                        {q.vendor?.rating && (
                          <span className="flex items-center text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                            {Number(q.vendor.rating).toFixed(1)}
                          </span>
                        )}
                        {q.is_demo ? <DemoBadge /> : null}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs font-medium">
              {/* Row 2: Price Per Plate */}
              <tr className="hover:bg-ivory/30">
                <td className="py-3 px-4 font-semibold text-gray-500 bg-gray-50/40">
                  Price Per Plate
                </td>
                {quotes.map((q) => {
                  const isAwarded = q.status === "Awarded" || q.id === awardedQuoteId;
                  return (
                    <td
                      key={q.id}
                      className={`py-3 px-4 text-sm font-semibold text-navy ${
                        isAwarded ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {q.price_per_plate > 0
                        ? `₹${Number(q.price_per_plate).toLocaleString("en-IN")}`
                        : "Fixed Package"}
                    </td>
                  );
                })}
              </tr>

              {/* Row 3: Total for Guest Count (Lowest Total Highlighted) */}
              <tr className="hover:bg-ivory/30 border-y-2 border-gold/20 bg-ivory/20">
                <td className="py-3.5 px-4 font-bold text-navy bg-gray-50/60">
                  Total Valuation ({quoteRequest.guest_count} guests)
                </td>
                {quotes.map((q) => {
                  const totalVal = Number(q.total || q.amount || 0);
                  const isLowest = lowestTotal !== null && totalVal === lowestTotal;
                  const isAwarded = q.status === "Awarded" || q.id === awardedQuoteId;

                  return (
                    <td
                      key={q.id}
                      className={`py-3.5 px-4 ${isAwarded ? "bg-amber-50/60" : ""}`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-base font-serif font-bold text-navy">
                          {formatINR(totalVal)}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          ₹{totalVal.toLocaleString("en-IN")}
                        </span>
                        {isLowest && (
                          <span className="inline-flex items-center text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full mt-1 border border-emerald-300">
                            ★ Lowest Total
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 4: Extra-Hour Overtime Rate */}
              <tr className="hover:bg-ivory/30">
                <td className="py-3 px-4 font-semibold text-gray-500 bg-gray-50/40">
                  Extra-Hour Overtime
                </td>
                {quotes.map((q) => {
                  const isAwarded = q.status === "Awarded" || q.id === awardedQuoteId;
                  return (
                    <td
                      key={q.id}
                      className={`py-3 px-4 text-navy/80 ${isAwarded ? "bg-amber-50/40" : ""}`}
                    >
                      {q.extra_hour_rate > 0
                        ? `₹${Number(q.extra_hour_rate).toLocaleString("en-IN")} / hr`
                        : "Included"}
                    </td>
                  );
                })}
              </tr>

              {/* Inclusions Header */}
              <tr className="bg-gray-100/70">
                <td
                  colSpan={quotes.length + 1}
                  className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-navy"
                >
                  Deliverables & Inclusions Checklist
                </td>
              </tr>

              {/* Inclusions Rows */}
              {allInclusions.length === 0 ? (
                <tr>
                  <td className="py-3 px-4 text-gray-400 italic" colSpan={quotes.length + 1}>
                    No custom inclusions specified.
                  </td>
                </tr>
              ) : (
                allInclusions.map((inclusion) => (
                  <tr key={inclusion} className="hover:bg-ivory/30">
                    <td className="py-2.5 px-4 text-navy/80 bg-gray-50/40 font-normal">
                      {inclusion}
                    </td>
                    {quotes.map((q) => {
                      const hasInc = Array.isArray(q.inclusions) && q.inclusions.includes(inclusion);
                      const isAwarded = q.status === "Awarded" || q.id === awardedQuoteId;

                      return (
                        <td
                          key={q.id}
                          className={`py-2.5 px-4 ${isAwarded ? "bg-amber-50/40" : ""}`}
                        >
                          {hasInc ? (
                            <span className="inline-flex items-center text-emerald-700 font-bold">
                              <Check className="w-4 h-4 mr-1 text-emerald-600" />
                              <span className="text-[11px]">Included</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-gray-400">
                              <Minus className="w-4 h-4 mr-1 text-gray-300" />
                              <span className="text-[11px]">—</span>
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}

              {/* Row: Technical Notes */}
              <tr className="hover:bg-ivory/30">
                <td className="py-3 px-4 font-semibold text-gray-500 bg-gray-50/40">
                  Proposer Notes
                </td>
                {quotes.map((q) => {
                  const isAwarded = q.status === "Awarded" || q.id === awardedQuoteId;
                  return (
                    <td
                      key={q.id}
                      className={`py-3 px-4 text-[11px] text-gray-600 ${
                        isAwarded ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {q.notes || "Standard terms apply."}
                    </td>
                  );
                })}
              </tr>

              {/* Row: Award Action */}
              <tr className="bg-gray-50/80">
                <td className="py-4 px-4 font-bold text-navy">Award Decision</td>
                {quotes.map((q) => {
                  const isAwarded = q.status === "Awarded" || q.id === awardedQuoteId;
                  const isClosed = q.status === "Closed" && !isAwarded;

                  return (
                    <td
                      key={q.id}
                      className={`py-4 px-4 ${isAwarded ? "bg-amber-50/80 rounded-b-xl" : ""}`}
                    >
                      {isAwarded ? (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs inline-flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Awarded Winner</span>
                        </div>
                      ) : isClosed || isRequestClosed ? (
                        <span className="text-gray-400 text-xs italic">
                          Tender Closed
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmQuoteToAward(q)}
                          className="btn-gold text-xs py-2 px-3.5 inline-flex items-center space-x-1.5 shadow-sm"
                        >
                          <Crown className="w-3.5 h-3.5 text-white" />
                          <span>Award This Quote</span>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog Modal for Awarding */}
      {confirmQuoteToAward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-card shadow-elevated border border-[#C6A46A]/30 overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-gold">
              <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center">
                <Crown className="w-5 h-5 text-gold-dark" />
              </div>
              <h3 className="text-lg font-serif font-bold text-navy">
                Confirm Quote Award
              </h3>
            </div>

            <p className="text-xs text-navy/80 leading-relaxed">
              Are you sure you want to award this contract to{" "}
              <strong className="text-navy">{confirmQuoteToAward.vendor?.name}</strong> for{" "}
              <strong>₹{Number(confirmQuoteToAward.total || 0).toLocaleString("en-IN")}</strong>?
            </p>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <strong>Notice:</strong> All other competing quotes for this request will be automatically closed, and this vendor will be added to the official wedding roster.
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setConfirmQuoteToAward(null)}
                disabled={isAwarding}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-navy hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAward}
                disabled={isAwarding}
                className="btn-gold text-xs py-2 px-4 flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isAwarding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Award...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5 text-white" />
                    <span>Confirm & Award Contract</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Quote Modal */}
      <AddQuoteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        quoteRequestId={quoteRequest.id}
        guestCount={quoteRequest.guest_count}
        category={quoteRequest.category}
        vendorsList={vendorsList}
        onQuoteAdded={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
