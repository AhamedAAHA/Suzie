"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar, Clock, Tag, AlertTriangle } from "lucide-react";
import { Task, TaskPriority, TaskStatus, TaskCategory } from "@/types/task";

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  editTask?: Task | null;
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "critical", label: "RED LEVEL — Critical" },
  { value: "high", label: "PRIORITY ALPHA — High" },
  { value: "medium", label: "PRIORITY BETA — Medium" },
  { value: "low", label: "PRIORITY GAMMA — Low" },
];

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "project", label: "Project" },
  { value: "study", label: "Study" },
  { value: "personal", label: "Personal" },
  { value: "tomorrow_plan", label: "Tomorrow Plan" },
  { value: "global", label: "Global Intel" },
];

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function AddTaskModal({
  open,
  onClose,
  onSave,
  editTask,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [category, setCategory] = useState<TaskCategory>("personal");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("");

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description);
      setPriority(editTask.priority);
      setStatus(editTask.status);
      setCategory(editTask.category);
      setDate(editTask.date);
      setTime(editTask.time ?? "");
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("pending");
      setCategory("personal");
      setDate(todayStr());
      setTime("");
    }
  }, [editTask, open]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      category,
      date,
      time: time || undefined,
    });
    onClose();
  };

  const inputCls =
    "w-full bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-400/60 font-terminal transition-colors";
  const selectCls =
    "w-full bg-gray-950/80 border border-gray-700 rounded-lg px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-400/60 font-terminal transition-colors";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[65] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/82"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          <motion.div
            className="relative z-10 w-full max-w-md glass-panel border border-cyan-400/35 p-6 scan-line"
            style={{
              boxShadow:
                "0 0 50px rgba(0,240,255,0.15), inset 0 0 40px rgba(0,240,255,0.03)",
            }}
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="font-display text-xs text-cyan-400 tracking-[0.22em] uppercase">
                  {editTask ? "Edit Operation" : "New Operation"}
                </p>
                <p className="font-terminal text-[10px] text-gray-600 mt-0.5">
                  {editTask
                    ? "Modify mission parameters"
                    : "Initialize new mission parameters"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="font-display text-[9px] text-gray-500 tracking-wider uppercase block mb-1.5">
                  Operation Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="Enter operation title..."
                  className={inputCls}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-display text-[9px] text-gray-500 tracking-wider uppercase block mb-1.5">
                  Mission Brief
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Operation details..."
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Priority + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-display text-[9px] text-gray-500 tracking-wider uppercase block mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className={selectCls}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-display text-[9px] text-gray-500 tracking-wider uppercase block mb-1.5 flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" /> Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className={selectCls}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-display text-[9px] text-gray-500 tracking-wider uppercase block mb-1.5 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={selectCls}
                  />
                </div>
                <div>
                  <label className="font-display text-[9px] text-gray-500 tracking-wider uppercase block mb-1.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Time (opt.)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={selectCls}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="font-display text-[9px] text-gray-500 tracking-wider uppercase block mb-1.5">
                  Status
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      { v: "pending", l: "Pending" },
                      { v: "in_progress", l: "Active" },
                      { v: "completed", l: "Executed" },
                    ] as { v: TaskStatus; l: string }[]
                  ).map(({ v, l }) => (
                    <button
                      key={v}
                      onClick={() => setStatus(v)}
                      className={`flex-1 py-1.5 rounded-lg border text-[9px] font-display tracking-wider uppercase transition-all ${
                        status === v
                          ? "border-cyan-400/55 text-cyan-400 bg-cyan-400/10"
                          : "border-gray-800 text-gray-600 hover:text-gray-400"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 mt-6">
              <motion.button
                onClick={handleSave}
                disabled={!title.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyan-400/50 text-cyan-400 font-display text-[11px] tracking-wider uppercase hover:bg-cyan-400/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                {editTask ? "Update Operation" : "Deploy Operation"}
              </motion.button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-gray-700 text-gray-500 font-display text-[11px] tracking-wider hover:text-gray-300 transition-all"
              >
                ABORT
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
