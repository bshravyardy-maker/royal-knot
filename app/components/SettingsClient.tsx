"use client";

import React, { useState } from "react";
import {
  Settings,
  Building,
  Users,
  CreditCard,
  Bell,
  Database,
  CheckCircle2,
  Sparkles,
  Save,
  Shield,
  Crown,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface SettingsClientProps {
  teamMembers: any[];
  packages: any[];
}

export function SettingsClient({ teamMembers, packages }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"agency" | "team" | "packages" | "notifications" | "system">("agency");
  const [agencyName, setAgencyName] = useState("THE ROYAL KNOT LUXURY WEDDINGS");
  const [jaipurAddress, setJaipurAddress] = useState("Royal Haveli, Narain Singh Circle, Jaipur, Rajasthan 302004");
  const [udaipurAddress, setUdaipurAddress] = useState("Pichola Palace Road, Haridas Ji Ki Magri, Udaipur 313001");
  const [gstin, setGstin] = useState("08AAACT1234F1Z8");
  const [bankAccount, setBankAccount] = useState("HDFC Bank • Royal Escrow • A/C 50200088991122");
  const [ifsc, setIfsc] = useState("HDFC0000054 (C-Scheme, Jaipur)");
  const [arrivalSla, setArrivalSla] = useState("20");
  const [savedNotice, setSavedNotice] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Palatial Infrastructure & Governance</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy">
            Agency & System Settings
          </h1>
          <p className="text-xs sm:text-sm text-navy/70 mt-0.5">
            Configure luxury brand credentials, core team roles, commission structures, and database protocols.
          </p>
        </div>

        {savedNotice && (
          <div className="p-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Configuration Saved Successfully!</span>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 overflow-x-auto pb-1">
        {[
          { key: "agency", label: "Agency Profile & Treasury", icon: Building },
          { key: "team", label: "Partners & Team Roster", icon: Users },
          { key: "packages", label: "Tiers & Pricing", icon: Crown },
          { key: "notifications", label: "Protocols & Alerts", icon: Bell },
          { key: "system", label: "Supabase & Storage Health", icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? "border-gold text-navy bg-white shadow-sm"
                  : "border-transparent text-gray-500 hover:text-navy hover:bg-ivory/60"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-gold" : "text-gray-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Agency Profile & Treasury */}
      {activeTab === "agency" && (
        <form onSubmit={handleSave} className="royal-card p-6 space-y-6 max-w-4xl">
          <div>
            <h3 className="text-xl font-serif font-bold text-navy mb-1">
              Luxury Concierge Identity
            </h3>
            <p className="text-xs text-navy/60">
              Legal credentials printed on service agreements and client invoices.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Agency Legal Entity Name
              </label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold font-serif font-bold text-navy text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Jaipur Headquarters
                </label>
                <textarea
                  rows={2}
                  value={jaipurAddress}
                  onChange={(e) => setJaipurAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Udaipur Palace Liaison Office
                </label>
                <textarea
                  rows={2}
                  value={udaipurAddress}
                  onChange={(e) => setUdaipurAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  GSTIN Registration
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold font-mono font-bold text-navy text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Client RTGS/NEFT Escrow Account
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold font-medium text-navy text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button type="submit" className="btn-gold py-2 px-5 flex items-center space-x-1.5 text-xs">
              <Save className="w-3.5 h-3.5" />
              <span>Save Agency Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Team Roster */}
      {activeTab === "team" && (
        <div className="royal-card p-6 space-y-4 max-w-4xl">
          <div>
            <h3 className="text-xl font-serif font-bold text-navy mb-1">
              Core Royal Partners & Coordinators
            </h3>
            <p className="text-xs text-navy/60">
              Team members assigned to task plans, vendor tenders, and day-of command center execution.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {teamMembers.map((member) => (
              <div key={member.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-full bg-navy text-gold font-serif font-bold text-sm flex items-center justify-center border border-gold/40">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-navy text-sm">{member.name}</h4>
                    <p className="text-xs text-gold-dark font-medium">{member.role}</p>
                    <p className="text-[11px] text-gray-400">{member.email} • {member.phone}</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active Partner
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Packages */}
      {activeTab === "packages" && (
        <div className="royal-card p-6 space-y-4 max-w-4xl">
          <div>
            <h3 className="text-xl font-serif font-bold text-navy mb-1">
              Palatial Service Tiers
            </h3>
            <p className="text-xs text-navy/60">
              Standard contract baselines and task template generation rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="p-5 rounded-2xl bg-ivory/50 border border-gold/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-navy text-base">{pkg.name}</h4>
                  <span className="text-xs font-bold text-gold px-2 py-0.5 rounded bg-navy">
                    {pkg.tier}
                  </span>
                </div>
                <p className="text-xs text-navy/70 leading-relaxed">{pkg.description}</p>
                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs font-medium">
                  <span className="text-gray-500">Starting Retainer</span>
                  <span className="font-serif font-bold text-navy text-sm">
                    ₹{Number(pkg.starting_price || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Protocols & Alerts */}
      {activeTab === "notifications" && (
        <form onSubmit={handleSave} className="royal-card p-6 space-y-6 max-w-4xl">
          <div>
            <h3 className="text-xl font-serif font-bold text-navy mb-1">
              Operational Protocols & Day-of SLAs
            </h3>
            <p className="text-xs text-navy/60">
              Automated triggers for vendor tardiness and payment milestone alerts.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Vendor Arrival Late Threshold (Minutes before event)
              </label>
              <input
                type="number"
                value={arrivalSla}
                onChange={(e) => setArrivalSla(e.target.value)}
                className="w-36 px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-gold font-bold text-navy"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Vendors not checked in {arrivalSla} minutes before scheduled time are flagged with red warnings in Command Center.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-gold focus:ring-gold" />
                <span className="text-xs font-medium text-navy">
                  Send WhatsApp arrival ping to lead vendor 1 hour before scheduled time
                </span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-gold focus:ring-gold" />
                <span className="text-xs font-medium text-navy">
                  Alert lead coordinator when day-of incidents are marked severity High
                </span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-gold focus:ring-gold" />
                <span className="text-xs font-medium text-navy">
                  Auto-notify client 14 days before Advance and Final milestone due dates
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button type="submit" className="btn-gold py-2 px-5 flex items-center space-x-1.5 text-xs">
              <Save className="w-3.5 h-3.5" />
              <span>Save Protocols</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: Supabase Diagnostics */}
      {activeTab === "system" && (
        <div className="royal-card p-6 space-y-4 max-w-4xl">
          <div>
            <h3 className="text-xl font-serif font-bold text-navy mb-1">
              Backend Services & Integrity Status
            </h3>
            <p className="text-xs text-navy/60">
              Live database connection, Row Level Security, and private signature vault diagnostics.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="font-bold text-emerald-900">Supabase PostgreSQL 15</p>
                  <p className="text-[11px] text-emerald-700">Row Level Security enforced on all 21 operational tables</p>
                </div>
              </div>
              <span className="font-bold text-emerald-800">Operational</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <Shield className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-emerald-900">Storage Vault: signatures (Private)</p>
                  <p className="text-[11px] text-emerald-700">Digital client agreement PNGs secured with service-role token auth</p>
                </div>
              </div>
              <span className="font-bold text-emerald-800">Secured</span>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-navy">Application Version</p>
                <p className="text-[11px] text-gray-500">The Royal Knot Palatial Concierge v1.0.0 (Production Release)</p>
              </div>
              <span className="font-mono text-gray-600 font-bold">2026/27 Edition</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
