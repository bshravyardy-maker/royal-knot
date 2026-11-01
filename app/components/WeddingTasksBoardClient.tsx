"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Circle,
  LayoutGrid,
  ListCheck,
  Search,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { DemoBadge } from "./DemoBadge";
import { updateTaskStageAction } from "@/actions/enquiries";
import { TaskStage, WeddingTask, TeamMember } from "@/lib/types";

const STAGES: TaskStage[] = ["To Plan", "In Progress", "Blocked", "Done"];
const PHASES = ["All", "Planning", "Countdown", "Day-of", "Post-event"];

interface WeddingTasksBoardClientProps {
  initialTasks: WeddingTask[];
  weddingsList: { id: string; title: string; wedding_date?: string; city?: string }[];
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
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>(
    initialWeddingFilter && initialWeddingFilter !== "All" ? initialWeddingFilter : "All"
  );
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "done">("pending");
  const [activePhase, setActivePhase] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"checklist" | "kanban">("checklist");
  const [ownerFilter, setOwnerFilter] = useState<string>(initialOwnerFilter);
  const [taskSearch, setTaskSearch] = useState<string>("");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    if (initialWeddingFilter && initialWeddingFilter !== "All") {
      setSelectedWeddingId(initialWeddingFilter);
    }
  }, [initialWeddingFilter]);

  const todayStr = new Date().toISOString().split("T")[0];

  // Map of team members
  const memberMap = new Map<string, TeamMember>();
  teamMembers.forEach((m) => memberMap.set(m.id, m));

  // Filter tasks for the selected wedding
  const weddingTasks = tasks.filter((t) => {
    if (selectedWeddingId !== "All" && t.wedding_id !== selectedWeddingId) return false;
    if (ownerFilter !== "All" && t.owner !== ownerFilter) return false;
    if (activePhase !== "All" && t.phase !== activePhase) return false;
    if (taskSearch.trim()) {
      const q = taskSearch.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.phase && t.phase.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Split into Done vs Not Done
  const doneTasks = weddingTasks.filter((t) => t.stage === "Done");
  const notDoneTasks = weddingTasks.filter((t) => t.stage !== "Done");

  // Displayed tasks based on activeTab
  const displayedTasks =
    activeTab === "pending"
      ? notDoneTasks
      : activeTab === "done"
      ? doneTasks
      : weddingTasks;

  // Selected Wedding Object
  const selectedWedding = weddingsList.find((w) => w.id === selectedWeddingId);

  // Calculate completion percentage for each wedding
  const weddingProgressMap = new Map<string, { done: number; total: number; pct: number }>();
  weddingsList.forEach((w) => {
    const wTasks = tasks.filter((t) => t.wedding_id === w.id);
    const doneCount = wTasks.filter((t) => t.stage === "Done").length;
    const totalCount = wTasks.length;
    const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    weddingProgressMap.set(w.id, { done: doneCount, total: totalCount, pct });
  });

  const selectedStats = selectedWeddingId !== "All"
    ? weddingProgressMap.get(selectedWeddingId) || { done: 0, total: 0, pct: 0 }
    : {
        done: tasks.filter((t) => t.stage === "Done").length,
        total: tasks.length,
        pct: tasks.length > 0 ? Math.round((tasks.filter((t) => t.stage === "Done").length / tasks.length) * 100) : 0,
      };

  async function handleToggleDone(taskId: string, currentStage: TaskStage) {
    const nextStage: TaskStage = currentStage === "Done" ? "In Progress" : "Done";
    setUpdatingTaskId(taskId);

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              stage: nextStage,
              completed_at: nextStage === "Done" ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    const res = await updateTaskStageAction(taskId, nextStage);
    if (!res.success) {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, stage: currentStage } : t))
      );
      alert(`Could not update task: ${res.error}`);
    }
    setUpdatingTaskId(null);
  }

  async function handleStageChange(taskId: string, newStage: TaskStage) {
    setUpdatingTaskId(taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, stage: newStage } : t))
    );

    const res = await updateTaskStageAction(taskId, newStage);
    if (!res.success) {
      alert(`Could not update task: ${res.error}`);
    }
    setUpdatingTaskId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Operational Execution & Deliverables</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy">
            Wedding Tasks & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-navy/70 mt-0.5">
            Click any wedding below to inspect what&apos;s done, track pending milestones, and toggle task progress.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("checklist")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "checklist"
                ? "bg-white text-navy shadow-sm"
                : "text-navy/60 hover:text-navy"
            }`}
          >
            <ListCheck className="w-4 h-4 text-gold" />
            <span>Interactive Checklist</span>
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "kanban"
                ? "bg-white text-navy shadow-sm"
                : "text-navy/60 hover:text-navy"
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-gold" />
            <span>Kanban Board</span>
          </button>
        </div>
      </div>

      {/* 1. CLICKABLE WEDDING SELECTION CARDS */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-navy/70">
            Select Wedding Celebration ({weddingsList.length})
          </span>
          <span className="text-xs text-navy/50">Click a card to filter tasks</span>
        </div>

        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedWeddingId("All")}
            className={`p-3.5 rounded-2xl border text-left flex-shrink-0 w-52 transition-all ${
              selectedWeddingId === "All"
                ? "bg-navy text-ivory border-gold shadow-md ring-2 ring-gold/40"
                : "bg-white hover:bg-ivory/60 border-gray-200 text-navy"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                All Celebrations
              </span>
              <Crown className="w-3.5 h-3.5 text-gold" />
            </div>
            <div className="text-sm font-serif font-bold truncate">All Weddings</div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={selectedWeddingId === "All" ? "text-ivory/80" : "text-gray-500"}>
                {tasks.length} total tasks
              </span>
              <span className="font-bold text-gold">{selectedStats.pct}%</span>
            </div>
          </button>

          {weddingsList.map((w) => {
            const isSelected = selectedWeddingId === w.id;
            const stats = weddingProgressMap.get(w.id) || { done: 0, total: 0, pct: 0 };

            return (
              <button
                key={w.id}
                onClick={() => setSelectedWeddingId(w.id)}
                className={`p-3.5 rounded-2xl border text-left flex-shrink-0 w-64 transition-all ${
                  isSelected
                    ? "bg-navy text-ivory border-gold shadow-md ring-2 ring-gold/40 scale-[1.02]"
                    : "bg-white hover:bg-ivory/60 border-gray-200 text-navy"
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-[10px]">
                  <span className={isSelected ? "text-gold font-bold" : "text-gray-400 font-semibold"}>
                    {w.city || "Palace Wedding"}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    stats.pct === 100
                      ? "bg-emerald-100 text-emerald-800"
                      : isSelected
                      ? "bg-gold/20 text-gold-light"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {stats.done}/{stats.total} Done
                  </span>
                </div>

                <div className="text-xs font-serif font-bold truncate mb-1">
                  {w.title}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200/50 rounded-full h-1.5 overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-300 ${
                      stats.pct === 100
                        ? "bg-emerald-500"
                        : isSelected
                        ? "bg-gold"
                        : "bg-navy"
                    }`}
                    style={{ width: `${stats.pct}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className={isSelected ? "text-ivory/70" : "text-gray-400"}>
                    {stats.total - stats.done} pending
                  </span>
                  <span className={`font-bold ${isSelected ? "text-gold" : "text-navy"}`}>
                    {stats.pct}% completed
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. WEDDING DETAIL BANNER & WHAT'S DONE SUMMARY */}
      <div className="royal-card p-6 bg-gradient-to-r from-navy via-navy-dark to-navy text-ivory border-gold/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-gold mb-1">
              <Crown className="w-4 h-4" />
              <span>
                {selectedWedding ? "Active Wedding Operations" : "Consolidated Task Matrix"}
              </span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#DFC698]">
              {selectedWedding ? selectedWedding.title : "All Palatial Celebrations"}
            </h2>
            <p className="text-xs text-ivory/70 mt-1">
              {selectedStats.done} milestones completed • {selectedStats.total - selectedStats.done} remaining tasks
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-3xl font-serif font-bold text-gold">
                {selectedStats.pct}%
              </div>
              <div className="text-[10px] uppercase font-bold text-ivory/60">
                Completed
              </div>
            </div>

            {selectedWedding && (
              <Link
                href={`/weddings/${selectedWedding.id}`}
                className="btn-gold text-xs py-2 px-3 inline-flex items-center space-x-1"
              >
                <span>Wedding Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABS: WHAT'S NOT DONE vs WHAT'S DONE vs ALL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "pending"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white text-navy/70 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>What&apos;s Not Done ({notDoneTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("done")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "done"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-navy/70 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>What&apos;s Done ({doneTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-navy text-gold shadow-sm"
                : "bg-white text-navy/70 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <span>All Tasks ({weddingTasks.length})</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Phase Filter */}
          <div className="flex items-center space-x-1 bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs">
            <span className="text-gray-400 font-semibold mr-1">Phase:</span>
            <select
              value={activePhase}
              onChange={(e) => setActivePhase(e.target.value)}
              className="bg-transparent font-medium text-navy focus:outline-none cursor-pointer"
            >
              {PHASES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Owner Filter */}
          <div className="flex items-center space-x-1 bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="bg-transparent font-medium text-navy focus:outline-none cursor-pointer"
            >
              <option value="All">All Owners</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-gold w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* 4. MAIN TASK VIEW: CHECKLIST or KANBAN */}
      {viewMode === "checklist" ? (
        <div className="royal-card p-6 space-y-3">
          {displayedTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-navy text-sm">
                {activeTab === "pending"
                  ? "Splendid! All pending tasks for this selection are completed."
                  : activeTab === "done"
                  ? "No tasks completed yet for this selection."
                  : "No tasks match your filter criteria."}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {activeTab === "pending" && doneTasks.length > 0 && (
                  <button
                    onClick={() => setActiveTab("done")}
                    className="btn-gold text-xs py-1.5 px-3"
                  >
                    View Completed Tasks ({doneTasks.length})
                  </button>
                )}
                {selectedWeddingId !== "All" && (
                  <button
                    onClick={() => {
                      setSelectedWeddingId("All");
                      setActiveTab("pending");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-navy font-semibold hover:bg-gray-50"
                  >
                    View Pending Across All Celebrations
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayedTasks.map((task) => {
                const isDone = task.stage === "Done";
                const isOverdue =
                  !isDone && task.due_date && task.due_date < todayStr;
                const owner = task.owner ? memberMap.get(task.owner) : null;
                const isUpdating = updatingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`py-3.5 px-3 rounded-xl flex items-start sm:items-center justify-between gap-3 transition-colors ${
                      isDone
                        ? "bg-emerald-50/20 hover:bg-emerald-50/40"
                        : isOverdue
                        ? "bg-rose-50/30 hover:bg-rose-50/50"
                        : "hover:bg-ivory/60"
                    }`}
                  >
                    {/* Left: Clickable Checkbox & Title */}
                    <div className="flex items-start sm:items-center space-x-3.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleDone(task.id, task.stage)}
                        disabled={isUpdating}
                        className="mt-0.5 sm:mt-0 flex-shrink-0 text-navy hover:scale-110 transition-transform"
                        title={isDone ? "Mark as in progress" : "Mark as done"}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-5 h-5 text-gold animate-spin" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 hover:text-gold" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4
                            className={`text-sm font-medium leading-snug truncate ${
                              isDone
                                ? "line-through text-gray-400"
                                : "text-navy font-semibold"
                            }`}
                          >
                            {task.title}
                          </h4>
                          {task.is_demo ? <DemoBadge /> : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-500">
                          <span className="font-semibold text-[#8C7142] bg-[#F5EEDF] px-2 py-0.5 rounded">
                            {task.phase || "Planning"}
                          </span>

                          {task.due_date && (
                            <span
                              className={`inline-flex items-center space-x-1 ${
                                isOverdue
                                  ? "text-rose-700 font-bold"
                                  : "text-gray-500"
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>
                                {isOverdue ? "Overdue: " : "Due: "}
                                {new Date(task.due_date).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </span>
                          )}

                          {task.notes && (
                            <span className="text-gray-400 italic truncate max-w-xs hidden sm:inline">
                              • {task.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Owner & Interactive Stage Dropdown */}
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      {owner && (
                        <div
                          className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px]"
                          title={owner.role}
                        >
                          <div className="w-5 h-5 rounded-full bg-navy text-gold text-[9px] font-bold flex items-center justify-center">
                            {owner.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-navy font-medium truncate max-w-[90px]">
                            {owner.name}
                          </span>
                        </div>
                      )}

                      {/* Stage Selector */}
                      <select
                        value={task.stage}
                        disabled={isUpdating}
                        onChange={(e) => handleStageChange(task.id, e.target.value as TaskStage)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          task.stage === "Done"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : task.stage === "Blocked"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : task.stage === "In Progress"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map((stage) => {
            const colTasks = weddingTasks.filter((t) => t.stage === stage);
            const colConfig: Record<TaskStage, { color: string; badge: string }> = {
              "To Plan": { color: "bg-gray-100 text-gray-800", badge: "bg-gray-200 text-gray-700" },
              "In Progress": { color: "bg-blue-50 text-blue-800", badge: "bg-blue-100 text-blue-700" },
              Blocked: { color: "bg-rose-50 text-rose-800", badge: "bg-rose-100 text-rose-700" },
              Done: { color: "bg-emerald-50 text-emerald-800", badge: "bg-emerald-100 text-emerald-700" },
            };

            return (
              <div
                key={stage}
                className="royal-card p-4 flex flex-col min-h-[480px] bg-ivory/30"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
                  <h3 className="font-serif font-bold text-sm text-navy">{stage}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colConfig[stage].badge}`}>
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm space-y-2 hover:border-gold/50 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold px-2 py-0.5 rounded bg-[#F5EEDF] text-[#8C7142]">
                          {task.phase || "Milestone"}
                        </span>
                        {task.is_demo ? <DemoBadge /> : null}
                      </div>

                      <h4 className="text-xs font-semibold text-navy leading-snug">
                        {task.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-100 text-gray-500">
                        {task.due_date ? (
                          <span>
                            {new Date(task.due_date).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        ) : (
                          <span>—</span>
                        )}

                        <select
                          value={task.stage}
                          onChange={(e) => handleStageChange(task.id, e.target.value as TaskStage)}
                          className="text-[10px] font-semibold text-navy bg-gray-50 border rounded px-1.5 py-0.5 focus:outline-none"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
