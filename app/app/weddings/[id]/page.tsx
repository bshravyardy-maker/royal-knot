import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Crown,
  Calendar,
  MapPin,
  Users,
  Coins,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckSquare,
  ShieldCheck,
  Building,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { DemoBadge } from "@/components/DemoBadge";
import { Wedding, ClientPayment, WeddingTask } from "@/lib/types";

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export const revalidate = 0;

export default async function WeddingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  let wedding: Wedding | null = null;
  let payments: ClientPayment[] = [];
  let tasks: WeddingTask[] = [];
  let errorMsg: string | null = null;

  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch wedding
    const { data: wedData, error: wedErr } = await supabase
      .from("weddings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (wedErr) throw wedErr;
    if (!wedData) {
      notFound();
    }
    wedding = wedData;

    // 2. Fetch 3 payment milestones
    const { data: payData, error: payErr } = await supabase
      .from("client_payments")
      .select("*")
      .eq("wedding_id", id)
      .order("due_date", { ascending: true });

    if (!payErr && payData) {
      payments = payData;
    }

    // 3. Fetch wedding tasks
    const { data: taskData, error: taskErr } = await supabase
      .from("wedding_tasks")
      .select("*")
      .eq("wedding_id", id)
      .order("due_date", { ascending: true });

    if (!taskErr && taskData) {
      tasks = taskData;
    }
  } catch (err: any) {
    console.error("WeddingDetailPage error:", err);
    errorMsg = err.message || "Failed to load wedding details.";
  }

  if (errorMsg) {
    return (
      <div className="royal-card p-12 text-center max-w-xl mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-serif font-bold text-navy mb-2">
          Unable to Load Wedding
        </h2>
        <p className="text-xs text-navy/70 mb-6">{errorMsg}</p>
        <Link href="/weddings" className="btn-gold text-xs py-2 px-4 inline-flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          <span>Return to Weddings</span>
        </Link>
      </div>
    );
  }

  if (!wedding) notFound();

  // Task progress calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.stage === "Done").length;
  const inProgressTasks = tasks.filter((t) => t.stage === "In Progress").length;
  const blockedTasks = tasks.filter((t) => t.stage === "Blocked").length;
  const toPlanTasks = tasks.filter((t) => t.stage === "To Plan").length;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Milestone order mapping
  const milestoneOrder: Record<string, number> = { Booking: 1, Advance: 2, Final: 3 };
  const sortedPayments = [...payments].sort(
    (a, b) => (milestoneOrder[a.milestone] || 99) - (milestoneOrder[b.milestone] || 99)
  );

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Link href="/weddings" className="hover:underline">
              Weddings
            </Link>
            <span>/</span>
            <span>Celebration Overview</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy">
              {wedding.title}
            </h1>
            {wedding.is_demo ? (
              <DemoBadge />
            ) : (
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Live Wedding
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-navy/70 mt-1">
            {wedding.venue} • {wedding.city}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/wedding-tasks?weddingId=${wedding.id}`}
            className="btn-gold text-xs sm:text-sm py-2 px-4 flex items-center space-x-1.5"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Open Tasks Board</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="royal-card p-4">
          <span className="text-[11px] text-gray-500 font-semibold uppercase block">
            Celebration Date
          </span>
          <span className="text-lg font-serif font-bold text-navy mt-1 flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-1.5" />
            {new Date(wedding.wedding_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5 block">
            3-Day Heritage Protocol
          </span>
        </div>

        <div className="royal-card p-4">
          <span className="text-[11px] text-gray-500 font-semibold uppercase block">
            Guest Manifest
          </span>
          <span className="text-lg font-serif font-bold text-navy mt-1 flex items-center">
            <Users className="w-4 h-4 text-gold mr-1.5" />
            {wedding.guest_count} Guests
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5 block">
            Palace accommodations reserved
          </span>
        </div>

        <div className="royal-card p-4">
          <span className="text-[11px] text-gray-500 font-semibold uppercase block">
            Total Contract Value
          </span>
          <span className="text-lg font-serif font-bold text-navy mt-1 flex items-center">
            <Coins className="w-4 h-4 text-gold mr-1.5" />
            {formatINR(wedding.total_budget)}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5 block">
            Agreed royal budget
          </span>
        </div>

        <div className="royal-card p-4">
          <span className="text-[11px] text-gray-500 font-semibold uppercase block">
            Execution Status
          </span>
          <div className="mt-1 flex items-center space-x-2">
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                wedding.status === "Confirmed"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : wedding.status === "Planning"
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              {wedding.status}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 mt-0.5 block">
            {wedding.theme || "Palace Romance"}
          </span>
        </div>
      </div>

      {/* Task Progress Bar Section */}
      <div className="royal-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-serif font-bold text-navy flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-gold" />
              <span>Wedding Task Milestones Progress</span>
            </h3>
            <p className="text-xs text-navy/60">
              Synchronized 7-phase run-sheet checklist ({completedTasks} of {totalTasks} tasks completed)
            </p>
          </div>
          <span className="text-2xl font-serif font-bold text-navy self-start sm:self-auto">
            {completionPct}% Complete
          </span>
        </div>

        {/* Progress Bar Graphic */}
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-gold via-gold-light to-emerald-500 transition-all duration-700"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {/* Breakdown Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
            <span className="text-gray-500 text-[10px] uppercase font-semibold block">To Plan</span>
            <span className="font-bold text-navy text-sm">{toPlanTasks}</span>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
            <span className="text-blue-700 text-[10px] uppercase font-semibold block">In Progress</span>
            <span className="font-bold text-blue-900 text-sm">{inProgressTasks}</span>
          </div>
          <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
            <span className="text-rose-700 text-[10px] uppercase font-semibold block">Blocked</span>
            <span className="font-bold text-rose-900 text-sm">{blockedTasks}</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-700 text-[10px] uppercase font-semibold block">Done</span>
            <span className="font-bold text-emerald-900 text-sm">{completedTasks}</span>
          </div>
        </div>
      </div>

      {/* 3 Payment Milestones Section */}
      <div className="royal-card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-xl font-serif font-bold text-navy flex items-center space-x-2">
              <Coins className="w-5 h-5 text-gold" />
              <span>3-Stage Client Payment Milestones</span>
            </h3>
            <p className="text-xs text-navy/60">
              Contract schedule: Booking deposit (immediate), Advance (~30 days prior), and Final (+7 days post-event)
            </p>
          </div>
        </div>

        {sortedPayments.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl text-xs text-gray-500">
            No payment milestones found for this wedding.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {sortedPayments.map((p, idx) => {
              const isPaid = p.status === "Paid";
              const isOverdue = p.status === "Overdue";

              return (
                <div
                  key={p.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                    isPaid
                      ? "bg-emerald-50/50 border-emerald-200 shadow-sm"
                      : isOverdue
                      ? "bg-rose-50/50 border-rose-200"
                      : "bg-white border-gray-200 hover:border-gold/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                        Milestone 0{idx + 1}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : isOverdue
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <h4 className="text-lg font-serif font-bold text-navy">
                      {p.milestone} Stage
                    </h4>

                    <p className="text-2xl font-serif font-bold text-navy mt-1">
                      {formatINR(Number(p.amount))}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      INR {Number(p.amount).toLocaleString("en-IN")}
                    </p>

                    <div className="mt-4 pt-3 border-t border-gray-200/60 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Due Date:</span>
                        <span className="font-semibold text-navy">
                          {new Date(p.due_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {p.paid_at && (
                        <div className="flex items-center justify-between text-emerald-800">
                          <span>Settled At:</span>
                          <span className="font-medium">
                            {new Date(p.paid_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}

                      {p.transaction_reference && (
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>Reference:</span>
                          <span className="font-mono text-[10px]">{p.transaction_reference}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    {isPaid ? (
                      <span className="text-emerald-700 font-semibold flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Verified in bank
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-gold" />
                        Awaiting milestone
                      </span>
                    )}
                    {p.is_demo ? <DemoBadge /> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tasks Preview List */}
      <div className="royal-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-xl font-serif font-bold text-navy">
              Palatial Task Timeline Preview
            </h3>
            <p className="text-xs text-navy/60">
              Tasks generated from wedding package templates
            </p>
          </div>
          <Link
            href={`/wedding-tasks?weddingId=${wedding.id}`}
            className="text-xs font-semibold text-gold-dark hover:underline flex items-center"
          >
            <span>View All ({tasks.length}) on Kanban</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {tasks.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">
            No tasks registered for this wedding.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 text-xs">
            {tasks.slice(0, 8).map((task) => (
              <div
                key={task.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-ivory/50 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      task.stage === "Done"
                        ? "bg-emerald-100 text-emerald-800"
                        : task.stage === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : task.stage === "Blocked"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {task.stage}
                  </span>
                  <span className="font-medium text-navy">{task.title}</span>
                  {task.phase && (
                    <span className="text-[10px] text-[#8C7142] bg-[#F5EEDF] px-1.5 py-0.5 rounded">
                      {task.phase}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-gray-500 text-[11px]">
                  {task.due_date && (
                    <span>
                      Due: {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  {task.is_demo ? <DemoBadge /> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
