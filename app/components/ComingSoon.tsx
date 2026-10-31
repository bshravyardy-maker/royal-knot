import React from "react";
import { Sparkles, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

interface ComingSoonProps {
  title: string;
  phase: string;
  description: string;
}

export function ComingSoon({ title, phase, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="max-w-lg w-full bg-white rounded-card p-10 border border-[#C6A46A]/30 shadow-card relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C6A46A]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-navy/5 rounded-full blur-2xl pointer-events-none" />

        <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-navy text-gold flex items-center justify-center shadow-gold">
          <Sparkles className="w-7 h-7" />
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#C6A46A]/15 text-[#8C7142] border border-[#C6A46A]/30 mb-4">
          <Lock className="w-3 h-3 mr-1.5" />
          {phase}
        </span>

        <h2 className="text-3xl font-serif font-bold text-navy mb-3">
          {title}
        </h2>

        <p className="text-navy/70 text-sm leading-relaxed mb-8">
          {description}
        </p>

        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium text-navy hover:bg-ivory border border-gray-200 transition-colors inline-flex items-center justify-center"
          >
            Return to Overview
          </Link>
          <Link
            href="/enquiries"
            className="w-full sm:w-auto btn-gold text-sm inline-flex items-center justify-center space-x-1.5"
          >
            <span>View Active Enquiries</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
