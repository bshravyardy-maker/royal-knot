"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Users,
  Coins,
  MapPin,
  FileSignature,
  CheckCircle2,
  Lock,
  Crown,
  Tag,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  Loader2,
} from "lucide-react";
import { DemoBadge } from "./DemoBadge";
import { AgreementSigningModal } from "./AgreementSigningModal";
import { RecordDepositModal } from "./RecordDepositModal";
import { updateEnquiryStageAction } from "@/actions/enquiries";
import { Stage, Enquiry, Contract } from "@/lib/types";

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

const STAGES: Stage[] = ["New", "Contacted", "Meeting", "Proposal", "Won", "Lost"];

interface EnquiryDetailClientProps {
  enquiry: Enquiry;
  initialContract: Contract | null;
  initialSignatureSignedUrl?: string | null;
  linkedWeddingId?: string | null;
}

export function EnquiryDetailClient({
  enquiry,
  initialContract,
  initialSignatureSignedUrl,
  linkedWeddingId,
}: EnquiryDetailClientProps) {
  const [currentStage, setCurrentStage] = useState<Stage>(enquiry.stage);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  // Contract states
  const [contract, setContract] = useState<Contract | null>(initialContract);
  const [signedUrl, setSignedUrl] = useState<string | null>(initialSignatureSignedUrl || null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  // Deposit states
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const isContractSigned = Boolean(contract && (contract.signed_at || contract.status === "Signed"));
  const isWon = currentStage === "Won";

  async function handleStageChange(stage: Stage) {
    if (stage === currentStage || isUpdatingStage) return;

    setIsUpdatingStage(true);
    setStageError(null);

    const res = await updateEnquiryStageAction(enquiry.id, stage);
    if (!res.success) {
      setStageError(res.error || "Failed to update pipeline stage.");
    } else {
      setCurrentStage(stage);
    }
    setIsUpdatingStage(false);
  }

  function handleContractSigned(newSignedUrl: string, signedAt: string) {
    setContract((prev) => ({
      ...prev!,
      signed_at: signedAt,
      status: "Signed",
    }));
    if (newSignedUrl) {
      setSignedUrl(newSignedUrl);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Link href="/enquiries" className="hover:underline">
              Enquiries
            </Link>
            <span>/</span>
            <span>Pipeline Detail</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy">
              {enquiry.couple_name}
            </h1>
            {enquiry.is_demo ? (
              <DemoBadge />
            ) : (
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Live Lead
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-navy/70 mt-1">
            Registered lead for luxury destination wedding in {enquiry.city}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sign Agreement Button */}
          {!isContractSigned ? (
            <button
              onClick={() => setIsSignModalOpen(true)}
              className="btn-gold text-xs sm:text-sm py-2.5 px-4 flex items-center space-x-2"
            >
              <FileSignature className="w-4 h-4" />
              <span>Generate & Sign Agreement</span>
            </button>
          ) : (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Service Agreement Signed</span>
            </div>
          )}

          {/* Record Booking Deposit Button */}
          {isWon || linkedWeddingId ? (
            <Link
              href={linkedWeddingId ? `/weddings/${linkedWeddingId}` : "/weddings"}
              className="px-4 py-2.5 rounded-lg bg-navy text-gold font-semibold text-xs sm:text-sm hover:bg-navy-light transition-all flex items-center space-x-2 border border-gold/40 shadow-gold"
            >
              <Crown className="w-4 h-4 text-gold" />
              <span>View Activated Wedding</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          ) : isContractSigned ? (
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="btn-gold text-xs sm:text-sm py-2.5 px-4 flex items-center space-x-2 shadow-gold"
            >
              <Coins className="w-4 h-4" />
              <span>Record Booking Deposit</span>
            </button>
          ) : (
            <button
              disabled
              title="Signed service agreement required before recording deposit"
              className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-400 font-medium text-xs sm:text-sm cursor-not-allowed flex items-center space-x-2 border border-gray-200"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Record Booking Deposit (Locked)</span>
            </button>
          )}
        </div>
      </div>

      {stageError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
          {stageError}
        </div>
      )}

      {/* Stage Pipeline Interactive Control */}
      <div className="royal-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-navy/70">
            Pipeline Progression Stages
          </span>
          {isUpdatingStage && (
            <span className="text-xs text-gold flex items-center space-x-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Updating stage...</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {STAGES.map((st, idx) => {
            const isCurrent = currentStage === st;
            const isPast = STAGES.indexOf(currentStage) > idx;

            return (
              <button
                key={st}
                onClick={() => handleStageChange(st)}
                disabled={isUpdatingStage}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all border text-center flex flex-col items-center justify-center ${
                  isCurrent
                    ? "bg-navy text-gold border-gold shadow-gold font-bold scale-[1.02]"
                    : isPast
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/60"
                    : "bg-white text-navy/60 border-gray-200 hover:bg-ivory"
                }`}
              >
                <span className="text-[10px] opacity-60 font-mono">Stage 0{idx + 1}</span>
                <span className="mt-0.5">{st}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Details: Couple Specs + Service Agreement Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Specifications */}
        <div className="lg:col-span-7 space-y-6">
          <div className="royal-card p-6 space-y-5">
            <h3 className="text-xl font-serif font-bold text-navy border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Palatial Wedding Specifications</span>
              <span className="text-xs font-sans font-semibold bg-gold/15 text-gold-dark px-2.5 py-0.5 rounded-full border border-gold/30">
                {enquiry.package}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-ivory/50 border border-gray-100">
                <span className="text-gray-500 font-semibold block mb-1">Total Valuation Budget</span>
                <span className="text-xl font-serif font-bold text-navy">
                  {formatINR(enquiry.budget)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5 font-mono">
                  INR {enquiry.budget.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-ivory/50 border border-gray-100">
                <span className="text-gray-500 font-semibold block mb-1">Target Guest Manifest</span>
                <span className="text-xl font-serif font-bold text-navy">
                  {enquiry.guests} Guests
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  High-profile banquet protocol
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-ivory/50 border border-gray-100">
                <span className="text-gray-500 font-semibold block mb-1">Palace City</span>
                <span className="text-base font-semibold text-navy flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-gold" />
                  {enquiry.city}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-ivory/50 border border-gray-100">
                <span className="text-gray-500 font-semibold block mb-1">Proposed Wedding Date</span>
                <span className="text-base font-semibold text-navy flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {enquiry.wedding_date
                    ? new Date(enquiry.wedding_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not finalized"}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-gold" />
                  Aesthetic Theme
                </span>
                <span className="font-semibold text-navy">{enquiry.theme || "Palace Romance"}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  Primary Telephone
                </span>
                <span className="font-semibold text-navy">{enquiry.phone}</span>
              </div>

              {enquiry.email && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                    Email Address
                  </span>
                  <span className="font-semibold text-navy">{enquiry.email}</span>
                </div>
              )}

              {enquiry.source && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium flex items-center">
                    <Tag className="w-3.5 h-3.5 mr-2 text-gray-400" />
                    Intake Lead Source
                  </span>
                  <span className="font-medium text-navy">{enquiry.source}</span>
                </div>
              )}
            </div>

            {enquiry.notes && (
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <span className="text-gray-500 font-semibold block mb-1">Planning Notes:</span>
                <p className="text-navy/80 leading-relaxed">{enquiry.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Service Agreement & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Service Agreement Box */}
          <div className="royal-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-serif font-bold text-navy flex items-center space-x-2">
                <FileSignature className="w-5 h-5 text-gold" />
                <span>Service Agreement</span>
              </h3>
              {isContractSigned ? (
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Signed & Archived
                </span>
              ) : (
                <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Pending Signature
                </span>
              )}
            </div>

            {isContractSigned ? (
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <p className="font-semibold text-emerald-950 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Digital Agreement Executed
                  </p>
                  <p className="text-emerald-800 text-[11px]">
                    Signed on {new Date(contract?.signed_at || Date.now()).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {signedUrl ? (
                  <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block tracking-wider">
                      Client Digital Signature Preview
                    </span>
                    <div className="bg-ivory/50 rounded-lg p-2 flex items-center justify-center border border-dashed border-gray-200 min-h-[90px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={signedUrl}
                        alt="Client Signature"
                        className="max-h-20 max-w-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 italic">
                    Signature graphic stored in secure bucket.
                  </p>
                )}

                <div className="text-[11px] text-navy/70 space-y-1">
                  <p>• Valuation: <strong>{formatINR(contract?.total_value || enquiry.budget)}</strong></p>
                  <p>• Status: <strong>{contract?.status || "Signed"}</strong></p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-4 space-y-3 border border-dashed border-gray-200 rounded-xl bg-ivory/30">
                <div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-navy text-xs">Contract Not Signed Yet</p>
                  <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-1">
                    Generate the luxury service agreement and capture the couple&apos;s digital signature to unlock booking deposit.
                  </p>
                </div>
                <button
                  onClick={() => setIsSignModalOpen(true)}
                  className="btn-gold text-xs py-2 px-3.5 inline-flex items-center space-x-1.5"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>Generate Agreement</span>
                </button>
              </div>
            )}
          </div>

          {/* Timeline of Lifecycle Changes */}
          <div className="royal-card p-6 space-y-4">
            <h3 className="text-lg font-serif font-bold text-navy flex items-center space-x-2 border-b border-gray-100 pb-3">
              <Clock className="w-4 h-4 text-gold" />
              <span>Pipeline Audit Timeline</span>
            </h3>

            <div className="relative pl-6 border-l-2 border-[#C6A46A]/30 space-y-4 text-xs">
              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-gold ring-4 ring-white" />
                <p className="font-semibold text-navy">Current Stage: {currentStage}</p>
                <p className="text-[11px] text-gray-500">
                  Last updated {new Date(enquiry.updated_at).toLocaleDateString()}
                </p>
              </div>

              {isContractSigned && (
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white" />
                  <p className="font-semibold text-navy">Service Agreement Executed</p>
                  <p className="text-[11px] text-gray-500">Digital signature securely stored</p>
                </div>
              )}

              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-navy ring-4 ring-white" />
                <p className="font-semibold text-navy">Enquiry Registered</p>
                <p className="text-[11px] text-gray-500">
                  {new Date(enquiry.created_at).toLocaleDateString()} via {enquiry.source || "Direct"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <AgreementSigningModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        enquiry={enquiry}
        onContractSigned={handleContractSigned}
      />

      {/* Record Deposit Modal */}
      <RecordDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        enquiry={enquiry}
      />
    </div>
  );
}
