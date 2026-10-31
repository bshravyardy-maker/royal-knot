import React from "react";

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-[#C6A46A]/15 text-[#8C7142] border border-[#C6A46A]/30 ${className}`}
      title="Seeded fictional demo record"
    >
      Demo
    </span>
  );
}
