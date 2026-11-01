"use client";

import React, { useState } from "react";
import {
  Crown,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Hotel,
  Car,
  Plane,
  Phone,
  Mail,
  Utensils,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Heart,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { GuestPortalData, GuestRsvpSubmission } from "@/lib/types";
import { submitGuestRsvpAction } from "@/actions/concierge";

interface GuestPassportClientProps {
  initialData: GuestPortalData;
  rawToken: string;
}

export function GuestPassportClient({
  initialData,
  rawToken,
}: GuestPassportClientProps) {
  const [data, setData] = useState<GuestPortalData>(initialData);
  const [activeDay, setActiveDay] = useState<number>(1);

  // RSVP Form State
  const [rsvpDecision, setRsvpDecision] = useState<"Attending" | "Declined">(
    data.guest.rsvp_status === "Declined" ? "Declined" : "Attending"
  );
  const [mealPref, setMealPref] = useState<string>(
    data.passport.meal_preference || "Royal Rajputana Thali"
  );
  const [dietaryNotes, setDietaryNotes] = useState<string>(
    data.guest.dietary_notes || ""
  );
  const [specialAssistance, setSpecialAssistance] = useState<string>(
    data.passport.special_assistance || ""
  );
  const [airportPickup, setAirportPickup] = useState<boolean>(
    data.passport.airport_pickup_required
  );
  const [arrivalFlight, setArrivalFlight] = useState<string>(
    data.passport.arrival_flight_train || ""
  );
  const [departureFlight, setDepartureFlight] = useState<string>(
    data.passport.departure_flight_train || ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const guest = data.guest;
  const wedding = data.wedding;
  const passport = data.passport;
  const concierge = data.conciergeContact;

  // Group itinerary by day
  const days = Array.from(new Set(data.itinerary.map((i) => i.day_number))).sort(
    (a, b) => a - b
  );
  const activeItineraryItems = data.itinerary.filter(
    (item) => item.day_number === activeDay
  );

  async function handleRsvpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccessMsg(null);

    const submission: GuestRsvpSubmission = {
      rsvp_status: rsvpDecision,
      meal_preference: mealPref,
      dietary_notes: dietaryNotes,
      special_assistance: specialAssistance,
      airport_pickup_required: airportPickup,
      arrival_flight_train: arrivalFlight,
      departure_flight_train: departureFlight,
    };

    const res = await submitGuestRsvpAction(rawToken, submission);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitSuccessMsg(res.message || "Your royal RSVP has been recorded!");
      setData((prev) => ({
        ...prev,
        guest: {
          ...prev.guest,
          rsvp_status: rsvpDecision,
          dietary_notes: dietaryNotes ? `${mealPref} • ${dietaryNotes}` : mealPref,
        },
        passport: {
          ...prev.passport,
          meal_preference: mealPref,
          special_assistance: specialAssistance,
          airport_pickup_required: airportPickup,
          arrival_flight_train: arrivalFlight,
          departure_flight_train: departureFlight,
          transport_status: airportPickup && prev.passport.transport_status === "Not Required"
            ? "Requested"
            : prev.passport.transport_status,
        },
      }));
    } else {
      setSubmitError(res.error || "Failed to submit RSVP. Please try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-8 font-sans">
      {/* 1. Royal Header Banner */}
      <div className="relative bg-navy rounded-3xl p-6 sm:p-8 text-white overflow-hidden border border-[#C6A46A]/40 shadow-elevated text-center">
        {/* Decorative Gold Filigree Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-3 border border-gold/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>OFFICIAL WEDDING PASSPORT</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-wide">
          {wedding.couple_names}
        </h1>

        <p className="text-gold font-serif italic text-base sm:text-lg mt-1">
          {wedding.title}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-xs text-ivory/80 pt-4 border-t border-white/10">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-gold" />
            <span>
              {new Date(wedding.wedding_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-gold" />
            <span>{wedding.venue}</span>
          </div>
        </div>
      </div>

      {/* 2. Personalised Welcome Card */}
      <div className="royal-card p-6 border-l-4 border-l-gold relative">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
              Guest of Honor
            </span>
            <h2 className="text-2xl font-serif font-bold text-navy mt-0.5">
              {guest.name}
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">
                Party of {guest.party_size}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-semibold text-gold-dark">
                {guest.side} Side
              </span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                guest.rsvp_status === "Attending"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : guest.rsvp_status === "Declined"
                  ? "bg-rose-50 text-rose-800 border-rose-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              {guest.rsvp_status === "Attending" && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
              <span>RSVP: {guest.rsvp_status}</span>
            </span>
          </div>
        </div>

        <p className="text-xs text-navy/80 mt-4 leading-relaxed italic bg-ivory/60 p-3 rounded-xl border border-gray-100">
          &ldquo;{passport.welcome_message}&rdquo;
        </p>
      </div>

      {/* 3. Three-Day Wedding Itinerary */}
      <div className="royal-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-gold tracking-widest uppercase">
            <Crown className="w-4 h-4 text-gold" />
            <span>Celebration Itinerary</span>
          </div>
          <span className="text-[11px] text-gray-400">3-Day Royal Festivities</span>
        </div>

        {/* Day Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-ivory rounded-xl border border-gray-200">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeDay === d
                  ? "bg-navy text-gold shadow-sm"
                  : "text-navy/70 hover:bg-gray-200"
              }`}
            >
              Day {d}
            </button>
          ))}
        </div>

        {/* Itinerary Events for Selected Day */}
        <div className="space-y-3 pt-2">
          {activeItineraryItems.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              Itinerary details will be posted shortly.
            </p>
          ) : (
            activeItineraryItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-gold/50 transition-all space-y-2 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif font-bold text-base text-navy">
                    {item.event_name}
                  </h4>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-ivory text-gold-dark text-[10px] font-bold border border-gold/20 flex-shrink-0">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>
                      {item.start_time} {item.end_time ? `- ${item.end_time}` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold text-navy">
                      {item.venue_sublocation}
                    </span>
                  </div>
                </div>

                {/* Dress Code Highlight */}
                <div className="p-2.5 rounded-xl bg-gold/5 border border-gold/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gold-dark block">
                      Dress Code
                    </span>
                    <span className="text-navy font-medium">
                      {item.dress_code}
                    </span>
                  </div>
                  {item.location_map_url && (
                    <a
                      href={item.location_map_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-navy text-[11px] font-semibold hover:border-gold flex items-center space-x-1"
                    >
                      <MapPin className="w-3 h-3 text-gold" />
                      <span>Maps</span>
                      <ExternalLink className="w-2.5 h-2.5 text-gray-400" />
                    </a>
                  )}
                </div>

                {item.description && (
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Travel & Accommodation Concierge */}
      <div className="royal-card p-6 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-gold tracking-widest uppercase">
          <Hotel className="w-4 h-4 text-gold" />
          <span>Palatial Stay & Chauffeur Logistics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Hotel Allocation */}
          <div className="p-4 rounded-2xl bg-ivory border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-gray-400">
              Palace Suite Allocation
            </span>
            <div className="font-serif font-bold text-navy text-lg">
              {guest.hotel_assigned || "Palace Hotel"}
            </div>
            <div className="text-xs text-gold-dark font-medium">
              Room / Suite: {guest.room_number || "Imperial Pavilion"}
            </div>
          </div>

          {/* Transport / Chauffeur Details */}
          <div className="p-4 rounded-2xl bg-ivory border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-gray-400">
              Airport Transfer Status
            </span>
            <div className="font-serif font-bold text-navy text-lg flex items-center space-x-1.5">
              <Car className="w-4 h-4 text-gold" />
              <span>{passport.transport_status}</span>
            </div>
            {passport.assigned_driver_name ? (
              <div className="text-xs text-gray-600 mt-1">
                <div>Chauffeur: <span className="font-semibold text-navy">{passport.assigned_driver_name}</span></div>
                {passport.assigned_driver_phone && (
                  <a
                    href={`tel:${passport.assigned_driver_phone}`}
                    className="text-gold-dark font-mono font-semibold flex items-center space-x-1 mt-0.5"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{passport.assigned_driver_phone}</span>
                  </a>
                )}
                {passport.vehicle_details && (
                  <div className="text-[10px] text-gray-400 mt-0.5">{passport.vehicle_details}</div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-gray-500 italic">
                {passport.airport_pickup_required
                  ? "Chauffeur details will appear here 24 hours prior to arrival."
                  : "Request airport pickup in the RSVP form below."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. RSVP & Preference Submission Form */}
      <div className="royal-card p-6 space-y-5 border-2 border-gold/40">
        <div className="flex items-center space-x-2 text-xs font-bold text-gold tracking-widest uppercase">
          <Heart className="w-4 h-4 text-gold" />
          <span>Submit Your Palace RSVP & Preferences</span>
        </div>

        {submitSuccessMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">RSVP Received</p>
              <p className="mt-0.5">{submitSuccessMsg}</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-900 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p>{submitError}</p>
          </div>
        )}

        <form onSubmit={handleRsvpSubmit} className="space-y-4 text-xs">
          {/* Attendance Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-navy mb-2">
              Attendance Confirmation *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center space-x-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  rsvpDecision === "Attending"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-ivory"
                }`}
              >
                <input
                  type="radio"
                  name="rsvp"
                  value="Attending"
                  checked={rsvpDecision === "Attending"}
                  onChange={() => setRsvpDecision("Attending")}
                  className="w-4 h-4 text-emerald-600"
                />
                <span>Joyfully Accepts</span>
              </label>

              <label
                className={`flex items-center space-x-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  rsvpDecision === "Declined"
                    ? "bg-rose-50 border-rose-500 text-rose-900 font-bold"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-ivory"
                }`}
              >
                <input
                  type="radio"
                  name="rsvp"
                  value="Declined"
                  checked={rsvpDecision === "Declined"}
                  onChange={() => setRsvpDecision("Declined")}
                  className="w-4 h-4 text-rose-600"
                />
                <span>Regretfully Declines</span>
              </label>
            </div>
          </div>

          {rsvpDecision === "Attending" && (
            <>
              {/* Banquet Meal Preference */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-navy mb-1.5">
                  Banquet Meal Selection *
                </label>
                <select
                  value={mealPref}
                  onChange={(e) => setMealPref(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold font-medium text-navy text-xs bg-white"
                >
                  <option value="Royal Rajputana Thali">Royal Rajputana Thali (Signature Selection)</option>
                  <option value="Pure Vegetarian Satvik">Pure Vegetarian Satvik Feast</option>
                  <option value="Jain Specialty (No Root Vegetables)">Jain Specialty (No Root Vegetables / Onion / Garlic)</option>
                  <option value="Continental Gourmet">Continental Gourmet / Global Selection</option>
                  <option value="Vegan & Dairy-Free">Vegan & Dairy-Free</option>
                </select>
              </div>

              {/* Dietary Restrictions */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-navy mb-1.5">
                  Allergies & Dietary Restrictions (Optional)
                </label>
                <input
                  type="text"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="e.g. Nut allergy, gluten sensitive, low sodium"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                />
              </div>

              {/* Airport Transfer Request */}
              <div className="p-4 rounded-2xl bg-ivory/80 border border-gray-200 space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={airportPickup}
                    onChange={(e) => setAirportPickup(e.target.checked)}
                    className="w-4 h-4 text-gold rounded focus:ring-gold"
                  />
                  <span className="font-semibold text-navy text-xs">
                    I require complimentary palace airport / railway station pickup
                  </span>
                </label>

                {airportPickup && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-navy/70 mb-1">
                        Arrival Flight / Train Number
                      </label>
                      <input
                        type="text"
                        value={arrivalFlight}
                        onChange={(e) => setArrivalFlight(e.target.value)}
                        placeholder="e.g. AI-491 or Vande Bharat"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-navy/70 mb-1">
                        Departure Flight Number
                      </label>
                      <input
                        type="text"
                        value={departureFlight}
                        onChange={(e) => setDepartureFlight(e.target.value)}
                        placeholder="e.g. 6E-204"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Special Assistance */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-navy mb-1.5">
                  Special Hospitality or Mobility Requests
                </label>
                <input
                  type="text"
                  value={specialAssistance}
                  onChange={(e) => setSpecialAssistance(e.target.value)}
                  placeholder="e.g. Wheelchair assistance at banquet, ground floor preference"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-gold py-3 px-4 font-bold tracking-wide flex items-center justify-center space-x-2 text-xs sm:text-sm shadow-md"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Confirm & Update Royal RSVP</span>
          </button>
        </form>
      </div>

      {/* 6. Concierge Coordination Contact Card */}
      <div className="royal-card p-6 bg-navy text-white border border-[#C6A46A]/40 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-gold tracking-widest uppercase">
          <Sparkles className="w-4 h-4 text-gold" />
          <span>24/7 Palace Concierge Desk</span>
        </div>

        <p className="text-xs text-ivory/80 leading-relaxed">
          For flight delays, room upgrades, or palatial assistance, reach out directly to your assigned concierge team:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gold block">
              Lead Wedding Concierge
            </span>
            <div className="font-semibold text-white">{concierge.lead_name}</div>
            <div className="text-[11px] text-ivory/70">{concierge.role}</div>
            <a
              href={`tel:${concierge.phone}`}
              className="inline-flex items-center space-x-1 text-gold font-mono font-bold mt-1 text-xs"
            >
              <Phone className="w-3 h-3" />
              <span>{concierge.phone}</span>
            </a>
          </div>

          <div className="p-3 rounded-xl bg-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gold block">
              Palace Emergency Protocol
            </span>
            <div className="font-semibold text-white">Emergency Desk Hotline</div>
            <div className="text-[11px] text-ivory/70 font-mono mt-0.5">
              {concierge.emergency_desk}
            </div>
            <a
              href={`https://wa.me/919829011002?text=Hello%20Royal%20Knot%20Concierge`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-emerald-400 font-bold mt-1 text-xs"
            >
              <span>WhatsApp Palace Helpdesk</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-ivory/60">
          <div className="flex items-center space-x-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>End-to-End Encrypted Guest Link</span>
          </div>
          <span>The Royal Knot • Palatial Weddings</span>
        </div>
      </div>
    </div>
  );
}
