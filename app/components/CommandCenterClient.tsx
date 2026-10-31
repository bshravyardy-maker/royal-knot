"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Building2,
  Users,
  Phone,
  Loader2,
  Plus,
  RefreshCw,
  MapPin,
  Calendar,
  Check,
  ChevronDown,
} from "lucide-react";
import { DemoBadge } from "./DemoBadge";
import { LogIncidentModal } from "./LogIncidentModal";
import { ResolveIncidentModal } from "./ResolveIncidentModal";
import { markArrived } from "@/actions/command-center";
import { ScheduleItem, Incident, TeamMember } from "@/lib/types";

interface WeddingOption {
  id: string;
  title: string;
  wedding_date?: string;
  venue?: string;
  city?: string;
  is_demo: boolean;
}

interface CommandCenterClientProps {
  weddings: WeddingOption[];
  selectedWeddingId: string;
  initialScheduleItems: ScheduleItem[];
  initialIncidents: Incident[];
  teamMembers: TeamMember[];
}

// Always show Indian time, whatever timezone the server or browser is in
const TIME_FMT: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
};

export function CommandCenterClient({
  weddings,
  selectedWeddingId,
  initialScheduleItems,
  initialIncidents,
  teamMembers,
}: CommandCenterClientProps) {
  const router = useRouter();

  // Polling every 4 seconds with router.refresh() and cleanup on unmount
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 4000);

    return () => clearInterval(interval);
  }, [router]);

  // Client time ticker every 10s to keep late minutes accurate between refreshes
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const ticker = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(ticker);
  }, []);

  // UI state
  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [resolvingIncident, setResolvingIncident] = useState<Incident | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const selectedWedding = weddings.find((w) => w.id === selectedWeddingId) || weddings[0];

  // Compute LATE dynamically.
  // LATE = item has a responsible vendor AND scheduled_time has passed AND arrived_at is null.
  // Items with no vendor (ceremonies like Varmala or Fireworks) can never be late.
  const itemsWithComputedStatus = initialScheduleItems.map((item) => {
    const schedMs = new Date(item.scheduled_time || item.start_time || "").getTime();
    const hasVendor = Boolean(item.vendor);
    const isArrived = Boolean(item.arrived_at);
    const isLate = hasVendor && !isArrived && schedMs < currentTime;
    const diffMins = isLate ? Math.max(1, Math.floor((currentTime - schedMs) / 60000)) : 0;

    return {
      ...item,
      schedMs,
      hasVendor,
      isArrived,
      isLate,
      diffMins,
    };
  });

  // Sort strictly by scheduled_time ASC
  const sortedItems = [...itemsWithComputedStatus].sort((a, b) => a.schedMs - b.schedMs);

  // Summary counts
  const arrivedCount = sortedItems.filter((i) => i.isArrived).length;
  const lateCount = sortedItems.filter((i) => i.isLate).length;
  const pendingCount = sortedItems.filter((i) => !i.isArrived && !i.isLate).length;
  const openIncidentsCount = initialIncidents.filter((inc) => inc.status === "Open" || inc.status === "Reported").length;

  // Handle Mark Arrived
  async function handleMarkArrived(itemId: string) {
    if (submittingItemId) return;
    setSubmittingItemId(itemId);
    setActionMessage(null);

    try {
      const res = await markArrived(itemId);
      if (!res.success) {
        setActionMessage({ text: res.error || "Failed to mark as arrived.", type: "error" });
      } else {
        setActionMessage({ text: res.message || "Vendor marked as arrived.", type: "success" });
        router.refresh();
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || "An unexpected error occurred.", type: "error" });
    } finally {
      setSubmittingItemId(null);
    }
  }

  function handleWeddingChange(weddingId: string) {
    router.push(`/command-center?weddingId=${weddingId}`);
  }

  function handleManualRefresh() {
    setIsManualRefreshing(true);
    router.refresh();
    setTimeout(() => setIsManualRefreshing(false), 500);
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Wedding Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Compass className="w-4 h-4 text-gold" />
            <span>Real-time Day-of Operations</span>
            <span className="inline-flex items-center space-x-1 ml-2 px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-800 font-medium border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Live 4s Telemetry</span>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy">
              Day-of Command Center
            </h1>
            {selectedWedding?.is_demo ? <DemoBadge /> : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Live</span>}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {selectedWedding?.venue || "Palatial Heritage Estate"} • {selectedWedding?.city || "Rajasthan"}
          </p>
        </div>

        {/* Wedding Selector & Live Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px]">
            <select
              value={selectedWeddingId}
              onChange={(e) => handleWeddingChange(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl bg-white border border-[#C6A46A]/40 text-navy font-semibold text-sm shadow-subtle focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            >
              {weddings.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} ({w.wedding_date || "Live"})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-navy/60 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleManualRefresh}
            title="Force refresh"
            className="p-2.5 rounded-xl bg-white border border-[#C6A46A]/30 text-navy/70 hover:text-navy hover:border-gold shadow-subtle transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isManualRefreshing ? "animate-spin text-gold" : ""}`} />
          </button>

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-subtle flex items-center space-x-2 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Log Incident</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
            actionMessage.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-semibold hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Strip (Arrived, Pending, Late, Incidents) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Arrived */}
        <div className="royal-card p-5 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Checked In
            </div>
            <div className="text-3xl font-serif font-bold text-emerald-700 mt-1">
              {arrivedCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Vendors & VIPs on-site</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pending */}
        <div className="royal-card p-5 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Upcoming
            </div>
            <div className="text-3xl font-serif font-bold text-amber-700 mt-1">
              {pendingCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Future milestones</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* LATE (Computed) */}
        <div className={`royal-card p-5 border-l-4 ${lateCount > 0 ? "border-l-red-500 bg-red-50/20" : "border-l-gray-300"} flex items-center justify-between`}>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center space-x-1.5">
              <span>Overdue / Late</span>
              {lateCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
            </div>
            <div className={`text-3xl font-serif font-bold mt-1 ${lateCount > 0 ? "text-red-600 font-extrabold" : "text-gray-400"}`}>
              {lateCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Missed arrival window</div>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${lateCount > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Active Incidents */}
        <div className={`royal-card p-5 border-l-4 ${openIncidentsCount > 0 ? "border-l-red-600 bg-red-50/30" : "border-l-gold"} flex items-center justify-between`}>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Open Incidents
            </div>
            <div className={`text-3xl font-serif font-bold mt-1 ${openIncidentsCount > 0 ? "text-red-700" : "text-gold-dark"}`}>
              {openIncidentsCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {openIncidentsCount > 0 ? "Requires coordination" : "Palace run smooth"}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${openIncidentsCount > 0 ? "bg-red-100 text-red-700" : "bg-gold/20 text-gold-dark"}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Timeline (left 2/3) + Incident Log (right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold text-navy flex items-center space-x-2">
                <span>Minute-by-Minute Run-sheet</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({sortedItems.length} Milestones)
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Sorted by scheduled event time with real-time arrival verification
              </p>
            </div>
          </div>

          {/* Timeline Feed */}
          {sortedItems.length === 0 ? (
            <div className="royal-card p-12 text-center space-y-3">
              <Calendar className="w-12 h-12 text-[#C6A46A]/50 mx-auto" />
              <h3 className="text-lg font-serif font-bold text-navy">
                No Schedule Items Found
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No minute-by-minute schedule items have been created for this wedding yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedItems.map((item) => {
                const schedDate = new Date(item.scheduled_time || item.start_time || "");
                const timeStr = !isNaN(schedDate.getTime())
                  ? schedDate.toLocaleTimeString("en-IN", TIME_FMT)
                  : "TBD";

                const isItemSubmitting = submittingItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`royal-card p-4 sm:p-5 transition-all ${
                      item.isLate
                        ? "border-red-300 bg-red-50/20 shadow-sm ring-1 ring-red-200"
                        : item.isArrived
                        ? "border-emerald-200 bg-emerald-50/10"
                        : "border-gray-200 hover:border-gold/50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Time and Title Details */}
                      <div className="flex items-start space-x-3.5">
                        {/* Time Pill */}
                        <div
                          className={`flex-shrink-0 px-3 py-2 rounded-xl text-center min-w-[76px] font-mono font-bold text-xs ${
                            item.isLate
                              ? "bg-red-600 text-white shadow-sm"
                              : item.isArrived
                              ? "bg-emerald-700 text-white"
                              : "bg-navy text-ivory"
                          }`}
                        >
                          <div className="text-[10px] uppercase font-sans font-semibold tracking-wider opacity-80">
                            Sched
                          </div>
                          <div className="text-sm font-semibold">{timeStr}</div>
                        </div>

                        {/* Title and Metadata */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif font-bold text-base text-navy">
                              {item.title || item.event_name}
                            </span>

                            {/* Demo/Live Badge */}
                            {item.is_demo ? <DemoBadge /> : <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Live</span>}

                            {/* LATE Badge: Computed in Red */}
                            {item.isLate && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                <span>{item.diffMins} min late</span>
                              </span>
                            )}

                            {/* Arrived Badge */}
                            {item.isArrived && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>
                                  Arrived {new Date(item.arrived_at!).toLocaleTimeString("en-IN", TIME_FMT)}
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Sublocation and Vendor Details */}
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-500">
                            {item.venue_sublocation && (
                              <span className="flex items-center space-x-1 text-gray-600">
                                <MapPin className="w-3 h-3 text-gold" />
                                <span>{item.venue_sublocation}</span>
                              </span>
                            )}

                            {item.vendor && (
                              <span className="flex items-center space-x-1 font-medium text-navy/80">
                                <Building2 className="w-3 h-3 text-gray-400" />
                                <span>{item.vendor.name || item.vendor.business_name}</span>
                                {item.vendor.phone && (
                                  <a
                                    href={`tel:${item.vendor.phone}`}
                                    className="text-gold hover:underline flex items-center space-x-0.5 ml-1"
                                  >
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>{item.vendor.phone}</span>
                                  </a>
                                )}
                              </span>
                            )}

                            {item.team_member && (
                              <span className="flex items-center space-x-1 text-gray-500">
                                <Users className="w-3 h-3 text-gray-400" />
                                <span>Lead: {item.team_member.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Mark Arrived Action (vendor items only) */}
                      <div className="flex items-center justify-end flex-shrink-0 pt-2 sm:pt-0">
                        {item.isArrived ? (
                          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Checked In</span>
                          </div>
                        ) : item.hasVendor ? (
                          <button
                            onClick={() => handleMarkArrived(item.id)}
                            disabled={isItemSubmitting}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold shadow-subtle flex items-center space-x-1.5 transition-all ${
                              item.isLate
                                ? "bg-red-600 hover:bg-red-700 text-white ring-1 ring-red-400"
                                : "btn-gold"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isItemSubmitting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark Arrived</span>
                              </>
                            )}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Incidents Column (right 1/3) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold text-navy flex items-center space-x-2">
                <span>Incident Log</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({initialIncidents.length})
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Day-of escalations, power & floral emergencies
              </p>
            </div>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-navy hover:bg-navy-light text-ivory text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-gold" />
              <span>Log</span>
            </button>
          </div>

          {initialIncidents.length === 0 ? (
            <div className="royal-card p-8 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-serif font-bold text-navy">No Incidents</h4>
              <p className="text-xs text-gray-500">
                All palace protocols are operating without active alerts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {initialIncidents.map((inc) => {
                const isOpen = inc.status === "Open" || inc.status === "Reported";
                const isHigh = inc.severity === "High" || inc.severity === "Critical";
                const isMedium = inc.severity === "Medium";

                return (
                  <div
                    key={inc.id}
                    className={`royal-card p-4 transition-all ${
                      isOpen && isHigh
                        ? "border-red-300 bg-red-50/30"
                        : isOpen
                        ? "border-amber-300 bg-amber-50/20"
                        : "border-gray-200 opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        {/* Severity chip */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                            isHigh
                              ? "bg-red-600 text-white"
                              : isMedium
                              ? "bg-amber-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {inc.severity}
                        </span>

                        {/* Status chip */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isOpen
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isOpen ? "Open" : "Resolved"}
                        </span>

                        {inc.is_demo ? <DemoBadge /> : <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Live</span>}
                      </div>

                      {/* Logged timestamp */}
                      <span className="text-[11px] text-gray-400 font-mono">
                        {new Date(inc.created_at).toLocaleTimeString("en-IN", TIME_FMT)}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="font-semibold text-sm text-navy mb-1.5">
                      {inc.title}
                    </div>

                    {/* Owner / Reported info */}
                    {inc.owner && (
                      <div className="text-xs text-gray-500 mb-2 flex items-center space-x-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span>Owner: {inc.owner.name} ({inc.owner.role.split(" ")[0]})</span>
                      </div>
                    )}

                    {/* Resolution notes if resolved */}
                    {inc.resolution && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 mt-2 space-y-1">
                        <div className="font-bold flex items-center space-x-1 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolution:</span>
                        </div>
                        <p className="text-[11px]">{inc.resolution}</p>
                        {inc.resolved_at && (
                          <div className="text-[10px] text-emerald-700 font-mono">
                            Resolved at {new Date(inc.resolved_at).toLocaleTimeString("en-IN", TIME_FMT)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action button: Resolve with Note */}
                    {isOpen && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setResolvingIncident(inc)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center space-x-1 shadow-subtle transition-all"
                        >
                          <Check className="w-3 h-3" />
                          <span>Resolve</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Log Incident Modal */}
      <LogIncidentModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        weddingId={selectedWedding?.id || ""}
        weddingTitle={selectedWedding?.title || "Palatial Wedding"}
        teamMembers={teamMembers}
        onIncidentLogged={() => {
          router.refresh();
        }}
      />

      {/* Resolve Incident Modal */}
      <ResolveIncidentModal
        isOpen={Boolean(resolvingIncident)}
        onClose={() => setResolvingIncident(null)}
        incident={resolvingIncident}
        onResolved={() => {
          router.refresh();
        }}
      />
    </div>
  );
}