import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Star,
  MapPin,
  Phone,
  Mail,
  User,
  Crown,
  FileSpreadsheet,
  Coins,
  Calendar,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { DemoBadge } from "@/components/DemoBadge";
import { Vendor, WeddingVendor, VendorQuote } from "@/lib/types";

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export const revalidate = 0;

export default async function VendorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  let vendor: Vendor | null = null;
  let weddingEngagements: any[] = [];
  let submittedQuotes: any[] = [];
  let errorMsg: string | null = null;

  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch vendor
    const { data: vData, error: vErr } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (vErr) throw vErr;
    if (!vData) notFound();
    vendor = vData;

    // 2. Fetch past and confirmed wedding engagements
    const { data: engData } = await supabase
      .from("wedding_vendors")
      .select(`
        *,
        wedding:weddings (
          id,
          title,
          wedding_date,
          city,
          venue
        ),
        source_quote:vendor_quotes (
          id,
          quote_request_id
        )
      `)
      .eq("vendor_id", id)
      .order("created_at", { ascending: false });

    if (engData) weddingEngagements = engData;

    // 3. Fetch quotations submitted by this vendor
    const { data: qData } = await supabase
      .from("vendor_quotes")
      .select(`
        *,
        quote_request:quote_requests (
          id,
          category,
          guest_count,
          wedding:weddings (
            id,
            title
          )
        )
      `)
      .eq("vendor_id", id)
      .order("created_at", { ascending: false });

    if (qData) submittedQuotes = qData;
  } catch (err: any) {
    console.error("VendorDetailPage error:", err);
    errorMsg = err.message || "Failed to load vendor profile.";
  }

  if (errorMsg) {
    return (
      <div className="royal-card p-12 text-center max-w-xl mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-serif font-bold text-navy mb-2">
          Unable to Load Vendor
        </h2>
        <p className="text-xs text-navy/70 mb-6">{errorMsg}</p>
        <Link href="/vendors" className="btn-gold text-xs py-2 px-4 inline-flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          <span>Return to Vendors</span>
        </Link>
      </div>
    );
  }

  if (!vendor) notFound();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Link href="/vendors" className="hover:underline">
              Artisan Vendors
            </Link>
            <span>/</span>
            <span>Vendor Dossier</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy">
              {vendor.name}
            </h1>
            <div className="flex items-center space-x-1 bg-amber-50 px-2.5 py-1 rounded-md text-amber-800 font-bold text-xs border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{Number(vendor.rating).toFixed(1)} ★</span>
            </div>
            {vendor.is_demo ? (
              <DemoBadge />
            ) : (
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Verified Artisan
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-navy/70 mt-1">
            {vendor.category} • Base City: {vendor.city}
          </p>
        </div>

        <Link
          href="/vendor-quotes"
          className="btn-gold text-xs sm:text-sm py-2 px-4 flex items-center space-x-1.5 self-start md:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>View Active Tender RFPs</span>
        </Link>
      </div>

      {/* Details Grid: Profile & Contacts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="royal-card p-5 space-y-3 md:col-span-1">
          <h3 className="text-lg font-serif font-bold text-navy border-b border-gray-100 pb-2 flex items-center space-x-2">
            <Store className="w-4 h-4 text-gold" />
            <span>Artisan Credentials</span>
          </h3>

          <div className="space-y-2.5 text-xs text-navy/80">
            <div>
              <span className="text-gray-400 block font-semibold">Category Specialization</span>
              <span className="font-semibold text-navy text-sm">{vendor.category}</span>
            </div>

            <div>
              <span className="text-gray-400 block font-semibold">Operational Territory</span>
              <span className="font-semibold text-navy flex items-center mt-0.5">
                <MapPin className="w-3.5 h-3.5 mr-1 text-gold" />
                {vendor.city}
              </span>
            </div>

            {vendor.contact_person && (
              <div>
                <span className="text-gray-400 block font-semibold">Primary Concierge Rep</span>
                <span className="font-semibold text-navy flex items-center mt-0.5">
                  <User className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {vendor.contact_person}
                </span>
              </div>
            )}

            {vendor.phone && (
              <div>
                <span className="text-gray-400 block font-semibold">Direct Telephone</span>
                <span className="font-semibold text-navy flex items-center mt-0.5">
                  <Phone className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {vendor.phone}
                </span>
              </div>
            )}

            {vendor.email && (
              <div>
                <span className="text-gray-400 block font-semibold">Official Email</span>
                <span className="font-semibold text-navy flex items-center mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {vendor.email}
                </span>
              </div>
            )}
          </div>

          {vendor.notes && (
            <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 leading-relaxed">
              <span className="font-bold text-navy block mb-0.5">Curator Notes:</span>
              <p>{vendor.notes}</p>
            </div>
          )}
        </div>

        {/* Right Section: Past Weddings & Proposals */}
        <div className="md:col-span-2 space-y-6">
          {/* Section: Contracted Royal Weddings */}
          <div className="royal-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-navy flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-gold" />
                  <span>Contracted Destination Weddings</span>
                </h3>
                <p className="text-xs text-navy/60">
                  Palatial celebrations where this vendor has been awarded and contracted
                </p>
              </div>
              <span className="text-xs font-semibold bg-gold/15 text-gold-dark px-2.5 py-0.5 rounded-full border border-gold/30">
                {weddingEngagements.length} Engagements
              </span>
            </div>

            {weddingEngagements.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center">
                No contracted weddings recorded yet. Award a quotation to link this vendor to a royal wedding.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 text-xs">
                {weddingEngagements.map((eng) => (
                  <div
                    key={eng.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-ivory/50 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <Link
                        href={`/weddings/${eng.wedding_id}`}
                        className="font-serif text-base font-bold text-navy hover:text-gold-dark transition-colors"
                      >
                        {eng.wedding?.title}
                      </Link>
                      <div className="flex items-center space-x-3 text-[11px] text-gray-500 mt-1">
                        <span>{eng.category || vendor.category}</span>
                        <span>•</span>
                        <span>{eng.wedding?.venue}</span>
                        {eng.wedding?.wedding_date && (
                          <>
                            <span>•</span>
                            <span>{new Date(eng.wedding?.wedding_date).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:self-center">
                      <div className="text-right">
                        <span className="text-sm font-serif font-bold text-navy block">
                          {formatINR(Number(eng.agreed_amount))}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold uppercase">
                          {eng.status}
                        </span>
                      </div>

                      {eng.source_quote?.quote_request_id && (
                        <Link
                          href={`/vendor-quotes/${eng.source_quote.quote_request_id}`}
                          className="text-[11px] font-semibold text-gold-dark hover:underline flex items-center ml-2"
                          title="View Awarded Tender"
                        >
                          <span>Quote RFP &rarr;</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Submitted Proposals / Quotes */}
          <div className="royal-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-navy flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-gold" />
                  <span>Submitted Tender Quotations</span>
                </h3>
                <p className="text-xs text-navy/60">
                  Rate card submissions and procurement status across requests
                </p>
              </div>
              <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                {submittedQuotes.length} Proposals
              </span>
            </div>

            {submittedQuotes.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center">
                No tender quotations submitted by this vendor yet.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 text-xs">
                {submittedQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-ivory/50 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            q.status === "Awarded"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : q.status === "Closed"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {q.status}
                        </span>
                        <span className="font-semibold text-navy">
                          {q.quote_request?.category || "Tender Proposal"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        For {q.quote_request?.wedding?.title} ({q.quote_request?.guest_count} guests)
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <div>
                        <span className="text-sm font-serif font-bold text-navy block">
                          {formatINR(Number(q.total || q.amount))}
                        </span>
                        {q.price_per_plate > 0 && (
                          <span className="text-[10px] text-gray-500 block">
                            ₹{Number(q.price_per_plate).toLocaleString("en-IN")} / plate
                          </span>
                        )}
                      </div>

                      {q.quote_request_id && (
                        <Link
                          href={`/vendor-quotes/${q.quote_request_id}`}
                          className="font-semibold text-[11px] text-gold-dark hover:text-navy inline-flex items-center ml-2"
                        >
                          <span>Compare &rarr;</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
