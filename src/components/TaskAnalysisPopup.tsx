"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListFilter,
  Brain,
} from "lucide-react";
import { Task } from "@/types/task";
import TaskCard from "./TaskCard";

type Section = "active" | "today" | "tomorrow" | "critical" | "completed" | "ai";

const SECTION_TABS: { id: Section; label: string }[] = [
  { id: "active", label: "Active Ops" },
  { id: "today", label: "Daily Protocol" },
  { id: "tomorrow", label: "Next-Day" },
  { id: "critical", label: "Red Level" },
  { id: "completed", label: "Executed" },
  { id: "ai", label: "AI Recs" },
];

interface TaskAnalysisPopupProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  userName: string;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function TaskAnalysisPopup({
  open,
  onClose,
  tasks,
  onComplete,
  onDelete,
  onEdit,
  userName,
}: TaskAnalysisPopupProps) {
  const [section, setSection] = useState<Section>("active");

  const active = tasks.filter((t) => t.status !== "completed");
  const todayTasks = tasks.filter(
    (t) => t.date === todayStr() && t.status !== "completed"
  );
  const tomorrowTasks = tasks.filter((t) => t.date === tomorrowStr());
  const critical = tasks.filter(
    (t) => t.priority === "critical" && t.status !== "completed"
  );
  const completed = tasks.filter((t) => t.status === "completed");

  const topPriority = [...active].sort((a, b) => {
    const o: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return o[a.priority] - o[b.priority];
  })[0];

  function getSectionTasks(): Task[] {
    switch (section) {
      case "active":
        return active;
      case "today":
        return todayTasks;
      case "tomorrow":
        return tomorrowTasks;
      case "critical":
        return critical;
      case "completed":
        return completed;
      default:
        return [];
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/86"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          <motion.div
            className="relative z-10 w-full max-w-2xl glass-panel border border-cyan-400/32 scan-line flex flex-col max-h-[92vh]"
            style={{
              boxShadow:
                "0 0 70px rgba(0,240,255,0.15), inset 0 0 50px rgba(0,240,255,0.03)",
            }}
            initial={{ opacity: 0, scale: 0.92, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", damping: 22, stiffness: 270 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-cyan-400/12 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <motion.div
                    className="absolute -inset-1 rounded-full border border-cyan-400/30"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <p className="font-display text-sm text-cyan-400 tracking-[0.2em] uppercase">
                    Mission Queue Analysis
                  </p>
                  <p className="font-terminal text-[9px] text-gray-500">
                    {active.length} active · {critical.length} critical ·{" "}
                    {completed.length} executed
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-5 gap-px border-b border-cyan-400/10 shrink-0 bg-black/30">
              {[
                {
                  label: "Total",
                  value: tasks.length,
                  color: "text-gray-400",
                  icon: ListFilter,
                },
                {
                  label: "Active",
                  value: active.length,
                  color: "text-cyan-400",
                  icon: Target,
                },
                {
                  label: "Critical",
                  value: critical.length,
                  color: "text-red-400",
                  icon: AlertTriangle,
                },
                {
                  label: "Today",
                  value: todayTasks.length,
                  color: "text-blue-400",
                  icon: Clock,
                },
                {
                  label: "Done",
                  value: completed.length,
                  color: "text-green-400",
                  icon: CheckCircle2,
                },
              ].map(({ label, value, color, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center py-3"
                >
                  <Icon className={`w-3.5 h-3.5 ${color} mb-1`} />
                  <p className={`font-display text-lg ${color}`}>{value}</p>
                  <p className="font-display text-[8px] text-gray-600 tracking-wider uppercase">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Section tabs */}
            <div className="flex gap-px border-b border-cyan-400/10 overflow-x-auto shrink-0">
              {SECTION_TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className={`flex-1 px-3 py-2.5 font-display text-[9px] tracking-wider uppercase whitespace-nowrap transition-all ${
                    section === id
                      ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5"
                      : "text-gray-600 hover:text-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scroll-cyber p-5">
              {section === "ai" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    <p className="font-display text-[9px] text-gray-500 tracking-[0.2em] uppercase">
                      AI Recommendations
                    </p>
                  </div>

                  {topPriority && (
                    <div className="glass-panel p-4 border-l-2 border-cyan-400/50">
                      <p className="font-display text-[9px] text-cyan-400 tracking-wider uppercase mb-2">
                        Recommended First Action
                      </p>
                      <p className="font-terminal text-sm text-green-400">
                        {topPriority.title} — classified as{" "}
                        {topPriority.priority === "critical"
                          ? "Red Level"
                          : topPriority.priority === "high"
                          ? "Priority Alpha"
                          : "Priority Beta"}
                        . Complete this operation first.
                      </p>
                    </div>
                  )}

                  <div className="glass-panel p-4 border border-gray-800">
                    <p className="font-display text-[9px] text-gray-500 tracking-wider uppercase mb-3">
                      Mission Status Report
                    </p>
                    <div className="space-y-2 font-terminal text-[11px] text-gray-400">
                      <p>
                        <span className="text-cyan-400">[STATUS]</span>{" "}
                        {active.length} operation{active.length !== 1 ? "s" : ""}{" "}
                        active in mission queue
                      </p>
                      {critical.length > 0 && (
                        <p>
                          <span className="text-red-400">[ALERT]</span>{" "}
                          {critical.length} Red Level operation
                          {critical.length > 1 ? "s" : ""} require immediate
                          attention
                        </p>
                      )}
                      <p>
                        <span className="text-blue-400">[TODAY]</span>{" "}
                        {todayTasks.length} operation
                        {todayTasks.length !== 1 ? "s" : ""} in today&apos;s
                        protocol
                      </p>
                      <p>
                        <span className="text-green-400">[EXEC]</span>{" "}
                        {completed.length} operation
                        {completed.length !== 1 ? "s" : ""} successfully executed
                      </p>
                      {topPriority && (
                        <p>
                          <span className="text-yellow-400">[REC]</span> Begin
                          with: {topPriority.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {getSectionTasks().length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
                      <CheckCircle2 className="w-9 h-9 text-gray-700" />
                      <p className="font-display text-xs text-gray-600 tracking-wider">
                        NO OPERATIONS IN THIS SECTION
                      </p>
                      <p className="font-terminal text-[10px] text-gray-700">
                        All clear, {userName}.
                      </p>
                    </div>
                  ) : (
                    getSectionTasks().map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={onComplete}
                        onDelete={onDelete}
                        onEdit={onEdit}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
