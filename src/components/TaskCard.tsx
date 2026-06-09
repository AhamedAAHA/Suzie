"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, Trash2, Edit2, AlertTriangle } from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "@/types/task";

const PRIORITY_CFG: Record<
  TaskPriority,
  { label: string; textColor: string; border: string; glow?: string }
> = {
  critical: {
    label: "RED LEVEL",
    textColor: "text-red-400",
    border: "border-red-500/50",
    glow: "shadow-[0_0_14px_rgba(255,45,85,0.18)]",
  },
  high: {
    label: "PRIORITY ALPHA",
    textColor: "text-orange-400",
    border: "border-orange-500/35",
  },
  medium: {
    label: "PRIORITY BETA",
    textColor: "text-yellow-400",
    border: "border-yellow-500/25",
  },
  low: {
    label: "PRIORITY GAMMA",
    textColor: "text-gray-500",
    border: "border-gray-700/40",
  },
};

const STATUS_CFG: Record<TaskStatus, { label: string; textColor: string }> = {
  pending: { label: "AWAITING EXECUTION", textColor: "text-cyan-400" },
  in_progress: { label: "IN PROGRESS", textColor: "text-blue-400" },
  completed: { label: "EXECUTED", textColor: "text-green-400" },
};

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  compact?: boolean;
}

export default function TaskCard({
  task,
  onComplete,
  onDelete,
  onEdit,
  compact = false,
}: TaskCardProps) {
  const pri = PRIORITY_CFG[task.priority];
  const sta = STATUS_CFG[task.status];
  const done = task.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative glass-panel p-3 border ${pri.border} ${
        pri.glow ?? ""
      } transition-all ${done ? "opacity-45" : ""}`}
    >
      {/* Blinking critical indicator */}
      {task.priority === "critical" && !done && (
        <motion.div
          className="absolute top-2 right-2"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <AlertTriangle className="w-3 h-3 text-red-400" />
        </motion.div>
      )}

      <div className="flex items-start gap-2">
        {/* Complete toggle */}
        <button
          onClick={() => !done && onComplete(task.id)}
          className={`mt-0.5 shrink-0 transition-colors ${
            done
              ? "text-green-400 cursor-default"
              : "text-gray-600 hover:text-cyan-400"
          }`}
          title={done ? "Executed" : "Mark as executed"}
        >
          {done ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-display text-[11px] tracking-wider uppercase ${
              done ? "line-through text-gray-600" : "text-gray-200"
            }`}
          >
            {task.title}
          </p>

          {!compact && task.description && (
            <p className="font-terminal text-[10px] text-gray-500 mt-0.5 truncate">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
            <span className={`font-display text-[8px] tracking-wider ${pri.textColor}`}>
              {pri.label}
            </span>
            <span className="text-gray-700 text-[8px]">·</span>
            <span className={`font-display text-[8px] tracking-wider ${sta.textColor}`}>
              {sta.label}
            </span>
            {task.time && (
              <>
                <span className="text-gray-700 text-[8px]">·</span>
                <span className="font-terminal text-[8px] text-gray-500 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {task.time}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 shrink-0 ml-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-700 hover:text-cyan-400 transition-colors"
            title="Edit operation"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-gray-700 hover:text-red-400 transition-colors"
            title="Delete operation"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
