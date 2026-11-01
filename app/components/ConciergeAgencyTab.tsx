"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  Car,
  Plane,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Users,
  Utensils,
  Phone,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit,
  X,
  Loader2,
  Crown,
} from "lucide-react";
import {
  getAgencyConciergeDataAction,
  generateOrGetGuestPassportAction,
  regenerateGuestPassportAction,
  revokeGuestPassportAction,
  updateGuestTransportAction,
} from "@/actions/concierge";
import { PrintableQrPassModal } from "./PrintableQrPassModal";
import { TransportStatus } from "@/lib/types";

interface ConciergeAgencyTabProps {
  weddingsList: { id: string; title: string }[];
  guests: any[];
}

export function ConciergeAgencyTab({
  weddingsList,
  guests,
}: ConciergeAgencyTabProps) {
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>("All");
  const [transportFilter, setTransportFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [passesData, setPassesData] = useState<any[]>([]);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Active pass for QR preview modal
  const [selectedGuestForQr, setSelectedGuestForQr] = useState<any | null>(null);
  const [activeRawToken, setActiveRawToken] = useState<string>("");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Transport edit modal
  const [transportModalGuest, setTransportModalGuest] = useState<any | null>(null);
  const [pickupRequired, setPickupRequired] = useState(false);
  const [arrivalFlight, setArrivalFlight] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [transportStatus, setTransportStatus] = useState<TransportStatus>("Not Required");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [departureFlight, setDepartureFlight] = useState("");
  const [departureNotes, setDepartureNotes] = useState("");
  const [isSavingTransport, setIsSavingTransport] = useState(false);

  // Load agency concierge data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await getAgencyConciergeDataAction(selectedWeddingId);
      if (res.success && res.data) {
        setPassesData(res.data.passes);
        if (res.data.needsMigration !== undefined) {
          setNeedsMigration(Boolean(res.data.needsMigration));
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, [selectedWeddingId]);

  // Merge guests with passes
  const mergedGuests = guests
    .filter((g) => (selectedWeddingId === "All" ? true : g.wedding_id === selectedWeddingId))
    .map((g) => {
      const pass = passesData.find((p) => p.guest_id === g.id);
      return {
        ...g,
        pass,
      };
    });

  // Filtered list
  const filteredGuests = mergedGuests.filter((g) => {
    if (transportFilter !== "All") {
      const status = g.pass?.transport_status || "Not Required";
      if (transportFilter === "Requested" && !g.pass?.airport_pickup_required && status !== "Requested") return false;
      if (transportFilter !== "Requested" && status !== transportFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = g.name && g.name.toLowerCase().includes(q);
      const matchDriver = g.pass?.assigned_driver_name && g.pass.assigned_driver_name.toLowerCase().includes(q);
      const matchHotel = g.hotel_assigned && g.hotel_assigned.toLowerCase().includes(q);
      const matchFlight = g.pass?.arrival_flight_train && g.pass.arrival_flight_train.toLowerCase().includes(q);
      return matchName || matchDriver || matchHotel || matchFlight;
    }
    return true;
  });

  // KPI calculations
  const totalPassesIssued = passesData.filter((p) => !p.revoked).length;
  const totalPickupsRequested = passesData.filter(
    (p) => p.airport_pickup_required || p.transport_status === "Requested"
  ).length;
  const driversAssigned = passesData.filter(
    (p) => p.transport_status === "Driver Assigned" || p.transport_status === "In Transit"
  ).length;
  const rsvpsViaPassport = mergedGuests.filter(
    (g) => g.pass && (g.rsvp_status === "Attending" || g.rsvp_status === "Declined")
  ).length;

  async function handleOpenQr(guest: any) {
    setActionLoadingId(guest.id);
    const res = await generateOrGetGuestPassportAction(guest.id);
    setActionLoadingId(null);

    if (res.success && res.data) {
      setActiveRawToken(res.data.rawToken);
      setSelectedGuestForQr(guest);
      setIsQrModalOpen(true);
      // Refresh passes list
      const updated = await getAgencyConciergeDataAction(selectedWeddingId);
      if (updated.success && updated.data) setPassesData(updated.data.passes);
    } else {
      alert(res.error || "Failed to generate digital passport.");
    }
  }

  async function handleRegenerate(guest: any) {
    if (!confirm(`Re-generate new secure passport key for ${guest.name}? This will invalidate any previously printed or shared link.`)) {
      return;
    }
    setActionLoadingId(guest.id);
    const res = await regenerateGuestPassportAction(guest.id);
    setActionLoadingId(null);

    if (res.success && res.data) {
      setActiveRawToken(res.data.rawToken);
      setSelectedGuestForQr(guest);
      setIsQrModalOpen(true);
      const updated = await getAgencyConciergeDataAction(selectedWeddingId);
      if (updated.success && updated.data) setPassesData(updated.data.passes);
    } else {
      alert(res.error || "Failed to regenerate passport.");
    }
  }

  async function handleRevoke(guestId: string) {
    if (!confirm("Revoke this guest's digital passport access? They will no longer be able to open their itinerary or submit RSVPs.")) {
      return;
    }
    setActionLoadingId(guestId);
    const res = await revokeGuestPassportAction(guestId);
    setActionLoadingId(null);

    if (res.success) {
      const updated = await getAgencyConciergeDataAction(selectedWeddingId);
      if (updated.success && updated.data) setPassesData(updated.data.passes);
    } else {
      alert(res.error || "Failed to revoke passport.");
    }
  }

  function handleOpenTransportModal(guest: any) {
    setTransportModalGuest(guest);
    const p = guest.pass;
    setPickupRequired(Boolean(p?.airport_pickup_required));
    setArrivalFlight(p?.arrival_flight_train || "");
    setPickupLocation(p?.pickup_location || "Jaipur International Airport (JAI)");
    setTransportStatus(p?.transport_status || "Not Required");
    setDriverName(p?.assigned_driver_name || "");
    setDriverPhone(p?.assigned_driver_phone || "");
    setVehicleDetails(p?.vehicle_details || "");
    setDepartureFlight(p?.departure_flight_train || "");
    setDepartureNotes(p?.departure_transport_notes || "");
  }

  async function handleSaveTransport(e: React.FormEvent) {
    e.preventDefault();
    if (!transportModalGuest) return;
    setIsSavingTransport(true);

    const res = await updateGuestTransportAction({
      guest_id: transportModalGuest.id,
      airport_pickup_required: pickupRequired,
      arrival_flight_train: arrivalFlight,
      pickup_location: pickupLocation,
      transport_status: transportStatus,
      assigned_driver_name: driverName,
      assigned_driver_phone: driverPhone,
      vehicle_details: vehicleDetails,
      departure_flight_train: departureFlight,
      departure_transport_notes: departureNotes,
    });

    setIsSavingTransport(false);
    if (res.success) {
      setTransportModalGuest(null);
      const updated = await getAgencyConciergeDataAction(selectedWeddingId);
      if (updated.success && updated.data) setPassesData(updated.data.passes);
    } else {
      alert(res.error || "Failed to save transport info.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Supabase Migration Notice Banner (if table not yet created) */}
      {needsMigration && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex items-start space-x-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Supabase Table Migration Required</p>
            <p className="leading-relaxed text-amber-800">
              The table <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">public.guest_passports</code> has not been executed in your Supabase project yet.
            </p>
            <p className="text-[11px] text-amber-700">
              To activate live database persistence for guest passports, paste and run <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">supabase/migrations/20261101000009_royal_guest_concierge.sql</code> in your <strong>Supabase Dashboard &rarr; SQL Editor</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Concierge KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="royal-card p-4 border-l-4 border-l-gold">
          <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center space-x-1">
            <QrCode className="w-3.5 h-3.5 text-gold" />
            <span>Passports Issued</span>
          </div>
          <div className="text-2xl font-serif font-bold text-navy mt-1">
            {totalPassesIssued}
          </div>
          <div className="text-[11px] text-gray-500">SHA-256 hashed keys</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-emerald-500">
          <div className="text-[10px] uppercase font-bold text-emerald-800 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Digital RSVPs</span>
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-900 mt-1">
            {rsvpsViaPassport}
          </div>
          <div className="text-[11px] text-emerald-700">Submitted through portal</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-amber-500">
          <div className="text-[10px] uppercase font-bold text-amber-800 flex items-center space-x-1">
            <Plane className="w-3.5 h-3.5 text-amber-600" />
            <span>Airport Pickups</span>
          </div>
          <div className="text-2xl font-serif font-bold text-amber-900 mt-1">
            {totalPickupsRequested}
          </div>
          <div className="text-[11px] text-amber-700">Flight/train transfers</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-navy bg-navy/5">
          <div className="text-[10px] uppercase font-bold text-navy flex items-center space-x-1">
            <Car className="w-3.5 h-3.5 text-navy" />
            <span>Drivers Assigned</span>
          </div>
          <div className="text-2xl font-serif font-bold text-navy mt-1">
            {driversAssigned}
          </div>
          <div className="text-[11px] text-navy/70">Palace fleet & chauffeurs</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="royal-card p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Wedding Selector */}
        <div className="flex items-center space-x-2">
          <Crown className="w-4 h-4 text-gold flex-shrink-0" />
          <select
            value={selectedWeddingId}
            onChange={(e) => setSelectedWeddingId(e.target.value)}
            className="text-xs font-semibold text-navy bg-ivory/80 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-gold cursor-pointer"
          >
            <option value="All">All Weddings ({weddingsList.length})</option>
            {weddingsList.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>
        </div>

        {/* Transport Status Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
          {["All", "Requested", "Driver Assigned", "In Transit", "Completed"].map((st) => (
            <button
              key={st}
              onClick={() => setTransportFilter(st)}
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
                transportFilter === st
                  ? "bg-navy text-gold shadow-sm"
                  : "bg-gray-100 text-navy/70 hover:bg-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guest, driver, flight..."
            className="pl-8 pr-3 py-1.5 text-xs bg-ivory/80 rounded-xl border border-gray-200 focus:outline-none focus:border-gold w-44 sm:w-56"
          />
        </div>
      </div>

      {/* Concierge Passports Table */}
      <div className="royal-card p-6 overflow-x-auto">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-gold mx-auto mb-2" />
            <span>Loading concierge records...</span>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            <Users className="w-8 h-8 text-gold/60 mx-auto mb-2" />
            <p className="font-semibold text-navy text-sm">No guests found</p>
            <p className="text-gray-400 text-xs mt-1">
              Select another wedding or adjust the search filter.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#C6A46A]/20 text-[10px] font-bold uppercase text-navy/60">
                <th className="pb-3 pl-2">Guest & Allocation</th>
                <th className="pb-3">Access Key Status</th>
                <th className="pb-3 text-center">RSVP & Meal Preference</th>
                <th className="pb-3">Transport Logistics</th>
                <th className="pb-3">Assigned Chauffeur</th>
                <th className="pb-3 text-right">Concierge Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredGuests.map((guest) => {
                const pass = guest.pass;
                const isPassActive = pass && !pass.revoked && new Date(pass.expires_at).getTime() > Date.now();
                const isOperating = actionLoadingId === guest.id;

                return (
                  <tr key={guest.id} className="hover:bg-ivory/60 transition-colors">
                    {/* Guest Name & Room */}
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-serif font-bold text-navy text-sm">
                          {guest.name}
                        </span>
                        {guest.side ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                            {guest.side} Side
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {guest.hotel_assigned || "Palace Wing"} {guest.room_number ? `• Room ${guest.room_number}` : ""}
                      </div>
                    </td>

                    {/* Access Status */}
                    <td className="py-3.5">
                      {isPassActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                          Active Key
                        </span>
                      ) : pass?.revoked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <ShieldAlert className="w-3 h-3 mr-1 text-rose-600" />
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                          <Clock className="w-3 h-3 mr-1 text-gray-400" />
                          Not Issued
                        </span>
                      )}
                      {pass?.last_accessed_at && (
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Viewed {new Date(pass.last_accessed_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* RSVP & Meal */}
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          guest.rsvp_status === "Attending"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : guest.rsvp_status === "Declined"
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                      >
                        {guest.rsvp_status || "Pending"}
                      </span>
                      <div className="text-[11px] text-navy mt-1 flex items-center justify-center space-x-1">
                        <Utensils className="w-3 h-3 text-gold" />
                        <span>{pass?.meal_preference || guest.dietary_notes || "Royal Rajputana"}</span>
                      </div>
                    </td>

                    {/* Transport Logistics */}
                    <td className="py-3.5">
                      <div className="flex items-center space-x-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            pass?.transport_status === "Driver Assigned" || pass?.transport_status === "In Transit"
                              ? "bg-emerald-100 text-emerald-800"
                              : pass?.transport_status === "Requested"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <Plane className="w-2.5 h-2.5 mr-1" />
                          {pass?.transport_status || "Not Required"}
                        </span>
                      </div>
                      {pass?.arrival_flight_train && (
                        <div className="text-[11px] text-gray-600 mt-0.5 font-mono">
                          {pass.arrival_flight_train}
                        </div>
                      )}
                    </td>

                    {/* Driver Contact */}
                    <td className="py-3.5">
                      {pass?.assigned_driver_name ? (
                        <div>
                          <div className="font-semibold text-navy text-[11px]">
                            {pass.assigned_driver_name}
                          </div>
                          {pass.assigned_driver_phone && (
                            <div className="text-[10px] text-gray-500 font-mono flex items-center space-x-1">
                              <Phone className="w-2.5 h-2.5 text-gray-400" />
                              <span>{pass.assigned_driver_phone}</span>
                            </div>
                          )}
                          {pass.vehicle_details && (
                            <div className="text-[10px] text-gray-400">
                              {pass.vehicle_details}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 text-right space-x-1 whitespace-nowrap">
                      {/* View / Print QR Code */}
                      <button
                        onClick={() => handleOpenQr(guest)}
                        disabled={isOperating}
                        className="px-2.5 py-1 bg-navy text-gold rounded-lg hover:bg-navy-dark text-[11px] font-semibold inline-flex items-center space-x-1"
                        title="Generate or Print QR Passport Card"
                      >
                        {isOperating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <QrCode className="w-3 h-3" />
                        )}
                        <span>QR Pass</span>
                      </button>

                      {/* Manage Transport */}
                      <button
                        onClick={() => handleOpenTransportModal(guest)}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-[11px] inline-flex items-center space-x-1"
                        title="Edit Flight & Chauffeur Details"
                      >
                        <Car className="w-3 h-3 text-gold-dark" />
                        <span>Transport</span>
                      </button>

                      {/* Re-generate or Revoke */}
                      {isPassActive ? (
                        <>
                          <button
                            onClick={() => handleRegenerate(guest)}
                            className="p-1 text-gray-400 hover:text-navy rounded hover:bg-gray-100"
                            title="Regenerate access token"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRevoke(guest.id)}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Revoke access"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Printable QR Modal */}
      {selectedGuestForQr && (
        <PrintableQrPassModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          guest={{
            id: selectedGuestForQr.id,
            name: selectedGuestForQr.name,
            wedding_title:
              weddingsList.find((w) => w.id === selectedGuestForQr.wedding_id)?.title ||
              "Palatial Wedding Celebration",
            hotel_assigned: selectedGuestForQr.hotel_assigned,
            room_number: selectedGuestForQr.room_number,
            table_number: selectedGuestForQr.table_number,
            party_size: selectedGuestForQr.party_size,
            side: selectedGuestForQr.side,
          }}
          rawToken={activeRawToken}
        />
      )}

      {/* Transport Management Modal */}
      {transportModalGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-elevated border border-[#C6A46A]/30 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-navy flex items-center justify-between border-b border-[#C6A46A]/20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-white tracking-wide">
                    Manage Transport Logistics
                  </h3>
                  <p className="text-[11px] text-ivory/70">
                    {transportModalGuest.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTransportModalGuest(null)}
                className="text-ivory/60 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransport} className="p-6 space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 bg-ivory rounded-xl border border-gray-200">
                <span className="font-semibold text-navy">Airport Pickup Required</span>
                <input
                  type="checkbox"
                  checked={pickupRequired}
                  onChange={(e) => setPickupRequired(e.target.checked)}
                  className="w-4 h-4 text-gold rounded focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-navy/70 mb-1">
                  Arrival Flight / Train
                </label>
                <input
                  type="text"
                  value={arrivalFlight}
                  onChange={(e) => setArrivalFlight(e.target.value)}
                  placeholder="e.g. AI-491 (Landing 02:40 PM)"
                  className="w-full px-3 py-2 border rounded-xl border-gray-300 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-navy/70 mb-1">
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Jaipur Airport Terminal 2"
                  className="w-full px-3 py-2 border rounded-xl border-gray-300 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-navy/70 mb-1">
                  Transport Status
                </label>
                <select
                  value={transportStatus}
                  onChange={(e) => setTransportStatus(e.target.value as TransportStatus)}
                  className="w-full px-3 py-2 border rounded-xl border-gray-300 focus:border-gold focus:outline-none font-medium"
                >
                  <option value="Not Required">Not Required</option>
                  <option value="Requested">Requested</option>
                  <option value="Driver Assigned">Driver Assigned</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-navy/70 mb-1">
                    Chauffeur Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Mukesh Sharma"
                    className="w-full px-3 py-2 border rounded-xl border-gray-300 focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-navy/70 mb-1">
                    Chauffeur Phone
                  </label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+91 98290 88221"
                    className="w-full px-3 py-2 border rounded-xl border-gray-300 focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-navy/70 mb-1">
                  Vehicle Details
                </label>
                <input
                  type="text"
                  value={vehicleDetails}
                  onChange={(e) => setVehicleDetails(e.target.value)}
                  placeholder="e.g. Toyota Crysta (RJ-14 TC 2026)"
                  className="w-full px-3 py-2 border rounded-xl border-gray-300 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-navy/70 mb-1">
                  Departure Flight & Notes
                </label>
                <input
                  type="text"
                  value={departureFlight}
                  onChange={(e) => setDepartureFlight(e.target.value)}
                  placeholder="e.g. 6E-204 at 08:30 PM"
                  className="w-full px-3 py-2 border rounded-xl border-gray-300 focus:border-gold focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setTransportModalGuest(null)}
                  className="px-3 py-1.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTransport}
                  className="btn-gold py-1.5 px-4 flex items-center space-x-1"
                >
                  {isSavingTransport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Arrangements</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
