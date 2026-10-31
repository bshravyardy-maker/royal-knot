"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Crown,
  Sparkles,
  Send,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Users,
  Building,
  Heart,
  HelpCircle,
} from "lucide-react";
import { submitPublicInquiryAction } from "@/actions/enquiries";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"portal" | "staff">("portal");

  // Portal Inquiry Form State
  const [inquiryType, setInquiryType] = useState<"couple_inquiry" | "guest_request" | "general_query">("couple_inquiry");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [destination, setDestination] = useState("Jaipur");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Staff Login State
  const [selectedStaff, setSelectedStaff] = useState("Gayatri Devi");
  const [isEntering, setIsEntering] = useState(false);

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await submitPublicInquiryAction({
        inquiry_type: inquiryType,
        name,
        phone,
        email: email || undefined,
        destination,
        message,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to submit request.");
        setIsSubmitting(false);
      } else {
        const refId = `RN-${Math.floor(100000 + Math.random() * 900000)}`;
        setSubmittedRef(refId);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  }

  function handleStaffEnter() {
    setIsEntering(true);
    setTimeout(() => {
      router.push("/");
    }, 600);
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-elevated border border-[#C6A46A]/30 overflow-hidden animate-fadeIn">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-navy via-navy-dark to-navy text-ivory p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-10">
            <Crown className="w-32 h-32 text-gold" />
          </div>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C6A46A] to-[#8C7142] flex items-center justify-center text-white mx-auto shadow-gold mb-3">
            <Crown className="w-8 h-8" />
          </div>

          <span className="text-[10px] font-bold tracking-widest uppercase text-gold">
            Palatial Operations & Hospitality
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#DFC698] mt-1">
            THE ROYAL KNOT
          </h1>
          <p className="text-xs text-ivory/70 max-w-md mx-auto mt-1">
            Jaipur • Udaipur Luxury Destination Wedding Concierge
          </p>

          {/* Switcher Tabs */}
          <div className="mt-6 flex items-center justify-center bg-navy/60 p-1 rounded-2xl border border-gold/30 max-w-sm mx-auto">
            <button
              onClick={() => setActiveTab("portal")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === "portal"
                  ? "bg-gold text-navy shadow-sm"
                  : "text-ivory/70 hover:text-white"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Customer & Guest Desk</span>
            </button>

            <button
              onClick={() => setActiveTab("staff")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === "staff"
                  ? "bg-gold text-navy shadow-sm"
                  : "text-ivory/70 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Concierge Staff</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Customer & Guest Portal */}
        {activeTab === "portal" && (
          <div className="p-6 sm:p-8">
            {submittedRef ? (
              <div className="text-center py-8 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-navy">
                    Your Royal Request is Recorded
                  </h3>
                  <p className="text-xs text-navy/70 max-w-md mx-auto mt-1 leading-relaxed">
                    Thank you, <strong className="text-navy">{name}</strong>. Your celebration query has been delivered to the lead concierge team.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-ivory/60 border border-gold/30 max-w-xs mx-auto text-xs space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">
                    Inquiry Reference Number
                  </span>
                  <p className="text-lg font-mono font-bold text-gold-dark">{submittedRef}</p>
                </div>

                <p className="text-[11px] text-gray-400">
                  Our Senior Partner will reach out to you within 24 hours at <strong>{phone}</strong>.
                </p>

                <div className="pt-2 flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      setSubmittedRef(null);
                      setMessage("");
                    }}
                    className="btn-gold text-xs py-2 px-5"
                  >
                    Submit Another Query
                  </button>

                  <Link href="/" className="px-4 py-2 text-xs font-semibold text-navy hover:underline">
                    Go to Overview
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4 text-xs">
                <div>
                  <h3 className="text-lg font-serif font-bold text-navy">
                    Palatial Query & Guest Request Desk
                  </h3>
                  <p className="text-xs text-navy/60">
                    Submit wedding dates, palace booking questions, or special banquet requests.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                    {errorMsg}
                  </div>
                )}

                {/* Inquiry Type Radio */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    I am submitting as:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "couple_inquiry", label: "Prospective Couple" },
                      { key: "guest_request", label: "Invited Guest" },
                      { key: "general_query", label: "General Query" },
                    ].map((t) => (
                      <button
                        type="button"
                        key={t.key}
                        onClick={() => setInquiryType(t.key as any)}
                        className={`p-2 rounded-xl text-center font-semibold text-[11px] border transition-all ${
                          inquiryType === t.key
                            ? "bg-navy text-gold border-gold shadow-sm font-bold"
                            : "bg-gray-50 text-navy/70 border-gray-200 hover:bg-ivory"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aanya Rathore"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98290 12345"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="couple@luxury.in"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                      Target Destination
                    </label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                    >
                      <option value="Jaipur">Jaipur (Rambagh, Jai Mahal, Samode)</option>
                      <option value="Udaipur">Udaipur (Lake Palace, Udaivilas, Jagmandir)</option>
                      <option value="Jodhpur">Jodhpur (Umaid Bhawan)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Your Query, Dietary Protocol, or Celebration Request *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your desired dates, palace preferences, guest count, or dietary protocol (Jain, Sattvic)..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-gold py-3 px-4 flex items-center justify-center space-x-2 text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Transmitting Royal Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Palatial Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Concierge Staff Login */}
        {activeTab === "staff" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-navy">
                Palace Partner & Concierge Portal
              </h3>
              <p className="text-xs text-navy/60">
                Select your verified partner identity to enter the operational management platform.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { name: "Gayatri Devi", role: "Lead Royal Partner & Concierge", code: "GD" },
                { name: "Raghavendra Singh", role: "Head of Logistics & Palace Protocol", code: "RS" },
                { name: "Ananya Rathore", role: "Artisan Vendor Director", code: "AR" },
              ].map((staff) => {
                const isSelected = selectedStaff === staff.name;
                return (
                  <button
                    type="button"
                    key={staff.name}
                    onClick={() => setSelectedStaff(staff.name)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-navy text-ivory border-gold shadow-md ring-2 ring-gold/40"
                        : "bg-white border-gray-200 text-navy hover:bg-ivory/60"
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-10 h-10 rounded-full font-serif font-bold text-sm flex items-center justify-center border ${
                        isSelected ? "bg-gold text-navy border-gold" : "bg-navy text-gold border-gold/40"
                      }`}>
                        {staff.code}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm">{staff.name}</h4>
                        <p className={`text-xs ${isSelected ? "text-gold" : "text-gray-500"}`}>
                          {staff.role}
                        </p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-gold bg-gold text-navy" : "border-gray-300"
                    }`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-navy" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleStaffEnter}
                disabled={isEntering}
                className="w-full btn-gold py-3 px-4 flex items-center justify-center space-x-2 text-xs font-bold shadow-md disabled:opacity-50"
              >
                {isEntering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing Concierge Session...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Concierge Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
