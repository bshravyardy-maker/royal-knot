"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Coins,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { recordBookingDepositAction } from "@/actions/enquiries";

interface RecordDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: {
    id: string;
    couple_name: string;
    budget: number;
    city: string;
    package: string;
  };
}

export function RecordDepositModal({
  isOpen,
  onClose,
  enquiry,
}: RecordDepositModalProps) {
  const router = useRouter();
  // Default deposit to 25% of total budget
  const budgetNum = Number(enquiry.budget) || 0;
  const defaultDeposit = Math.round(budgetNum * 0.25);
  const [depositAmount, setDepositAmount] = useState(defaultDeposit > 0 ? defaultDeposit.toString() : "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    budgetNum <= 0
      ? "Cannot record deposit: Enquiry has no budget or budget is zero. A positive budget is required to establish wedding contract value."
      : null
  );

  if (!isOpen) return null;

  const currentDepositNum = Number(depositAmount) || 0;
  const remaining = Math.max(0, budgetNum - currentDepositNum);
  const advanceAmount = Math.round(remaining / 2);
  const finalAmount = remaining - advanceAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (budgetNum <= 0) {
      setError(
        "Cannot record deposit: Enquiry has no budget or budget is zero. A positive budget is required to establish wedding contract value."
      );
      return;
    }

    if (currentDepositNum <= 0) {
      setError("Deposit amount must be greater than 0.");
      return;
    }

    if (currentDepositNum > budgetNum) {
      setError("Deposit amount cannot exceed total agreed budget.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await recordBookingDepositAction(enquiry.id, currentDepositNum);

      if (!res.success) {
        setError(res.error || "Failed to record booking deposit.");
        setIsLoading(false);
      } else if (res.data?.weddingId) {
        // Successful deposit! Redirect directly to the newly generated wedding
        router.push(`/weddings/${res.data.weddingId}`);
      } else {
        router.push("/weddings");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-card shadow-elevated border border-[#C6A46A]/30 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-navy flex items-center justify-between border-b border-[#C6A46A]/20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                Record Booking Deposit
              </h3>
              <p className="text-xs text-ivory/70">
                Confirm reservation and activate palatial wedding run-sheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ivory/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Deposit Transaction Rejected:</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-ivory/60 border border-[#C6A46A]/20 space-y-2 text-xs">
            <div className="flex items-center justify-between text-navy/70">
              <span>Client Couple</span>
              <strong className="text-navy">{enquiry.couple_name}</strong>
            </div>
            <div className="flex items-center justify-between text-navy/70">
              <span>Agreed Total Valuation</span>
              <strong className="text-navy">₹{(Number(enquiry.budget) || 0).toLocaleString("en-IN")}</strong>
            </div>
            <div className="flex items-center justify-between text-navy/70">
              <span>Package Tier</span>
              <strong className="text-gold-dark">{enquiry.package}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
              Booking Deposit Amount (INR ₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                ₹
              </span>
              <input
                type="number"
                min="100000"
                step="50000"
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm font-semibold text-navy"
              />
            </div>
            <span className="text-[11px] text-gray-500 mt-1 block">
              Standard 25% initial booking milestone: ₹{(currentDepositNum / 100000).toFixed(2)} Lakhs
            </span>
          </div>

          {/* Computed 3-Stage Milestone Split Preview */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy/70 block">
              Automated 3-Stage Milestone Projection
            </span>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">
                  1. Booking (Paid)
                </span>
                <span className="text-xs font-bold text-emerald-900 mt-0.5 block">
                  ₹{currentDepositNum.toLocaleString("en-IN")}
                </span>
                <span className="text-[9px] text-emerald-600 block">Today</span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-[10px] text-amber-700 font-bold uppercase block">
                  2. Advance (50%)
                </span>
                <span className="text-xs font-bold text-amber-900 mt-0.5 block">
                  ₹{advanceAmount.toLocaleString("en-IN")}
                </span>
                <span className="text-[9px] text-amber-600 block">Wedding -30d</span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-[10px] text-gray-600 font-bold uppercase block">
                  3. Final (50%)
                </span>
                <span className="text-xs font-bold text-gray-800 mt-0.5 block">
                  ₹{finalAmount.toLocaleString("en-IN")}
                </span>
                <span className="text-[9px] text-gray-500 block">Wedding +7d</span>
              </div>
            </div>
          </div>

          {/* Transaction Notice */}
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-blue-900 text-[11px] flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>
              Executing deposit activates the wedding in the database, sets enquiry to <strong>Won</strong>, generates all package task templates, and assigns team leads.
            </span>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-navy hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold text-xs py-2 px-4 flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing Transaction...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Confirm Deposit & Activate Wedding</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
