"use client";

import React, { useState } from "react";
import { AlertTriangle, X, Loader2, ShieldAlert } from "lucide-react";
import { logIncident } from "@/actions/command-center";
import { TeamMember } from "@/lib/types";

interface LogIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId: string;
  weddingTitle: string;
  teamMembers: TeamMember[];
  onIncidentLogged?: () => void;
}

export function LogIncidentModal({
  isOpen,
  onClose,
  weddingId,
  weddingTitle,
  teamMembers,
  onIncidentLogged,
}: LogIncidentModalProps) {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<"Low" | "Medium" | "High">("High");
  const [ownerId, setOwnerId] = useState<string>(teamMembers[0]?.id || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || title.trim().length < 3) {
      setError("Please describe the incident (at least 3 characters).");
      return;
    }

    setIsLoading(true);

    try {
      const res = await logIncident(weddingId, title, severity, ownerId || undefined);

      if (!res.success) {
        setError(res.error || "Failed to log incident.");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setTitle("");
        onClose();
        if (onIncidentLogged) onIncidentLogged();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-card shadow-elevated border border-[#C6A46A]/30 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-navy flex items-center justify-between border-b border-[#C6A46A]/20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                Log Operational Incident
              </h3>
              <p className="text-xs text-ivory/70 line-clamp-1">
                {weddingTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ivory/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
              Incident Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Florist needs a generator for mandap lighting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-ivory/30 text-navy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                Severity Level *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-white text-navy"
              >
                <option value="Low">Low - Minor Delay / Cosmetic</option>
                <option value="Medium">Medium - Vendor Alert</option>
                <option value="High">High - Urgent Action Required</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                Assign Owner
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-white text-navy"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role.split(" ")[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-subtle flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging Incident...</span>
                </>
              ) : (
                <span>Log Incident</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
