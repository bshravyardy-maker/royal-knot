import { Metadata } from "next";
import Link from "next/link";
import { getGuestPassportByToken } from "@/actions/concierge";
import { GuestPassportClient } from "@/components/GuestPassportClient";
import { Lock, Sparkles, AlertTriangle, ShieldX } from "lucide-react";

export const dynamic = "force-dynamic";

interface PassportPageProps {
  params: {
    token: string;
  };
}

export async function generateMetadata({
  params,
}: PassportPageProps): Promise<Metadata> {
  return {
    title: "Royal Wedding Passport & Concierge | THE ROYAL KNOT",
    description:
      "Personalised digital wedding passport, multi-day palatial celebration itinerary, and concierge services.",
  };
}

export default async function PassportPage({ params }: PassportPageProps) {
  const rawToken = params.token;
  const res = await getGuestPassportByToken(rawToken);

  if (!res.success || !res.data) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-ivory">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-200 p-8 text-center shadow-subtle space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <ShieldX className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-gold tracking-widest">
              Security Protocol
            </div>
            <h1 className="text-2xl font-serif font-bold text-navy">
              Passport Access Restricted
            </h1>
          </div>
          <p className="text-xs text-navy/70 leading-relaxed">
            {res.error ||
              "This personalised wedding passport link does not exist, has expired, or was revoked."}
          </p>

          <div className="p-3.5 bg-ivory rounded-2xl border border-gray-200 text-left text-xs space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">
              Concierge Guidance
            </span>
            <p className="text-navy/80 text-[11px]">
              If you believe this is an error, please request a refreshed link from the wedding hosts or call our palace coordinator at <span className="font-semibold text-gold-dark">+91 98290 11002</span>.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 rounded-xl bg-navy text-gold text-xs font-semibold hover:bg-navy-dark transition-colors"
            >
              Palace Coordination Desk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory py-4 sm:py-8">
      <GuestPassportClient initialData={res.data} rawToken={rawToken} />
    </div>
  );
}
