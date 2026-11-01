import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { Wedding } from "@/lib/types";
import { DemoBadge } from "@/components/DemoBadge";

export const metadata: Metadata = {
  title: "Destination Weddings Roster | THE ROYAL KNOT",
  description:
    "Active destination wedding portfolio across Jaipur and Udaipur palaces, venues, budgets, and production milestones.",
};
import {
  Crown,
  Calendar,
  MapPin,
  Users,
  Coins,
  Sparkles,
  Building,
} from "lucide-react";

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export const revalidate = 0;

export default async function WeddingsPage({
  searchParams,
}: {
  searchParams: { city?: string; status?: string };
}) {
  let weddings: Wedding[] = [];
  let errorMsg = "";

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("weddings").select("*").order("wedding_date", { ascending: true });

    if (searchParams.city && searchParams.city !== "All") {
      query = query.eq("city", searchParams.city);
    }
    if (searchParams.status && searchParams.status !== "All") {
      query = query.eq("status", searchParams.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    weddings = data || [];
  } catch (err: any) {
    console.error("WeddingsPage error:", err);
    errorMsg = err.message || "Failed to load weddings.";
  }

  const cities = ["All", "Jaipur", "Udaipur"];
  const statuses = ["All", "Planning", "Confirmed", "In Progress", "Completed"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Season 2026/27 Registry</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy">
            Palatial Weddings
          </h1>
          <p className="text-xs sm:text-sm text-navy/70 mt-0.5">
            Full-service and day-of three-day celebrations at heritage palaces and lake resorts.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* City Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-navy/60 mr-1">
            Destination:
          </span>
          {cities.map((ct) => {
            const isSelected = (!searchParams.city && ct === "All") || searchParams.city === ct;
            return (
              <Link
                key={ct}
                href={ct === "All" ? "/weddings" : `/weddings?city=${ct}`}
                className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  isSelected
                    ? "bg-navy text-gold shadow-sm"
                    : "bg-white text-navy/70 hover:bg-ivory border border-gray-200"
                }`}
              >
                {ct}
              </Link>
            );
          })}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-navy/60 mr-1">
            Status:
          </span>
          {statuses.map((st) => {
            const isSelected = (!searchParams.status && st === "All") || searchParams.status === st;
            return (
              <Link
                key={st}
                href={st === "All" ? "/weddings" : `/weddings?status=${st}`}
                className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  isSelected
                    ? "bg-gold text-navy font-bold shadow-sm"
                    : "bg-white text-navy/70 hover:bg-ivory border border-gray-200"
                }`}
              >
                {st}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Weddings Grid */}
      {weddings.length === 0 ? (
        <div className="royal-card p-12 text-center">
          <Crown className="w-10 h-10 text-gold/60 mx-auto mb-3" />
          <h3 className="text-lg font-serif font-bold text-navy">
            No weddings found
          </h3>
          <p className="text-xs text-navy/60 max-w-sm mx-auto mt-1 mb-4">
            Run the demo seed script (<code className="text-gold font-mono">npm run seed</code>) to populate 8 palatial weddings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {weddings.map((w) => (
            <div
              key={w.id}
              className="royal-card p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      w.status === "Confirmed"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : w.status === "Planning"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-blue-50 text-blue-800 border-blue-200"
                    }`}
                  >
                    {w.status}
                  </span>
                  {w.is_demo ? (
                    <DemoBadge />
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Live
                    </span>
                  )}
                </div>

                <Link
                  href={`/weddings/${w.id}`}
                  className="group block hover:text-gold transition-colors"
                >
                  <h3 className="text-xl font-serif font-bold text-navy group-hover:text-gold-dark transition-colors mb-2">
                    {w.title}
                  </h3>
                </Link>

                {w.theme && (
                  <p className="text-xs text-[#8C7142] italic mb-4">
                    &ldquo;{w.theme}&rdquo;
                  </p>
                )}

                <div className="space-y-2.5 text-xs text-navy/80 border-t border-gray-100 pt-3">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gold flex-shrink-0" />
                    <span className="font-medium truncate">{w.venue}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>
                      {new Date(w.wedding_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {w.wedding_end_date &&
                        ` - ${new Date(w.wedding_end_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center text-gray-500">
                      <Users className="w-3.5 h-3.5 mr-1 text-gray-400" />
                      Guests
                    </span>
                    <span className="font-semibold text-navy">
                      {w.guest_count} guests
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-500">
                      <Coins className="w-3.5 h-3.5 mr-1 text-gold" />
                      Total Budget
                    </span>
                    <span className="font-bold text-navy">
                      {formatINR(w.total_budget)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <p className="truncate max-w-[160px]">{w.notes || "Palatial Wedding"}</p>
                <Link
                  href={`/weddings/${w.id}`}
                  className="font-semibold text-gold-dark hover:text-navy transition-colors inline-flex items-center ml-2 flex-shrink-0"
                >
                  <span>Milestones &rarr;</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
