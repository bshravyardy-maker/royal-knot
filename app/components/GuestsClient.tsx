"use client";

import React, { useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Crown,
  Search,
  Plus,
  Phone,
  Mail,
  Utensils,
  Hotel,
  Sparkles,
  Trash2,
  X,
  Loader2,
  Filter,
} from "lucide-react";
import { DemoBadge } from "./DemoBadge";
import { addGuestAction, updateGuestRsvpAction, deleteGuestAction } from "@/actions/guests";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface GuestsClientProps {
  initialGuests: any[];
  weddingsList: { id: string; title: string }[];
}

export function GuestsClient({ initialGuests, weddingsList }: GuestsClientProps) {
  const [guests, setGuests] = useState<any[]>(initialGuests);
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [updatingGuestId, setUpdatingGuestId] = useState<string | null>(null);

  // New Guest Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [weddingId, setWeddingId] = useState(weddingsList[0]?.id || "");
  const [rsvpStatus, setRsvpStatus] = useState<"Attending" | "Declined" | "Pending">("Pending");
  const [roomAllocation, setRoomAllocation] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [dietary, setDietary] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter guests
  const filteredGuests = guests.filter((g) => {
    if (selectedWeddingId !== "All" && g.wedding_id !== selectedWeddingId) return false;
    if (statusFilter !== "All" && g.rsvp_status !== statusFilter) return false;
    if (vipOnly && !g.is_vip) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        (g.phone && g.phone.toLowerCase().includes(q)) ||
        (g.room_allocation && g.room_allocation.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // KPI Calculations
  const relevantGuests = selectedWeddingId !== "All"
    ? guests.filter((g) => g.wedding_id === selectedWeddingId)
    : guests;

  const totalInvited = relevantGuests.length;
  const attendingCount = relevantGuests.filter((g) => g.rsvp_status === "Attending").length;
  const pendingCount = relevantGuests.filter((g) => g.rsvp_status === "Pending").length;
  const declinedCount = relevantGuests.filter((g) => g.rsvp_status === "Declined").length;
  const vipCount = relevantGuests.filter((g) => g.is_vip).length;

  async function handleToggleRsvp(guestId: string, current: string) {
    const next = current === "Attending" ? "Declined" : current === "Declined" ? "Pending" : "Attending";
    setUpdatingGuestId(guestId);

    // Optimistic update
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, rsvp_status: next } : g))
    );

    await updateGuestRsvpAction(guestId, next as any);
    setUpdatingGuestId(null);
  }

  async function handleDeleteGuest(guestId: string) {
    if (!confirm("Remove this guest from the palace roster?")) return;
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
    await deleteGuestAction(guestId);
  }

  async function handleCreateGuest(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      const res = await addGuestAction({
        wedding_id: weddingId,
        name,
        phone,
        email: email || undefined,
        rsvp_status: rsvpStatus,
        room_allocation: roomAllocation || undefined,
        table_number: tableNumber || undefined,
        dietary_requirements: dietary || undefined,
        is_vip: isVip,
        notes: notes || undefined,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to add guest.");
        setIsSaving(false);
      } else {
        const newObj = {
          id: res.data?.id || `guest-${Date.now()}`,
          wedding_id: weddingId,
          name,
          phone,
          email,
          rsvp_status: rsvpStatus,
          room_allocation: roomAllocation,
          table_number: tableNumber,
          dietary_requirements: dietary,
          is_vip: isVip,
          notes,
          is_demo: false,
        };
        setGuests((prev) => [newObj, ...prev]);
        setIsSaving(false);
        setIsAddModalOpen(false);
        // Reset
        setName("");
        setPhone("");
        setEmail("");
        setRoomAllocation("");
        setTableNumber("");
        setDietary("");
        setIsVip(false);
        setNotes("");
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Palace Hospitality & Escort Protocols</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy">
            Guest Management & RSVPs
          </h1>
          <p className="text-xs sm:text-sm text-navy/70 mt-0.5">
            Coordinate palatial room allocations, dietary requests, and royal reception itineraries across 400+ guests.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-gold text-xs py-2.5 px-4 inline-flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Palace Guest</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="royal-card p-4">
          <div className="text-[10px] uppercase font-bold text-gray-400">Total Invites</div>
          <div className="text-2xl font-serif font-bold text-navy mt-1">{totalInvited}</div>
          <div className="text-[11px] text-gray-500">Listed across roster</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-emerald-500">
          <div className="text-[10px] uppercase font-bold text-emerald-800 flex items-center space-x-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Confirmed</span>
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-900 mt-1">{attendingCount}</div>
          <div className="text-[11px] text-emerald-700">Attending banquet</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-amber-500">
          <div className="text-[10px] uppercase font-bold text-amber-800 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending RSVP</span>
          </div>
          <div className="text-2xl font-serif font-bold text-amber-900 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-700">Awaiting response</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-rose-500">
          <div className="text-[10px] uppercase font-bold text-rose-800 flex items-center space-x-1">
            <UserX className="w-3.5 h-3.5 text-rose-600" />
            <span>Declined</span>
          </div>
          <div className="text-2xl font-serif font-bold text-rose-900 mt-1">{declinedCount}</div>
          <div className="text-[11px] text-rose-700">Unable to attend</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-gold bg-gold/5">
          <div className="text-[10px] uppercase font-bold text-[#8C7142] flex items-center space-x-1">
            <Crown className="w-3.5 h-3.5 text-gold" />
            <span>VIP Dignitaries</span>
          </div>
          <div className="text-2xl font-serif font-bold text-gold-dark mt-1">{vipCount}</div>
          <div className="text-[11px] text-gold-dark">Special escort required</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="royal-card p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Wedding Filter */}
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

        {/* Status Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {["All", "Attending", "Pending", "Declined"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === s
                  ? "bg-navy text-gold shadow-sm"
                  : "bg-gray-100 text-navy/70 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}

          <button
            onClick={() => setVipOnly(!vipOnly)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center space-x-1 ${
              vipOnly
                ? "bg-gold text-navy shadow-sm font-bold"
                : "bg-gray-100 text-navy/70 hover:bg-gray-200"
            }`}
          >
            <Crown className="w-3 h-3 text-gold-dark" />
            <span>VIPs Only</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guest or room..."
            className="pl-8 pr-3 py-1.5 text-xs bg-ivory/80 rounded-xl border border-gray-200 focus:outline-none focus:border-gold w-44 sm:w-56"
          />
        </div>
      </div>

      {/* Guests Table */}
      <div className="royal-card p-6 overflow-x-auto">
        {filteredGuests.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            <Users className="w-8 h-8 text-gold/60 mx-auto mb-2" />
            <p className="font-semibold text-navy text-sm">No palace guests found</p>
            <p className="text-gray-400 text-xs mt-1">
              Add a new guest using the &quot;+ Add Palace Guest&quot; button above.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#C6A46A]/20 text-[10px] font-bold uppercase text-navy/60">
                <th className="pb-3 pl-2">Guest Name & Status</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3 text-center">RSVP Decision</th>
                <th className="pb-3">Room Allocation</th>
                <th className="pb-3">Table / Seating</th>
                <th className="pb-3">Dietary Protocol</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredGuests.map((guest) => {
                const isUpdating = updatingGuestId === guest.id;

                return (
                  <tr key={guest.id} className="hover:bg-ivory/60 transition-colors">
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-serif font-bold text-navy text-sm">
                          {guest.name}
                        </span>
                        {guest.is_vip && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Crown className="w-2.5 h-2.5 mr-0.5 text-gold-dark" />
                            VIP
                          </span>
                        )}
                        {guest.is_demo ? <DemoBadge /> : null}
                      </div>
                      {guest.notes && (
                        <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-xs">
                          {guest.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 text-gray-600 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{guest.phone}</span>
                      </div>
                      {guest.email && (
                        <div className="flex items-center space-x-1 text-[10px] text-gray-400 mt-0.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[140px]">{guest.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => handleToggleRsvp(guest.id, guest.rsvp_status)}
                        disabled={isUpdating}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border transition-transform hover:scale-105 ${
                          guest.rsvp_status === "Attending"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : guest.rsvp_status === "Declined"
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                        title="Click to toggle RSVP status"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : null}
                        <span>{guest.rsvp_status}</span>
                      </button>
                    </td>

                    <td className="py-3.5 text-navy font-sans">
                      {guest.room_allocation ? (
                        <div className="inline-flex items-center space-x-1 text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          <Hotel className="w-3 h-3 text-gold" />
                          <span>{guest.room_allocation}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Day guest</span>
                      )}
                    </td>

                    <td className="py-3.5 text-gray-600">
                      {guest.table_number ? (
                        <span className="font-semibold text-navy">
                          Table {guest.table_number}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5">
                      {guest.dietary_requirements ? (
                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Utensils className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                          {guest.dietary_requirements}
                        </span>
                      ) : (
                        <span className="text-gray-400">Standard Shahi</span>
                      )}
                    </td>

                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove guest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Guest Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-card shadow-elevated border border-[#C6A46A]/30 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-navy flex items-center justify-between border-b border-[#C6A46A]/20">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                    Invite Palace Guest
                  </h3>
                  <p className="text-xs text-ivory/70">
                    Register guest for room allocation and banquet seating
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-ivory/60 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGuest} className="p-6 space-y-4 overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Wedding Celebration *
                </label>
                <select
                  value={weddingId}
                  onChange={(e) => setWeddingId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold font-medium text-navy text-xs"
                >
                  {weddingsList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maharaja Gajendra Singh"
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
                    placeholder="guest@palace.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={rsvpStatus}
                    onChange={(e) => setRsvpStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Attending">Attending</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Room / Suite Allocation
                  </label>
                  <input
                    type="text"
                    value={roomAllocation}
                    onChange={(e) => setRoomAllocation(e.target.value)}
                    placeholder="e.g. Rambagh Palace Suite 204"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Table / Seating
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. Royal Lotus Table 4"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Dietary Protocol (Jain, Vegan, Nut-free, Halal)
                </label>
                <input
                  type="text"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  placeholder="e.g. Pure Jain Sattvic (no root vegetables)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="vipCheck"
                  checked={isVip}
                  onChange={(e) => setIsVip(e.target.checked)}
                  className="rounded text-gold focus:ring-gold"
                />
                <label htmlFor="vipCheck" className="text-xs font-bold text-navy cursor-pointer">
                  Mark as Royal VIP Dignitary (Requires escort protocol)
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Concierge Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Flight timings, vintage car pickup, handicap accessibility..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 font-medium text-gray-600 hover:text-navy hover:bg-gray-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-gold py-2 px-4 flex items-center space-x-1.5 disabled:opacity-50 text-xs"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Register Guest</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
