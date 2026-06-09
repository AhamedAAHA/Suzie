"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Target, Mic, Maximize2 } from "lucide-react";
import { Task } from "@/types/task";
import TaskCard from "./TaskCard";

type QueueFilter = "all" | "today" | "pending" | "critical";

interface MissionQueueProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onAddTask: () => void;
  onVoiceAdd: () => void;
  onOpenFull: () => void;
}

export default function MissionQueue({
  tasks,
  onComplete,
  onDelete,
  onEdit,
  onAddTask,
  onVoiceAdd,
  onOpenFull,
}: MissionQueueProps) {
  const [filter, setFilter] = useState<QueueFilter>("all");

  const todayStr = new Date().toISOString().split("T")[0];

  const filtered = tasks.filter((t) => {
    switch (filter) {
      case "today":
        return t.date === todayStr && t.status !== "completed";
      case "pending":
        return t.status === "pending";
      case "critical":
        return t.priority === "critical" && t.status !== "completed";
      default:
        return true;
    }
  });

  const activeCount = tasks.filter((t) => t.status !== "completed").length;
  const criticalCount = tasks.filter(
    (t) => t.priority === "critical" && t.status !== "completed"
  ).length;

  const FILTERS: { id: QueueFilter; label: string }[] = [
    { id: "all", label: "ALL" },
    { id: "today", label: "TODAY" },
    { id: "pending", label: "PENDING" },
    { id: "critical", label: "CRITICAL" },
  ];

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-cyan-400" />
          <p className="font-display text-[11px] text-cyan-400 tracking-[0.18em] uppercase">
            Mission Queue
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-terminal text-[9px] text-gray-600">
            {activeCount} active
          </span>
          {criticalCount > 0 && (
            <motion.span
              className="font-display text-[8px] text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/5"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            >
              {criticalCount} RED
            </motion.span>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`font-display text-[8px] tracking-wider px-2 py-0.5 rounded border transition-all ${
              filter === id
                ? "border-cyan-400/50 text-cyan-400 bg-cyan-400/10"
                : "border-gray-800 text-gray-600 hover:text-gray-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto scroll-cyber space-y-2 pr-0.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <Target className="w-6 h-6 text-gray-700" />
            <p className="font-display text-[10px] text-gray-600 tracking-wider">
              NO OPERATIONS DETECTED
            </p>
            <p className="font-terminal text-[9px] text-gray-700">
              Mission queue clear
            </p>
          </div>
        ) : (
          filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
              compact
            />
          ))
        )}
      </div>

      {/* Action bar */}
      <div className="flex gap-1.5 shrink-0">
        <motion.button
          onClick={onAddTask}
          whileHover={{ scale: 1.02, boxShadow: "0 0 12px rgba(0,240,255,0.15)" }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 flex-1 px-3 py-1.5 rounded-lg border border-cyan-400/30 text-[10px] font-display tracking-wider text-cyan-400 hover:bg-cyan-400/10 transition-all"
        >
          <Plus className="w-3 h-3" /> Add Operation
        </motion.button>
        <motion.button
          onClick={onVoiceAdd}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="p-1.5 rounded-lg border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 transition-all"
          title="Voice-add task"
        >
          <Mic className="w-3.5 h-3.5" />
        </motion.button>
        <motion.button
          onClick={onOpenFull}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-700 text-[9px] font-display tracking-wider text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-all"
        >
          <Maximize2 className="w-3 h-3" />
          FULL
        </motion.button>
      </div>
    </div>
  );
}
