"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileSignature,
  FileCheck2,
  Clock,
  Coins,
  Crown,
  Search,
  Plus,
  Building,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react";
import { DemoBadge } from "./DemoBadge";
import { createContractAction, updateContractStatusAction } from "@/actions/contracts";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ContractsClientProps {
  initialContracts: any[];
  weddingsList: { id: string; title: string }[];
}

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export function ContractsClient({ initialContracts, weddingsList }: ContractsClientProps) {
  const [contracts, setContracts] = useState<any[]>(initialContracts);
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [weddingId, setWeddingId] = useState(weddingsList[0]?.id || "");
  const [contractType, setContractType] = useState<"Client Agreement" | "Vendor Contract" | "Venue Booking">("Client Agreement");
  const [contractValue, setContractValue] = useState("8500000");
  const [status, setStatus] = useState<"Draft" | "Sent" | "Signed" | "Terminated">("Signed");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Map of weddings
  const weddingMap = new Map<string, string>();
  weddingsList.forEach((w) => weddingMap.set(w.id, w.title));

  const filteredContracts = contracts.filter((c: any) => {
    if (selectedWeddingId !== "All" && c.wedding_id !== selectedWeddingId) return false;
    if (typeFilter !== "All" && c.contract_type !== typeFilter) return false;
    if (statusFilter !== "All" && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const wTitle = weddingMap.get(c.wedding_id)?.toLowerCase() || "";
      return c.title.toLowerCase().includes(q) || wTitle.includes(q);
    }
    return true;
  });

  const totalValue = filteredContracts.reduce((sum: number, c: any) => sum + Number((c as any).contract_value || 0), 0);
  const signedCount = filteredContracts.filter((c: any) => c.status === "Signed").length;
  const draftCount = filteredContracts.filter((c: any) => c.status === "Draft" || c.status === "Sent").length;

  async function handleStatusChange(contractId: string, nextStatus: any) {
    setUpdatingId(contractId);
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: nextStatus,
              signed_at: nextStatus === "Signed" ? new Date().toISOString() : null,
            }
          : c
      )
    );
    await updateContractStatusAction(contractId, nextStatus);
    setUpdatingId(null);
  }

  async function handleCreateContract(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      const res = await createContractAction({
        wedding_id: weddingId,
        title,
        contract_type: contractType,
        contract_value: Number(contractValue) || 0,
        status,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to register contract.");
        setIsSaving(false);
      } else {
        const newObj = {
          id: res.data?.id || `contract-${Date.now()}`,
          wedding_id: weddingId,
          title,
          contract_type: contractType,
          contract_value: Number(contractValue) || 0,
          status,
          signed_at: status === "Signed" ? new Date().toISOString() : null,
          is_demo: false,
        };
        setContracts((prev) => [newObj, ...prev]);
        setIsSaving(false);
        setIsModalOpen(false);
        setTitle("");
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Legal Instruments & Palatial Retainers</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy">
            Contracts & Agreements Vault
          </h1>
          <p className="text-xs sm:text-sm text-navy/70 mt-0.5">
            Binding service agreements, vendor procurement contracts, and venue booking leases across Rajasthan palaces.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-gold text-xs py-2.5 px-4 inline-flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract Document</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="royal-card p-4">
          <div className="text-[10px] uppercase font-bold text-gray-400">Total Registered</div>
          <div className="text-2xl font-serif font-bold text-navy mt-1">{filteredContracts.length}</div>
          <div className="text-[11px] text-gray-500">Legal agreements</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-gold">
          <div className="text-[10px] uppercase font-bold text-[#8C7142] flex items-center space-x-1">
            <Coins className="w-3.5 h-3.5 text-gold" />
            <span>Total Value Secured</span>
          </div>
          <div className="text-2xl font-serif font-bold text-navy mt-1">{formatINR(totalValue)}</div>
          <div className="text-[11px] text-gray-500">Under executed contracts</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-emerald-500">
          <div className="text-[10px] uppercase font-bold text-emerald-800 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Signed & Enforced</span>
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-900 mt-1">{signedCount}</div>
          <div className="text-[11px] text-emerald-700">Digital signature verified</div>
        </div>

        <div className="royal-card p-4 border-l-4 border-l-amber-500">
          <div className="text-[10px] uppercase font-bold text-amber-800 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Draft / Pending</span>
          </div>
          <div className="text-2xl font-serif font-bold text-amber-900 mt-1">{draftCount}</div>
          <div className="text-[11px] text-amber-700">Awaiting client signature</div>
        </div>
      </div>

      {/* Filter Bar */}
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

        {/* Contract Type Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {["All", "Client Agreement", "Vendor Contract", "Venue Booking"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                typeFilter === t
                  ? "bg-navy text-gold shadow-sm"
                  : "bg-gray-100 text-navy/70 hover:bg-gray-200"
              }`}
            >
              {t}
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
            placeholder="Search agreement..."
            className="pl-8 pr-3 py-1.5 text-xs bg-ivory/80 rounded-xl border border-gray-200 focus:outline-none focus:border-gold w-44"
          />
        </div>
      </div>

      {/* Table */}
      <div className="royal-card p-6 overflow-x-auto">
        {filteredContracts.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            <FileSignature className="w-8 h-8 text-gold/60 mx-auto mb-2" />
            <p className="font-semibold text-navy text-sm">No contracts found</p>
            <p className="text-gray-400 text-xs mt-1">
              Register a new legal contract using the button above.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#C6A46A]/20 text-[10px] font-bold uppercase text-navy/60">
                <th className="pb-3 pl-2">Contract Title</th>
                <th className="pb-3">Wedding Party</th>
                <th className="pb-3">Type</th>
                <th className="pb-3 text-right">Contract Value</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3">Signed Date</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredContracts.map((c) => {
                const wTitle = weddingMap.get(c.wedding_id) || "Palatial Wedding";
                const isUpdating = updatingId === c.id;

                return (
                  <tr key={c.id} className="hover:bg-ivory/60 transition-colors">
                    <td className="py-3.5 pl-2 font-serif font-bold text-navy text-sm">
                      <div className="flex items-center space-x-1.5">
                        <FileSignature className="w-4 h-4 text-gold flex-shrink-0" />
                        <span>{c.title}</span>
                        {c.is_demo ? <DemoBadge /> : null}
                      </div>
                    </td>

                    <td className="py-3.5 text-gray-700">
                      <div className="truncate max-w-[200px]">{wTitle}</div>
                    </td>

                    <td className="py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-navy">
                        {(c as any).contract_type || "Agreement"}
                      </span>
                    </td>

                    <td className="py-3.5 text-right font-bold text-navy font-mono">
                      {formatINR((c as any).contract_value || 0)}
                    </td>

                    <td className="py-3.5 text-center">
                      <select
                        value={c.status}
                        disabled={isUpdating}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border focus:outline-none cursor-pointer ${
                          c.status === "Signed"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : c.status === "Sent"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : c.status === "Terminated"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {["Draft", "Sent", "Signed", "Terminated"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3.5 text-gray-500 whitespace-nowrap">
                      {c.signed_at ? (
                        <div className="flex items-center space-x-1 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {new Date(c.signed_at).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Pending signature</span>
                      )}
                    </td>

                    <td className="py-3.5 text-right">
                      {c.wedding_id && (
                        <Link
                          href={`/weddings/${c.wedding_id}`}
                          className="text-gold-dark hover:text-navy text-xs font-semibold inline-flex items-center space-x-1"
                        >
                          <span>Review</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-card shadow-elevated border border-[#C6A46A]/30 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xl font-serif font-bold text-navy flex items-center space-x-2">
                <FileSignature className="w-5 h-5 text-gold" />
                <span>Register Contract Document</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-navy p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-lg">{formError}</div>
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Contract Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Palatial Wedding Services Agreement"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Contract Type
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs"
                  >
                    <option value="Client Agreement">Client Agreement</option>
                    <option value="Vendor Contract">Vendor Contract</option>
                    <option value="Venue Booking">Venue Booking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Contract Value (₹)
                  </label>
                  <input
                    type="number"
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Execution Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-gold text-xs font-semibold"
                >
                  <option value="Signed">Signed (Digitally Executed)</option>
                  <option value="Sent">Sent (Pending Signature)</option>
                  <option value="Draft">Drafting</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Register Contract</span>
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
