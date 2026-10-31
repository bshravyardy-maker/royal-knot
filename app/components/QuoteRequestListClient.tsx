"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Crown,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  Plus,
  AlertCircle,
  Tag,
  Clock,
} from "lucide-react";
import { DemoBadge } from "./DemoBadge";
import { NewQuoteRequestModal } from "./NewQuoteRequestModal";
import { QuoteRequest } from "@/lib/types";

interface QuoteRequestListClientProps {
  initialRequests: QuoteRequest[];
  weddingsList: { id: string; title: string; guest_count: number }[];
  errorMsg: string | null;
}

export function QuoteRequestListClient({
  initialRequests,
  weddingsList,
  errorMsg,
}: QuoteRequestListClientProps) {
  const [requests, setRequests] = useState<QuoteRequest[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Open") return r.status === "Open";
    if (statusFilter === "Closed") return r.status === "Closed" || r.status === "Awarded";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Artisan Tender & Procurement</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy">
            Vendor Quote Requests (RFPs)
          </h1>
          <p className="text-xs sm:text-sm text-navy/70 mt-0.5">
            Tender scopes across palatial weddings, compare aligned rate cards, and award contracts.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-gold text-xs sm:text-sm py-2 px-4 flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Quote Request</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        {["All", "Open", "Closed"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              statusFilter === st
                ? "bg-navy text-gold shadow-sm"
                : "bg-white text-navy/70 hover:bg-ivory border border-gray-200"
            }`}
          >
            {st} Requests
          </button>
        ))}
      </div>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="royal-card p-12 text-center">
          <FileSpreadsheet className="w-10 h-10 text-gold/60 mx-auto mb-3" />
          <h3 className="text-lg font-serif font-bold text-navy">
            No quote requests found
          </h3>
          <p className="text-xs text-navy/60 max-w-sm mx-auto mt-1 mb-5">
            Create your first palatial quote request for catering, decor, or photography.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-gold text-xs py-2 px-4 inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quote Request</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((req) => {
            const isClosed = req.status === "Closed" || req.status === "Awarded";

            return (
              <div
                key={req.id}
                className="royal-card p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all"
              >
                <div>
                  {/* Status & Demo Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isClosed
                          ? "bg-purple-50 text-purple-800 border-purple-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {req.status}
                    </span>
                    {req.is_demo ? (
                      <DemoBadge />
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Live Tender
                      </span>
                    )}
                  </div>

                  {/* Category Title */}
                  <h3 className="text-xl font-serif font-bold text-navy mb-1.5">
                    {req.category}
                  </h3>

                  {/* Wedding Title Tag */}
                  {req.wedding && (
                    <div className="text-xs text-navy/70 font-medium flex items-center space-x-1.5 mb-3">
                      <Crown className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                      <span className="truncate">{req.wedding.title}</span>
                    </div>
                  )}

                  {/* Scope snippet */}
                  {req.scope_description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                      {req.scope_description}
                    </p>
                  )}

                  {/* Metadata Specs */}
                  <div className="space-y-2 text-xs text-navy/80 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        Target Guests
                      </span>
                      <span className="font-semibold text-navy">
                        {req.guest_count} guests
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center">
                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-gold" />
                        Quotes Received
                      </span>
                      <span className="font-bold text-navy">
                        {req.quotes_count || 0} proposals
                      </span>
                    </div>

                    {req.requested_deadline && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          Tender Deadline
                        </span>
                        <span className="font-medium text-navy">
                          {new Date(req.requested_deadline).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    Created {new Date(req.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/vendor-quotes/${req.id}`}
                    className="font-semibold text-xs text-gold-dark hover:text-navy inline-flex items-center space-x-1"
                  >
                    <span>Compare & Award</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Request Modal */}
      <NewQuoteRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        weddingsList={weddingsList}
      />
    </div>
  );
}
