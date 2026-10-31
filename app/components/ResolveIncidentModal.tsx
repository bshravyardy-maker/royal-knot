"use client";

import React, { useState } from "react";
import { CheckCircle2, X, Loader2, AlertCircle } from "lucide-react";
import { resolveIncident } from "@/actions/command-center";
import { Incident } from "@/lib/types";

interface ResolveIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  onResolved?: () => void;
}

export function ResolveIncidentModal({
  isOpen,
  onClose,
  incident,
  onResolved,
}: ResolveIncidentModalProps) {
  const [resolution, setResolution] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !incident) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!resolution.trim() || resolution.trim().length < 3) {
      setError("Please provide a resolution note detailing corrective actions taken.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await resolveIncident(incident!.id, resolution);

      if (!res.success) {
        setError(res.error || "Failed to resolve incident.");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setResolution("");
        onClose();
        if (onResolved) onResolved();
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
            <div className="w-9 h-9 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                Resolve Incident
              </h3>
              <p className="text-xs text-ivory/70 line-clamp-1">
                {incident.title}
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
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-ivory/60 rounded-xl border border-[#C6A46A]/20 text-xs text-navy/80 space-y-1">
            <div className="font-semibold text-navy">{incident.title}</div>
            <div className="text-[11px] text-gray-500">
              Severity: <span className="font-bold text-red-600">{incident.severity}</span>
              {incident.owner && <span> • Owner: {incident.owner.name}</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
              Resolution Note *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Backup generator dispatched from palace engineering stores and connected within 10 minutes."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-ivory/30 text-navy resize-none"
            />
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
              className="px-5 py-2.5 rounded-lg bg-green-700 hover:bg-green-800 text-white text-xs font-semibold shadow-subtle flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Closing Incident...</span>
                </>
              ) : (
                <span>Confirm Resolution</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
