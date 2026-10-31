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

  // 1. Fetch weddings and team members concurrently
  const [weddingsRes, teamRes] = await Promise.all([
    supabase
      .from("weddings")
      .select("id, title, wedding_date, venue, city, is_demo")
      .order("wedding_date", { ascending: true }),
    supabase
      .from("team_members")
      .select("id, name, email, role, phone, is_demo")
      .order("name", { ascending: true }),
  ]);

  const weddings = (weddingsRes.data || []) as any[];
  const teamMembers = (teamRes.data || []) as unknown as TeamMember[];

  // Determine active wedding
  let activeWedding = weddings.find((w: any) => w.id === searchParams.weddingId);
  if (!activeWedding) {
    activeWedding = weddings.find((w: any) => w.wedding_date === todayStr);
  }
  if (!activeWedding && weddings.length > 0) {
    activeWedding = weddings[0];
  }

  const activeWeddingId = activeWedding?.id;

  let scheduleItems: ScheduleItem[] = [];
  let incidents: Incident[] = [];

  if (activeWeddingId) {
    // 2. Fetch schedule items and incidents concurrently
    const [itemsRes, incidentsRes] = await Promise.all([
      supabase
        .from("schedule_items")
        .select(`
          *,
          vendor:vendors!responsible_vendor_id(id, name, category, phone),
          team_member:team_members!responsible_member_id(id, name, role, phone)
        `)
        .eq("wedding_id", activeWeddingId)
        .order("scheduled_time", { ascending: true }),
      supabase
        .from("incidents")
        .select(`
          *,
          owner:team_members!owner_id(id, name, role)
        `)
        .eq("wedding_id", activeWeddingId)
        .order("created_at", { ascending: false }),
    ]);

    if (itemsRes.data) {
      scheduleItems = itemsRes.data as unknown as ScheduleItem[];
    }
    if (incidentsRes.data) {
      incidents = incidentsRes.data as unknown as Incident[];
    }
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