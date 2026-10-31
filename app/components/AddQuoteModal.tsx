"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  Coins,
  CheckSquare,
  Square,
  Plus,
} from "lucide-react";
import { addVendorQuoteAction } from "@/actions/quotes";
import { Vendor } from "@/lib/types";

interface AddQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteRequestId: string;
  guestCount: number;
  category: string;
  vendorsList: Vendor[];
  onQuoteAdded?: () => void;
}

const COMMON_INCLUSIONS = [
  "Silver Thali Service",
  "Royal Welcome Drinks",
  "Live Chaat Counter",
  "24k Gold Foil Sweets",
  "Jain Dedicated Kitchen",
  "Midnight Snack Bar",
  "Artisan Mocktail Bar",
  "Drone Aerials & Cinema",
  "Imported Tuberose Mandap",
  "Palace Illumination Setup",
  "Vintage Carriage Escort",
];

export function AddQuoteModal({
  isOpen,
  onClose,
  quoteRequestId,
  guestCount,
  category,
  vendorsList,
  onQuoteAdded,
}: AddQuoteModalProps) {
  const [vendorId, setVendorId] = useState(vendorsList[0]?.id || "");
  const [pricePerPlate, setPricePerPlate] = useState("3200");
  const [extraHourRate, setExtraHourRate] = useState("25000");
  const [selectedInclusions, setSelectedInclusions] = useState<string[]>([
    "Silver Thali Service",
    "Royal Welcome Drinks",
    "Live Chaat Counter",
  ]);
  const [customInclusion, setCustomInclusion] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPriceNum = Number(pricePerPlate) || 0;
  const computedTotal = currentPriceNum * (guestCount || 400);

  function toggleInclusion(inc: string) {
    setSelectedInclusions((prev) =>
      prev.includes(inc) ? prev.filter((i) => i !== inc) : [...prev, inc]
    );
  }

  function handleAddCustomInclusion() {
    if (!customInclusion.trim()) return;
    if (!selectedInclusions.includes(customInclusion.trim())) {
      setSelectedInclusions((prev) => [...prev, customInclusion.trim()]);
    }
    setCustomInclusion("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!vendorId) {
      setError("Please select a vendor.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await addVendorQuoteAction({
        quote_request_id: quoteRequestId,
        vendor_id: vendorId,
        price_per_plate: currentPriceNum,
        extra_hour_rate: Number(extraHourRate) || 0,
        inclusions: selectedInclusions,
        notes: notes || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to submit quote.");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        onClose();
        if (onQuoteAdded) onQuoteAdded();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-card shadow-elevated border border-[#C6A46A]/30 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-navy flex items-center justify-between border-b border-[#C6A46A]/20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                Submit Vendor Quotation
              </h3>
              <p className="text-xs text-ivory/70">
                Log a commercial proposal for {category} ({guestCount} guests)
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
              Select Vendor Partner *
            </label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-xs bg-white font-medium text-navy"
            >
              {vendorsList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.category} • {v.city} • {Number(v.rating).toFixed(1)} ★)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Price Per Plate (INR ₹) *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={pricePerPlate}
                onChange={(e) => setPricePerPlate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold font-medium text-navy text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Extra-Hour Overtime Rate (₹ / Hr)
              </label>
              <input
                type="number"
                min="0"
                step="2500"
                value={extraHourRate}
                onChange={(e) => setExtraHourRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold font-medium text-navy text-xs"
              />
            </div>
          </div>

          {/* Computed Total Preview Box */}
          <div className="p-4 rounded-xl bg-ivory/60 border border-[#C6A46A]/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-semibold block">
                Calculated Total for {guestCount} Guests
              </span>
              <span className="text-xl font-serif font-bold text-navy">
                ₹{computedTotal.toLocaleString("en-IN")}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#8C7142] bg-[#F5EEDF] px-2.5 py-1 rounded-full border border-gold/30">
              ₹{currentPriceNum} × {guestCount} guests
            </span>
          </div>

          {/* Inclusions Checkboxes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-2">
              Deliverables & Inclusions Checklist
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
              {COMMON_INCLUSIONS.map((inc) => {
                const isChecked = selectedInclusions.includes(inc);
                return (
                  <button
                    type="button"
                    key={inc}
                    onClick={() => toggleInclusion(inc)}
                    className="flex items-center space-x-2 text-left py-1 text-xs hover:text-navy transition-colors text-navy/80"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={isChecked ? "font-semibold text-navy" : "text-gray-600"}>
                      {inc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom inclusion input */}
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="text"
                placeholder="Add custom inclusion item..."
                value={customInclusion}
                onChange={(e) => setCustomInclusion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomInclusion();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-gold text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomInclusion}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-navy font-semibold rounded-lg text-xs"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
              Quotation Terms & Technical Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Copper vessels, live cooking stations, includes setup & cleanup staff..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 font-medium text-gray-600 hover:text-navy hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold py-2 px-4 flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Quote</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
