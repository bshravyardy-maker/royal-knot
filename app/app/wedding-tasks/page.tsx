import React from "react";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { WeddingTasksBoardClient } from "@/components/WeddingTasksBoardClient";
import { WeddingTask, TeamMember } from "@/lib/types";

export const revalidate = 0;

export default async function WeddingTasksPage({
  searchParams,
}: {
  searchParams: { weddingId?: string; ownerId?: string };
}) {
  let tasks: WeddingTask[] = [];
  let weddingsList: { id: string; title: string }[] = [];
  let teamMembers: TeamMember[] = [];
  let errorMsg: string | null = null;

  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch wedding tasks
    const { data: taskData, error: taskErr } = await supabase
      .from("wedding_tasks")
      .select("*")
      .order("due_date", { ascending: true });

    if (taskErr) throw taskErr;
    tasks = taskData || [];

    // 2. Fetch weddings list for filter
    const { data: wedData, error: wedErr } = await supabase
      .from("weddings")
      .select("id, title")
      .order("wedding_date", { ascending: true });

    if (!wedErr && wedData) {
      weddingsList = wedData;
    }

    // 3. Fetch team members for filter & card owner display
    const { data: teamData, error: teamErr } = await supabase
      .from("team_members")
      .select("*")
      .order("name", { ascending: true });

    if (!teamErr && teamData) {
      teamMembers = teamData;
    }
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
