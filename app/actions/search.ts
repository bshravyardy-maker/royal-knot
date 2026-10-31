"use server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface SearchResultItem {
  id: string;
  category: "wedding" | "enquiry" | "vendor";
  title: string;
  subtitle: string;
  href: string;
  tag?: string;
}

export async function liveSearchAction(query: string): Promise<SearchResultItem[]> {
  const q = query?.trim();
  if (!q || q.length < 2) return [];

  try {
    const supabase = getSupabaseAdmin();

    const [weddingsRes, enquiriesRes, vendorsRes] = await Promise.all([
      supabase
        .from("weddings")
        .select("id, title, venue, city, status")
        .or(`title.ilike.%${q}%,venue.ilike.%${q}%,city.ilike.%${q}%,theme.ilike.%${q}%`)
        .limit(4),
      supabase
        .from("enquiries")
        .select("id, couple_name, city, stage, package")
        .or(`couple_name.ilike.%${q}%,city.ilike.%${q}%,theme.ilike.%${q}%,notes.ilike.%${q}%`)
        .limit(4),
      supabase
        .from("vendors")
        .select("id, name, category, city, rating")
        .or(`name.ilike.%${q}%,category.ilike.%${q}%,city.ilike.%${q}%`)
        .limit(4),
    ]);

    const results: SearchResultItem[] = [];

    ((weddingsRes.data || []) as any[]).forEach((w: any) => {
      results.push({
        id: `wed-${w.id}`,
        category: "wedding",
        title: w.title,
        subtitle: `${w.venue} • ${w.city}`,
        href: `/weddings/${w.id}`,
        tag: w.status,
      });
    });

    ((enquiriesRes.data || []) as any[]).forEach((e: any) => {
      results.push({
        id: `enq-${e.id}`,
        category: "enquiry",
        title: e.couple_name,
        subtitle: `${e.package} • ${e.city}`,
        href: `/enquiries/${e.id}`,
        tag: e.stage,
      });
    });

    ((vendorsRes.data || []) as any[]).forEach((v: any) => {
      results.push({
        id: `ven-${v.id}`,
        category: "vendor",
        title: v.name,
        subtitle: `${v.category} • ${v.city} (${v.rating}★)`,
        href: `/vendors/${v.id}`,
        tag: v.category,
      });
    });

    return results;
  } catch (err) {
    console.error("liveSearchAction error:", err);
    return [];
  }
}
