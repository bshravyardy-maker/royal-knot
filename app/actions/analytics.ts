"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import crypto from "crypto";

export type ActionResult<T = any> = {
  ok: boolean;
  error?: string;
  message?: string;
  data?: T;
};

/**
 * Generates a public shareable executive token valid for 7 days
 */
export async function createShareLink(): Promise<ActionResult<{ token: string; shareUrl: string }>> {
  try {
    const db = getSupabaseAdmin();
    // 32-char hex random token
    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await db
      .from("share_tokens")
      .insert({
        token,
        expires_at: expiresAt,
        revoked: false,
        is_demo: false,
      })
      .select("token")
      .single();

    if (error) {
      console.error("createShareLink DB error:", error);
      return { ok: false, error: error.message };
    }

    revalidatePath("/analytics");
    return {
      ok: true,
      message: "Executive share link generated (valid for 7 days)",
      data: {
        token: data.token,
        shareUrl: `/share/${data.token}`,
      },
    };
  } catch (err: any) {
    console.error("createShareLink unexpected error:", err);
    return { ok: false, error: err.message || "Failed to generate share link" };
  }
}

/**
 * Revokes an existing executive share link
 */
export async function revokeShareLink(token: string): Promise<ActionResult> {
  try {
    if (!token) return { ok: false, error: "Missing token to revoke" };

    const db = getSupabaseAdmin();
    const { error } = await db
      .from("share_tokens")
      .update({ revoked: true })
      .eq("token", token);

    if (error) {
      console.error("revokeShareLink DB error:", error);
      return { ok: false, error: error.message };
    }

    revalidatePath("/analytics");
    revalidatePath(`/share/${token}`);
    return { ok: true, message: "Share link successfully revoked." };
  } catch (err: any) {
    console.error("revokeShareLink unexpected error:", err);
    return { ok: false, error: err.message || "Failed to revoke share link" };
  }
}
