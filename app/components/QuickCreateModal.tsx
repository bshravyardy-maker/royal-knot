"use client";

import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createEnquiryAction } from "@/actions/enquiries";

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickCreateModal({ isOpen, onClose, onSuccess }: QuickCreateModalProps) {
  const [coupleName, setCoupleName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [city, setCity] = useState("Jaipur");
  const [guests, setGuests] = useState("400");
  const [budget, setBudget] = useState("5000000"); // 50 Lakhs default
  const [packageType, setPackageType] = useState("Full-Service");
  const [theme, setTheme] = useState("Palace Romance");
  const [source, setSource] = useState("Instagram");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Basic frontend checks
    if (!coupleName.trim()) {
      setError("Please provide couple names (e.g. 'Aarav & Meera').");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number with at least 10 digits.");
      return;
    }
    if (!guests || Number(guests) < 1) {
      setError("Please enter a valid guest count.");
      return;
    }
    if (!budget || Number(budget) <= 0) {
      setError("Please specify an estimated maximum budget.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await createEnquiryAction({
        couple_name: coupleName,
        phone,
        email: email || undefined,
        wedding_date: weddingDate || undefined,
        city,
        guests: Number(guests),
        budget: Number(budget),
        package: packageType,
        theme,
        source,
        notes: notes || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to create enquiry.");
      } else {
        setSuccessMessage(res.message || "Enquiry registered successfully!");
        setTimeout(() => {
          setIsLoading(false);
          setCoupleName("");
          setPhone("");
          setEmail("");
          setWeddingDate("");
          setNotes("");
          setSuccessMessage(null);
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-card shadow-elevated border border-[#C6A46A]/30 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-navy flex items-center justify-between border-b border-[#C6A46A]/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#C6A46A]/20 flex items-center justify-center text-gold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold text-white tracking-wide">
                New Royal Wedding Enquiry
              </h3>
              <p className="text-xs text-ivory/70">
                Register a luxury prospective couple for Jaipur or Udaipur
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1">
                Couple Names *
              </label>
              <input
                type="text"
                required
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="e.g. Ranveer Rathore & Deepika Sen"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="couple@domain.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1">
                Rough Wedding Date
              </label>
              <input
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1">
                Destination City *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm bg-white"
              >
                <option value="Jaipur">Jaipur (Pink City Palaces)</option>
                <option value="Udaipur">Udaipur (Lake Palace & Jagmandir)</option>
                <option value="Jodhpur">Jodhpur (Umaid Bhawan)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1">
                Package Interest *
              </label>
              <select
                value={packageType}
                onChange={(e) => setPackageType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm bg-white"
              >
                <option value="Full-Service">Full-Service Royal Wedding</option>
                <option value="Partial / Day-of">Partial / Day-of Management</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1">
                Estimated Guests *
              </label>
              <input
                type="number"
                min="50"
                max="2500"
                step="25"
                required
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1">
                Maximum Budget (₹ INR) *
              </label>
              <input
                type="number"
                min="1000000"
                step="500000"
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                ₹{(Number(budget) / 100000).toLocaleString("en-IN")} Lakhs
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1">
                Aesthetic Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm bg-white"
              >
                <option value="Palace Romance">Palace Romance (Ivory & Gold Florals)</option>
                <option value="Heritage Rajputana">Heritage Rajputana (Mughal Courtyards & Torches)</option>
                <option value="Lakeside Sufi">Lakeside Sufi & Candlelit Jagmandir</option>
                <option value="Contemporary Royal">Contemporary Royal Fusion</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1">
                Lead Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm bg-white"
              >
                <option value="Instagram">Instagram Luxury Bridal</option>
                <option value="Referral">Private Royalty Referral</option>
                <option value="Luxury Fair">Luxury Wedding Expo Delhi</option>
                <option value="Website">Website Direct Concierge</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1">
              Private Planning Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specific requests, dietary restrictions, preferred venues (e.g. Rambagh Palace or Udaivilas)..."
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-navy hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold flex items-center space-x-2 text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Supabase...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Enquiry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
