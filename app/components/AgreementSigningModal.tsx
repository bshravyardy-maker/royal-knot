"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  FileSignature,
  X,
  Eraser,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { signContractAction } from "@/actions/enquiries";

interface AgreementSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: {
    id: string;
    couple_name: string;
    wedding_date?: string;
    guests: number;
    budget: number;
    package: string;
    city: string;
    theme?: string;
  };
  onContractSigned: (signedUrl: string, signedAt: string) => void;
}

export function AgreementSigningModal({
  isOpen,
  onClose,
  enquiry,
  onContractSigned,
}: AgreementSigningModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup canvas drawing context
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure modal DOM is mounted
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Handle high-DPI scaling
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);

      ctx.strokeStyle = "#151B2B";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper to get cursor/touch coordinates
  function getCoordinates(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    if ("touches" in e) {
      e.stopPropagation();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    if ("touches" in e) {
      e.preventDefault(); // Prevent mobile scrolling while signing
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setError(null);
  }

  async function handleSignAgreement() {
    if (!hasDrawn || !canvasRef.current) {
      setError("Please sign on the signature pad above to execute the agreement.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");

      const termsText = `This Palatial Wedding Service Agreement is entered into between THE ROYAL KNOT and ${enquiry.couple_name}. The agency shall curate, coordinate, and execute a luxury 3-day wedding celebration in ${enquiry.city} for an estimated ${enquiry.guests} guests under the ${enquiry.package} tier. Total contract valuation is agreed at INR ${enquiry.budget.toLocaleString("en-IN")}, payable in 3 stages: Booking Deposit (25%), Advance Milestone (50%), and Final Settlement (25%).`;

      const res = await signContractAction({
        enquiryId: enquiry.id,
        signaturePngBase64: dataUrl,
        coupleName: enquiry.couple_name,
        totalValue: enquiry.budget,
        package: enquiry.package,
        weddingDate: enquiry.wedding_date,
        guests: enquiry.guests,
        terms: termsText,
      });

      if (!res.success) {
        setError(res.error || "Failed to sign agreement.");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        onContractSigned(res.data?.signedUrl || "", res.data?.signed_at || "");
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while signing.");
      setIsLoading(false);
    }
  }

  const formattedDate = enquiry.wedding_date
    ? new Date(enquiry.wedding_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Date to be confirmed (Target: 90 days)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white rounded-card shadow-elevated border border-[#C6A46A]/30 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-navy flex items-center justify-between border-b border-[#C6A46A]/20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                Palatial Wedding Service Agreement
              </h3>
              <p className="text-xs text-ivory/70">
                Official agency engagement contract for {enquiry.couple_name}
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

        {/* Contract Body & Pad */}
        <div className="p-6 overflow-y-auto space-y-5 text-navy">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Agreement Terms Preview Card */}
          <div className="p-5 rounded-xl bg-ivory/60 border border-[#C6A46A]/25 space-y-4 text-xs font-sans">
            <div className="border-b border-[#C6A46A]/20 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold-dark block">
                  Contract Agreement
                </span>
                <h4 className="text-lg font-serif font-bold text-navy">
                  The Royal Knot Concierge Service Contract
                </h4>
              </div>
              <span className="text-[11px] font-semibold bg-gold/15 text-gold-dark px-2.5 py-1 rounded-full border border-gold/30">
                {enquiry.package}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-navy/80">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Client Couple</span>
                <span className="font-semibold text-navy">{enquiry.couple_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Celebration Date</span>
                <span className="font-semibold text-navy">{formattedDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Guest Manifest</span>
                <span className="font-semibold text-navy">{enquiry.guests} guests</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Agreed Valuation</span>
                <span className="font-bold text-navy">₹{enquiry.budget.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="text-[11px] text-navy/70 leading-relaxed border-t border-gray-200 pt-3 space-y-1.5">
              <p>
                <strong>1. Scope of Palatial Services:</strong> The Royal Knot shall provide bespoke wedding design, vendor management, palace venue approvals, run-sheet timeline control, and day-of orchestration.
              </p>
              <p>
                <strong>2. Standard 3-Stage Payment Terms:</strong> 25% upon formal booking deposit, 50% advance due 30 days prior to the wedding date, and the remaining 25% final settlement due 7 days after the event.
              </p>
              <p>
                <strong>3. Digital Execution:</strong> Both parties acknowledge this digital handwritten signature legally binds the agency and client to the royal engagement terms.
              </p>
            </div>
          </div>

          {/* Signature Canvas Pad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center space-x-1.5">
                <FileSignature className="w-4 h-4 text-gold" />
                <span>Client Digital Signature (Finger or Mouse) *</span>
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-navy/60 hover:text-navy flex items-center space-x-1 py-1 px-2.5 rounded hover:bg-gray-100 transition-colors"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Clear Signature</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-[#C6A46A]/40 rounded-xl bg-white overflow-hidden relative shadow-inner">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-36 cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 text-xs italic">
                  Sign here with your finger or mouse cursor...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] text-gray-500">
            {hasDrawn ? (
              <span className="text-emerald-700 font-medium inline-flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Signature verified
              </span>
            ) : (
              "Signature required to proceed"
            )}
          </p>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-navy hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSignAgreement}
              disabled={!hasDrawn || isLoading}
              className="btn-gold text-xs py-2 px-4 flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Archiving Signature...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sign & Execute Agreement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
