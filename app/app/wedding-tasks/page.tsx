import React from "react";
import { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { WeddingTasksBoardClient } from "@/components/WeddingTasksBoardClient";
import { WeddingTask, TeamMember } from "@/lib/types";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Palace Production Tasks & Operations | THE ROYAL KNOT",
  description:
    "Interactive production checklist and operations Kanban board across all wedding milestones and coordinator assignments.",
};

export default async function WeddingTasksPage({
  searchParams,
}: {
  searchParams: { weddingId?: string; ownerId?: string };
}) {
  let tasks: WeddingTask[] = [];
  let weddingsList: { id: string; title: string; wedding_date?: string; city?: string }[] = [];
  let teamMembers: TeamMember[] = [];
  let errorMsg: string | null = null;

  try {
    const supabase = getSupabaseAdmin();

    const [taskRes, wedRes, teamRes] = await Promise.all([
      supabase.from("wedding_tasks").select("*").order("due_date", { ascending: true }),
      supabase.from("weddings").select("id, title, wedding_date, city").order("wedding_date", { ascending: true }),
      supabase.from("team_members").select("*").order("name", { ascending: true }),
    ]);

    if (taskRes.error) throw taskRes.error;

    tasks = taskRes.data || [];
    weddingsList = wedRes.data || [];
    teamMembers = teamRes.data || [];
  } catch (err: any) {
    console.error("WeddingTasksPage error:", err);
    errorMsg = err.message || "Failed to load wedding tasks.";
  }

  if (errorMsg) {
    return (
      <div className="royal-card p-12 text-center max-w-xl mx-auto my-12">
        <h2 className="text-xl font-serif font-bold text-navy mb-2">
          Unable to Load Wedding Tasks
        </h2>
        <p className="text-xs text-navy/70 mb-4">{errorMsg}</p>
      </div>
    );
  }

  return (
    <WeddingTasksBoardClient
      initialTasks={tasks}
      weddingsList={weddingsList}
      teamMembers={teamMembers}
      initialWeddingFilter={searchParams.weddingId || "All"}
      initialOwnerFilter={searchParams.ownerId || "All"}
    />
  );
}
