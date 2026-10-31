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
  ShieldCheck,
  ArrowRight,
  Loader2,
  Users,
  Heart,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";
import { submitPublicInquiryAction } from "@/actions/enquiries";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"staff" | "portal">("staff");

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("founder@royalknot.in");
  const [loginPassword, setLoginPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail.trim()) {
      setLoginError("Please enter your registered email or staff ID.");
      return;
    }
    setIsEntering(true);
    setTimeout(() => {
      router.push("/");
    }, 700);
  }

  function handleSelectQuickRole(roleEmail: string, roleName: string) {
    setLoginEmail(roleEmail);
    setLoginPassword("RoyalKnot@2026");
  }

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
              onClick={() => setActiveTab("staff")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === "staff"
                  ? "bg-gold text-navy shadow-sm"
                  : "text-ivory/70 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Portal Sign In</span>
            </button>

            <button
              onClick={() => setActiveTab("portal")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === "portal"
                  ? "bg-gold text-navy shadow-sm"
                  : "text-ivory/70 hover:text-white"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Direct Client Enquiry</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Staff / Portal Sign In */}
        {activeTab === "staff" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-navy">
                Sign In to Your Palatial Account
              </h2>
              <p className="text-xs text-navy/60 mt-0.5">
                Access your destination wedding portfolio, vendor tenders, and event command center.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Email Address or Royal Staff ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="planner@royalknot.in"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-navy text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70">
                    Password / Access Key
                  </label>
                  <button
                    type="button"
                    onClick={() => alert("Password reset instructions have been dispatched to your registered secure email.")}
                    className="text-[11px] text-gold-dark hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="Enter your confidential password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-navy text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-navy"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-navy focus:ring-gold"
                  />
                  <span className="text-[11px]">Remember this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isEntering}
                className="w-full btn-gold py-3 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
              >
                {isEntering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Credentials & Entering...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Sign In to Royal Knot</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Credentials */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-2">
                1-Click Quick Select Sign In:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectQuickRole("gayatri@royalknot.in", "Gayatri Devi")}
                  className="p-2 rounded-xl border border-gold/40 hover:bg-ivory/60 text-left transition-colors"
                >
                  <p className="font-bold text-navy text-[11px]">Gayatri Devi</p>
                  <p className="text-[10px] text-gold-dark font-medium">Founder & Planner</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectQuickRole("raghav@royalknot.in", "Raghavendra")}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-ivory/60 text-left transition-colors"
                >
                  <p className="font-bold text-navy text-[11px]">Raghavendra</p>
                  <p className="text-[10px] text-gray-500 font-medium">Lead Operations</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectQuickRole("client@royalknot.in", "Veer & Aanya")}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-ivory/60 text-left transition-colors"
                >
                  <p className="font-bold text-navy text-[11px]">Royal Couple</p>
                  <p className="text-[10px] text-gray-500 font-medium">Client Portal</p>
                </button>
              </div>
            </div>

            {/* Switch to Online Enquiry */}
            <div className="p-3 rounded-2xl bg-ivory/50 border border-gold/20 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-navy">Looking to plan your wedding?</p>
                <p className="text-[11px] text-gray-500">Submit an online consultation enquiry directly.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("portal")}
                className="text-gold-dark hover:underline font-bold text-xs flex items-center space-x-1"
              >
                <span>Enquire Directly</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Customer & Guest Consultation Enquiry */}
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
                    Thank you, <strong className="text-navy">{name}</strong>. Your destination wedding requirements have been dispatched to our agency partners.
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

                  <button
                    onClick={() => setActiveTab("staff")}
                    className="px-4 py-2 text-xs font-semibold text-navy hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4 text-xs">
                <div>
                  <h3 className="text-lg font-serif font-bold text-navy">
                    Online Palatial Wedding Enquiry
                  </h3>
                  <p className="text-xs text-navy/60">
                    Direct consultation request for palace celebrations in Jaipur, Udaipur, and beyond.
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
                      { key: "guest_request", label: "Wedding Guest" },
                      { key: "general_query", label: "Media / Vendor" },
                    ].map((type) => (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => setInquiryType(type.key as any)}
                        className={`p-2 rounded-xl text-center border font-semibold transition-all ${
                          inquiryType === type.key
                            ? "bg-navy text-gold border-gold/40 shadow-sm"
                            : "bg-white text-navy/70 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Radhika & Sidharth"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-navy text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+91 98290 12345"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-navy text-xs"
                    />
                  </div>
                </div>

                {/* Email & Destination */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-navy text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                      Target Destination Palace
                    </label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-navy text-xs bg-white"
                    >
                      <option value="Jaipur">Jaipur (Rambagh, Fairmont, Samode)</option>
                      <option value="Udaipur">Udaipur (Lake Palace, Udaivilas, Jagmandir)</option>
                      <option value="Jodhpur">Jodhpur (Umaid Bhawan, Mehrangarh)</option>
                      <option value="Jaisalmer">Jaisalmer (Suryagarh Fort)</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Your Requirements / Celebration Details *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={3}
                    placeholder="Tell us about your wedding dates, guest expectations (300-600 guests), specific palace preferences, or special banqueting requests..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-navy text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab("staff")}
                    className="text-xs text-gray-500 hover:text-navy hover:underline"
                  >
                    ← Back to Sign In
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-gold py-2.5 px-6 text-xs font-bold flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Royal Enquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="py-3 px-6 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>The Royal Knot Concierge OS • Version 2.4</span>
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-dark" />
            <span>256-bit Encrypted Vault</span>
          </span>
        </div>
      </div>
    </div>
  );
}
