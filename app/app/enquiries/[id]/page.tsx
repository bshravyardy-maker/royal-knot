import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Inbox, AlertCircle } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { EnquiryDetailClient } from "@/components/EnquiryDetailClient";
import { Enquiry, Contract } from "@/lib/types";

export const revalidate = 0;

export default async function EnquiryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  let enquiry: Enquiry | null = null;
  let contract: Contract | null = null;
  let signatureSignedUrl: string | null = null;
  let linkedWeddingId: string | null = null;
  let errorMessage: string | null = null;

  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch enquiry
    const { data: enqData, error: enqError } = await supabase
      .from("enquiries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (enqError) throw enqError;
    if (!enqData) {
      notFound();
    }
    enquiry = enqData;

    // 2. Fetch contract if any
    const { data: contractData, error: contractError } = await supabase
      .from("contracts")
      .select("*")
      .eq("enquiry_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!contractError && contractData) {
      contract = contractData;

      if (contractData.signature_url) {
        // Generate signed URL from private bucket
        const { data: signedData } = await supabase.storage
          .from("signatures")
          .createSignedUrl(contractData.signature_url, 60 * 60 * 24);

        if (signedData?.signedUrl) {
          signatureSignedUrl = signedData.signedUrl;
        }
      }
    }

    // 3. Check if wedding is already created
    const { data: weddingData } = await supabase
      .from("weddings")
      .select("id")
      .eq("enquiry_id", id)
      .maybeSingle();

    if (weddingData) {
      linkedWeddingId = weddingData.id;
    }
  } catch (err: any) {
    console.error("EnquiryDetailPage error:", err);
    errorMessage = err.message || "Failed to load enquiry record.";
  }

  if (errorMessage) {
    return (
      <div className="royal-card p-12 text-center max-w-xl mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-serif font-bold text-navy mb-2">
          Unable to Load Enquiry
        </h2>
        <p className="text-xs text-navy/70 mb-6">{errorMessage}</p>
        <Link href="/enquiries" className="btn-gold text-xs py-2 px-4 inline-flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          <span>Return to Enquiries</span>
        </Link>
      </div>
    );
  }

  if (!enquiry) {
    notFound();
  }

  return (
    <EnquiryDetailClient
      enquiry={enquiry}
      initialContract={contract}
      initialSignatureSignedUrl={signatureSignedUrl}
      linkedWeddingId={linkedWeddingId}
    />
  );
}
