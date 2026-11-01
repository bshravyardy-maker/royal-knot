"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  Crown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { generateQrDataUrl } from "@/lib/qrcode";

interface PrintableQrPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: {
    id: string;
    name: string;
    wedding_title?: string;
    hotel_assigned?: string;
    room_number?: string;
    table_number?: string;
    party_size?: number;
    side?: string;
  };
  rawToken: string;
}

export function PrintableQrPassModal({
  isOpen,
  onClose,
  guest,
  rawToken,
}: PrintableQrPassModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const passportUrl = typeof window !== "undefined"
    ? `${window.location.origin}/passport/${rawToken}`
    : `/passport/${rawToken}`;

  useEffect(() => {
    if (rawToken) {
      generateQrDataUrl(passportUrl, {
        width: 320,
        margin: 2,
        darkColor: "#151B2B",
        lightColor: "#FFFFFF",
      }).then((url) => setQrDataUrl(url));
    }
  }, [passportUrl, rawToken]);

  if (!isOpen) return null;

  function handleCopyLink() {
    navigator.clipboard.writeText(passportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadPng() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `RoyalKnot-Pass-${guest.name.replace(/\s+/g, "-")}.png`;
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-elevated border border-[#C6A46A]/30 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-navy flex items-center justify-between border-b border-[#C6A46A]/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white tracking-wide">
                Digital Wedding Passport Card
              </h3>
              <p className="text-[11px] text-ivory/70">
                Personalised QR code for guest access & palace security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ivory/60 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Content - Printable Area */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div
            id="printable-passport-card"
            className="relative bg-gradient-to-b from-[#FAF7F0] via-white to-[#F5EFE6] border-2 border-[#C6A46A] rounded-2xl p-6 text-center shadow-sm"
          >
            {/* Royal Gold Corners Decor */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#C6A46A]" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#C6A46A]" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#C6A46A]" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#C6A46A]" />

            <div className="flex items-center justify-center space-x-2 text-[10px] font-bold text-gold tracking-widest uppercase mb-1">
              <Sparkles className="w-3 h-3" />
              <span>THE ROYAL KNOT • PALACE CONCIERGE</span>
            </div>

            <h4 className="text-2xl font-serif font-bold text-navy">
              {guest.name}
            </h4>

            <p className="text-xs text-navy/70 mt-1 font-medium">
              {guest.wedding_title || "Palatial Wedding Celebration"}
            </p>

            {/* QR Code Container */}
            <div className="my-4 inline-block p-3 bg-white rounded-xl border border-[#C6A46A]/40 shadow-sm">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${guest.name}`}
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  Generating QR Code...
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-left bg-white/80 p-3 rounded-xl border border-gray-200 text-[11px]">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">
                  Hotel & Room
                </span>
                <span className="font-semibold text-navy">
                  {guest.hotel_assigned || "Palace Hotel"} {guest.room_number ? `(${guest.room_number})` : ""}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">
                  Table / Party
                </span>
                <span className="font-semibold text-navy">
                  {guest.table_number || "Reserved Seating"} (Party of {guest.party_size || 1})
                </span>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 mt-3 italic">
              Scan with smartphone camera to view 3-day itinerary, transport, and submit RSVP.
            </p>
          </div>

          {/* Direct Link Box */}
          <div className="bg-ivory/80 p-3 rounded-xl border border-gray-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
              Direct Guest Portal URL
            </span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={passportUrl}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-[11px] text-navy font-mono truncate focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1 bg-navy text-gold rounded-lg text-xs font-semibold hover:bg-navy-dark flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <a
                href={passportUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-gray-400 hover:text-navy rounded"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-emerald-700 text-[11px] font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>SHA-256 Hashed Link</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPng}
              className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download QR</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-gold py-1.5 px-3.5 flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
