import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { Enquiry } from "@/lib/types";
import { DemoBadge } from "@/components/DemoBadge";

export const metadata: Metadata = {
  title: "Client Enquiries & Pipeline | THE ROYAL KNOT",
  description:
    "Manage client wedding enquiries, lead consultation stages, budgets, and palatial package proposals.",
};
import {
  Inbox,
  Calendar,
  Users,
  Coins,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  Tag,
} from "lucide-react";

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export const revalidate = 0;

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: { stage?: string };
}) {
  const stageFilter = searchParams.stage;
  let enquiries: Enquiry[] = [];
  let errorMsg = "";

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("enquiries").select("*").order("created_at", { ascending: false });

    if (stageFilter && stageFilter !== "All") {
      query = query.eq("stage", stageFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    enquiries = data || [];
  } catch (err: any) {
    console.error("EnquiriesPage error:", err);
    errorMsg = err.message || "Failed to load enquiries.";
  }

  const stages = ["All", "New", "Contacted", "Meeting", "Proposal", "Won", "Lost"];

  const stageBadgeColor: Record<string, string> = {
    New: "bg-blue-50 text-blue-800 border-blue-200",
    Contacted: "bg-amber-50 text-amber-800 border-amber-200",
    Meeting: "bg-purple-50 text-purple-800 border-purple-200",
    Proposal: "bg-indigo-50 text-indigo-800 border-indigo-200",
    Won: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Lost: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lead Intake & Pipeline</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy">
            Prospective Enquiries
          </h1>
          <p className="text-xs sm:text-sm text-navy/70 mt-0.5">
            Incoming high-net-worth couples requesting palace weddings in Jaipur & Udaipur.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Stage Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {stages.map((st) => {
          const isSelected = (!stageFilter && st === "All") || stageFilter === st;
          return (
            <Link
              key={st}
              href={st === "All" ? "/enquiries" : `/enquiries?stage=${st}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-navy text-gold shadow-sm"
                  : "bg-white text-navy/70 hover:bg-ivory border border-gray-200"
              }`}
            >
              {st}
            </Link>
          );
        })}
      </div>

      {/* Enquiries Grid / List */}
      {enquiries.length === 0 ? (
        <div className="royal-card p-12 text-center">
          <Inbox className="w-10 h-10 text-gold/60 mx-auto mb-3" />
          <h3 className="text-lg font-serif font-bold text-navy">
            No enquiries found in this stage
          </h3>
          <p className="text-xs text-navy/60 max-w-sm mx-auto mt-1 mb-4">
            Create a new enquiry via the &quot;+ New Enquiry&quot; button in the header or run the seed script.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enquiries.map((enquiry) => (
            <div
              key={enquiry.id}
              className="royal-card p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all"
            >
              <div>
                {/* Stage & Demo Header */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      stageBadgeColor[enquiry.stage] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {enquiry.stage}
                  </span>
                  {enquiry.is_demo ? (
                    <DemoBadge />
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Live Lead
                    </span>
                  )}
                </div>

                {/* Couple Names */}
                <Link
                  href={`/enquiries/${enquiry.id}`}
                  className="group block hover:text-gold transition-colors"
                >
                  <h3 className="text-xl font-serif font-bold text-navy group-hover:text-gold-dark transition-colors leading-snug">
                    {enquiry.couple_name}
                  </h3>
                </Link>

                {/* Theme & Package */}
                <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
                  <span className="inline-flex items-center text-[11px] text-[#8C7142] bg-[#F5EEDF] px-2 py-0.5 rounded">
                    <Sparkles className="w-3 h-3 mr-1 text-gold" />
                    {enquiry.theme || "Palace Romance"}
                  </span>
                  <span className="inline-flex items-center text-[11px] text-navy/80 bg-gray-100 px-2 py-0.5 rounded">
                    <Tag className="w-3 h-3 mr-1 text-gray-400" />
                    {enquiry.package}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-navy/80 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-500">
                      <Coins className="w-3.5 h-3.5 mr-1.5 text-gold" />
                      Budget
                    </span>
                    <span className="font-semibold text-navy">
                      {formatINR(enquiry.budget)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-500">
                      <Users className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                      Estimated Guests
                    </span>
                    <span className="font-medium">{enquiry.guests} guests</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-500">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-gold" />
                      Destination
                    </span>
                    <span className="font-medium">{enquiry.city}</span>
                  </div>

                  {enquiry.wedding_date && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-gray-500">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        Target Date
                      </span>
                      <span className="font-medium">
                        {new Date(enquiry.wedding_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-navy/70">
                <span className="flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {enquiry.phone}
                </span>
                <Link
                  href={`/enquiries/${enquiry.id}`}
                  className="font-semibold text-gold-dark hover:text-navy transition-colors inline-flex items-center"
                >
                  <span>Agreement & Deposit &rarr;</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
