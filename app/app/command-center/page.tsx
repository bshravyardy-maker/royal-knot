import { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { CommandCenterClient } from "@/components/CommandCenterClient";
import { ScheduleItem, Incident, TeamMember } from "@/lib/types";

export const metadata: Metadata = {
  title: "Day-of Command Center | THE ROYAL KNOT",
  description: "Real-time wedding day-of run-sheet coordination, vendor check-ins, and live incident logging.",
};

export const dynamic = "force-dynamic";

interface CommandCenterPageProps {
  searchParams: {
    weddingId?: string;
  };
}

export default async function CommandCenterPage({ searchParams }: CommandCenterPageProps) {
  const supabase = getSupabaseAdmin();
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Fetch all weddings for the selector
  const { data: weddingsData, error: weddingsErr } = await supabase
    .from("weddings")
    .select("id, title, wedding_date, venue, city, is_demo")
    .order("wedding_date", { ascending: true });

  if (weddingsErr) console.error("weddings query failed:", weddingsErr);

  const weddings = weddingsData || [];

  // Determine active wedding:
  // - query param weddingId if valid
  // - else wedding happening today (wedding_date === todayStr)
  // - else first available wedding
  let activeWedding = weddings.find((w) => w.id === searchParams.weddingId);
  if (!activeWedding) {
    activeWedding = weddings.find((w) => w.wedding_date === todayStr);
  }
  if (!activeWedding && weddings.length > 0) {
    activeWedding = weddings[0];
  }

  const activeWeddingId = activeWedding?.id;

  let scheduleItems: ScheduleItem[] = [];
  let incidents: Incident[] = [];
  let teamMembers: TeamMember[] = [];

  if (activeWeddingId) {
    // 2. Fetch schedule items with joined vendor and team member.
    // schedule_items has TWO links to team_members (lead_coordinator_id and
    // responsible_member_id), so the join must name the exact column.
    const { data: itemsData, error: itemsErr } = await supabase
      .from("schedule_items")
      .select(`
        *,
        vendor:vendors!responsible_vendor_id(id, name, category, phone),
        team_member:team_members!responsible_member_id(id, name, role, phone)
      `)
      .eq("wedding_id", activeWeddingId)
      .order("scheduled_time", { ascending: true });

    if (itemsErr) console.error("schedule_items query failed:", itemsErr);
    if (!itemsErr && itemsData) {
      scheduleItems = itemsData as unknown as ScheduleItem[];
    }

    // 3. Fetch incidents with joined owner.
    // incidents also has two links to team_members (reported_by and owner_id).
    const { data: incidentsData, error: incidentsErr } = await supabase
      .from("incidents")
      .select(`
        *,
        owner:team_members!owner_id(id, name, role)
      `)
      .eq("wedding_id", activeWeddingId)
      .order("created_at", { ascending: false });

    if (incidentsErr) console.error("incidents query failed:", incidentsErr);
    if (!incidentsErr && incidentsData) {
      incidents = incidentsData as unknown as Incident[];
    }
  }

  // 4. Fetch team members for incident assignment
  const { data: teamData, error: teamErr } = await supabase
    .from("team_members")
    .select("id, name, email, role, phone, is_demo")
    .order("name", { ascending: true });

  if (teamErr) console.error("team_members query failed:", teamErr);
  if (teamData) {
    teamMembers = teamData as unknown as TeamMember[];
  }

  return (
    <CommandCenterClient
      weddings={weddings}
      selectedWeddingId={activeWeddingId || ""}
      initialScheduleItems={scheduleItems}
      initialIncidents={incidents}
      teamMembers={teamMembers}
    />
  );
}