"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  Calendar,
  Users,
  Building,
} from "lucide-react";
import { createQuoteRequestAction } from "@/actions/quotes";

interface WeddingOption {
  id: string;
  title: string;
  guest_count: number;
}

interface NewQuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingsList: WeddingOption[];
  preselectedWeddingId?: string;
}

export function NewQuoteRequestModal({
  isOpen,
  onClose,
  weddingsList,
  preselectedWeddingId,
}: NewQuoteRequestModalProps) {
  const router = useRouter();
  const [weddingId, setWeddingId] = useState(preselectedWeddingId || (weddingsList[0]?.id || ""));
  const [category, setCategory] = useState("Catering & Royal Feasts");
  const [guestCount, setGuestCount] = useState("400");
  const [deadline, setDeadline] = useState("");
  const [scopeDescription, setScopeDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically update default guest count when wedding selection changes
  useEffect(() => {
    if (weddingId) {
      const selected = weddingsList.find((w) => w.id === weddingId);
      if (selected && selected.guest_count) {
        setGuestCount(selected.guest_count.toString());
      }
    }
  }, [weddingId, weddingsList]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!weddingId) {
      setError("Please select a palatial wedding.");
      return;
    }
    const guests = Number(guestCount);
    if (!guests || guests <= 0) {
      setError("Please provide a valid guest count.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await createQuoteRequestAction({
        wedding_id: weddingId,
        category,
        guest_count: guests,
        scope_description: scopeDescription || undefined,
        requested_deadline: deadline || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to create quote request.");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        onClose();
        if (res.data?.id) {
          router.push(`/vendor-quotes/${res.data.id}`);
        }
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
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                Publish Quote Request (RFP)
              </h3>
              <p className="text-xs text-ivory/70">
                Tender vendor proposals across palatial specifications
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
              Destination Wedding *
            </label>
            <select
              value={weddingId}
              onChange={(e) => setWeddingId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-xs bg-white font-medium text-navy"
            >
              {weddingsList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} ({w.guest_count} guests)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Vendor Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-xs bg-white font-medium text-navy"
              >
                <option value="Catering & Royal Feasts">Catering & Royal Feasts</option>
                <option value="Decor & Florals">Decor & Florals</option>
                <option value="Photography & Cinematography">Photography & Cinematography</option>
                <option value="Entertainment & Folk Artists">Entertainment & Folk Artists</option>
                <option value="Hospitality & Royal Fleet">Hospitality & Royal Fleet</option>
                <option value="Bridal Styling & Henna">Bridal Styling & Henna</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Guest Count (Auto-defaulted) *
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="50"
                  max="3000"
                  required
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-xs font-medium text-navy"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
              Bidding Submission Deadline
            </label>
            <div className="relative">
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-xs font-medium text-navy"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
              Scope of Work & Palatial Requirements
            </label>
            <textarea
              rows={3}
              value={scopeDescription}
              onChange={(e) => setScopeDescription(e.target.value)}
              placeholder="e.g. Authentic silver thali banquet, 42 Rajasthani dishes, live cooking stations in the palace courtyard, Jain dining counters..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-xs text-navy"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
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
                  <span>Publishing RFP...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Quote Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
