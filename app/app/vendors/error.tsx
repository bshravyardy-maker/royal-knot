"use client";

import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function VendorsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="royal-card p-12 text-center max-w-md mx-auto my-12 space-y-4 border border-rose-200 bg-rose-50/20">
      <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-serif font-bold text-navy">Vendor Directory Unavailable</h3>
      <p className="text-xs text-navy/70">{error.message || "An error occurred while loading curated vendors."}</p>
      <button
        onClick={reset}
        className="btn-gold text-xs py-2.5 px-6 inline-flex items-center space-x-2"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
