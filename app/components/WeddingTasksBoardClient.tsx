"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  AlertTriangle,
  Calendar,
  User,
  Filter,
  Sparkles,
  Crown,
  ChevronDown,
  Loader2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { DemoBadge } from "./DemoBadge";
import { updateTaskStageAction } from "@/actions/enquiries";
import { TaskStage, WeddingTask, TeamMember } from "@/lib/types";

const STAGES: TaskStage[] = ["To Plan", "In Progress", "Blocked", "Done"];

interface WeddingTasksBoardClientProps {
  initialTasks: WeddingTask[];
  weddingsList: { id: string; title: string }[];
  teamMembers: TeamMember[];
  initialWeddingFilter?: string;
  initialOwnerFilter?: string;
}

export function WeddingTasksBoardClient({
  initialTasks,
  weddingsList,
  teamMembers,
  initialWeddingFilter = "All",
  initialOwnerFilter = "All",
}: WeddingTasksBoardClientProps) {
  const [tasks, setTasks] = useState<WeddingTask[]>(initialTasks);
  const [weddingFilter, setWeddingFilter] = useState<string>(initialWeddingFilter);
  const [ownerFilter, setOwnerFilter] = useState<string>(initialOwnerFilter);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Filter tasks locally based on dropdown selections
  const filteredTasks = tasks.filter((task) => {
    if (weddingFilter !== "All" && task.wedding_id !== weddingFilter) {
      return false;
    }
    if (ownerFilter !== "All" && task.owner !== ownerFilter) {
      return false;
    }
    return true;
  });

  const todayStr = new Date().toISOString().split("T")[0];

  async function handleStageChange(taskId: string, newStage: TaskStage) {
    setUpdatingTaskId(taskId);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, stage: newStage } : t))
    );

    const res = await updateTaskStageAction(taskId, newStage);
    if (!res.success) {
      // Revert if error
      alert(`Could not update task: ${res.error}`);
    }
    setUpdatingTaskId(null);
  }

  const columnConfig: Record<TaskStage, { title: string; color: string; badge: string; border: string }> = {
    "To Plan": {
      title: "To Plan",
      color: "bg-gray-100 text-gray-800",
      badge: "bg-gray-200 text-gray-700",
      border: "border-gray-200",
    },
    "In Progress": {
      title: "In Progress",
      color: "bg-blue-50 text-blue-800",
      badge: "bg-blue-100 text-blue-700",
      border: "border-blue-200",
    },
    Blocked: {
      title: "Blocked",
      color: "bg-rose-50 text-rose-800",
      badge: "bg-rose-100 text-rose-700",
      border: "border-rose-200",
    },
    Done: {
      title: "Done",
      color: "bg-emerald-50 text-emerald-800",
      badge: "bg-emerald-100 text-emerald-700",
      border: "border-emerald-200",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Operations & Timeline Control</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy">
            Palatial Wedding Tasks
          </h1>
          <p className="text-xs sm:text-sm text-navy/70 mt-0.5">
            Synchronized 7-phase execution board across destination celebrations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Wedding Filter */}
          <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm text-xs">
            <Crown className="w-3.5 h-3.5 text-gold" />
            <select
              value={weddingFilter}
              onChange={(e) => setWeddingFilter(e.target.value)}
              className="bg-transparent font-medium text-navy focus:outline-none pr-2 cursor-pointer"
            >
              <option value="All">All Weddings ({weddingsList.length})</option>
              {weddingsList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          </div>

          {/* Owner Filter */}
          <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm text-xs">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="bg-transparent font-medium text-navy focus:outline-none pr-2 cursor-pointer"
            >
              <option value="All">All Planners ({teamMembers.length})</option>
              {teamMembers.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name} ({tm.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {STAGES.map((stage) => {
          const colTasks = filteredTasks.filter((t) => t.stage === stage);
          const config = columnConfig[stage];

          return (
            <div
              key={stage}
              className={`rounded-card bg-ivory/40 border ${config.border} p-4 flex flex-col min-h-[620px] shadow-sm`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200/80">
                <div className="flex items-center space-x-2">
                  <h3 className="font-serif font-bold text-base text-navy">
                    {config.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${config.badge}`}
                  >
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Task Cards Column */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                    No tasks in {stage}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isOverdue =
                      task.due_date &&
                      task.due_date < todayStr &&
                      task.stage !== "Done";

                    const ownerMember = teamMembers.find((m) => m.id === task.owner);
                    const weddingItem = weddingsList.find((w) => w.id === task.wedding_id);

                    return (
                      <div
                        key={task.id}
                        className={`royal-card p-4 space-y-3 relative transition-all hover:shadow-card ${
                          isOverdue ? "border-rose-300 ring-1 ring-rose-300/50" : ""
                        }`}
                      >
                        {/* Header: Phase & Demo Badge */}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold px-2 py-0.5 rounded bg-[#F5EEDF] text-[#8C7142] border border-[#C6A46A]/25">
                            {task.phase || "Milestone"}
                          </span>
                          {task.is_demo ? <DemoBadge /> : null}
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-serif font-semibold text-navy leading-snug">
                          {task.title}
                        </h4>

                        {/* Wedding tag */}
                        {weddingItem && (
                          <div className="text-[10px] text-gray-500 font-medium flex items-center space-x-1 truncate">
                            <Crown className="w-3 h-3 text-gold flex-shrink-0" />
                            <span className="truncate">{weddingItem.title}</span>
                          </div>
                        )}

                        {/* Due Date & Overdue Indicator */}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                          {task.due_date ? (
                            <div
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                isOverdue
                                  ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {isOverdue ? (
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                              ) : (
                                <Calendar className="w-3 h-3 text-gray-400" />
                              )}
                              <span>
                                {isOverdue ? "Overdue: " : ""}
                                {new Date(task.due_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400">No deadline</span>
                          )}

                          {ownerMember && (
                            <div
                              className="w-6 h-6 rounded-full bg-navy text-gold text-[10px] font-serif font-bold flex items-center justify-center shadow-sm"
                              title={`${ownerMember.name} (${ownerMember.role})`}
                            >
                              {ownerMember.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Interactive Stage Dropdown */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase text-gray-400">
                            Move Stage:
                          </span>
                          <div className="relative">
                            <select
                              value={task.stage}
                              disabled={updatingTaskId === task.id}
                              onChange={(e) => handleStageChange(task.id, e.target.value as TaskStage)}
                              className="text-[11px] font-semibold text-navy bg-ivory/80 border border-gray-200 rounded-lg px-2 py-1 pr-6 focus:outline-none focus:border-gold cursor-pointer"
                            >
                              {STAGES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            {updatingTaskId === task.id ? (
                              <Loader2 className="w-3 h-3 text-gold animate-spin absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
