import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { Vendor } from "@/lib/types";
import { DemoBadge } from "@/components/DemoBadge";

export const metadata: Metadata = {
  title: "Artisan Vendor Directory | THE ROYAL KNOT",
  description:
    "Curated directory of luxury wedding artisans across catering, decor, photography, music, and royal logistics in Rajasthan.",
};
import {
  Store,
  Star,
  MapPin,
  Phone,
  Mail,
  User,
  Sparkles,
} from "lucide-react";

export const revalidate = 0;

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: { category?: string; city?: string };
}) {
  let vendors: Vendor[] = [];
  let errorMsg = "";

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("vendors").select("*").order("rating", { ascending: false });

    if (searchParams.category && searchParams.category !== "All") {
      query = query.eq("category", searchParams.category);
    }
    if (searchParams.city && searchParams.city !== "All") {
      query = query.eq("city", searchParams.city);
    }

    const { data, error } = await query;
    if (error) throw error;
    vendors = data || [];
  } catch (err: any) {
    console.error("VendorsPage error:", err);
    errorMsg = err.message || "Failed to load vendors.";
  }

  const categories = [
    "All",
    "Catering",
    "Decor & Florals",
    "Music and DJ",
    "Photography",
    "Makeup",
    "Transport",
    "Lighting",
    "Mehendi",
    "Pandit",
    "Sound",
    "Valet",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Artisan Network</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy">
            Luxury Wedding Vendors
          </h1>
          <p className="text-xs sm:text-sm text-navy/70 mt-0.5">
            ~18 specialized vendor partners per wedding across Jaipur & Udaipur palatial circuits.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const isSelected = (!searchParams.category && cat === "All") || searchParams.category === cat;
          return (
            <a
              key={cat}
              href={cat === "All" ? "/vendors" : `/vendors?category=${encodeURIComponent(cat)}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-navy text-gold shadow-sm"
                  : "bg-white text-navy/70 hover:bg-ivory border border-gray-200"
              }`}
            >
              {cat}
            </a>
          );
        })}
      </div>

      {/* Vendors Grid */}
      {vendors.length === 0 ? (
        <div className="royal-card p-12 text-center">
          <Store className="w-10 h-10 text-gold/60 mx-auto mb-3" />
          <h3 className="text-lg font-serif font-bold text-navy">
            No vendors registered in this category
          </h3>
          <p className="text-xs text-navy/60 max-w-sm mx-auto mt-1 mb-4">
            Run the demo seed script (<code className="text-gold font-mono">npm run seed</code>) to populate 10 luxury vendors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="royal-card p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5EEDF] text-[#8C7142] border border-[#C6A46A]/30">
                    {vendor.category}
                  </span>
                  {vendor.is_demo ? (
                    <DemoBadge />
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Verified
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between">
                  <Link
                    href={`/vendors/${vendor.id}`}
                    className="hover:text-gold-dark transition-colors"
                  >
                    <h3 className="text-xl font-serif font-bold text-navy hover:text-gold-dark transition-colors">
                      {vendor.name}
                    </h3>
                  </Link>
                  <div className="flex items-center space-x-1 bg-amber-50 px-2 py-0.5 rounded-md text-amber-700 font-semibold text-xs border border-amber-200 flex-shrink-0 ml-2">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{Number(vendor.rating).toFixed(1)}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-navy/80 border-t border-gray-100 pt-3 mt-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-3.5 h-3.5 mr-2 text-gold flex-shrink-0" />
                    <span>Base City: <strong className="text-navy">{vendor.city}</strong></span>
                  </div>

                  {vendor.contact_person && (
                    <div className="flex items-center text-gray-600">
                      <User className="w-3.5 h-3.5 mr-2 text-gray-400 flex-shrink-0" />
                      <span>{vendor.contact_person}</span>
                    </div>
                  )}

                  {vendor.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-3.5 h-3.5 mr-2 text-gray-400 flex-shrink-0" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}

                  {vendor.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-3.5 h-3.5 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {vendor.notes && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                  <p className="line-clamp-2">{vendor.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
