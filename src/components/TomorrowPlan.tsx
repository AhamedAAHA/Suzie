"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Target, Zap, ChevronRight, AlertTriangle } from "lucide-react";
import { Task } from "@/types/task";
import { buildTomorrowPlanText } from "@/services/dailyBriefingService";

interface TomorrowPlanProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  userName: string;
  onSpeak?: (text: string) => void;
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

const SUGGESTED_BLOCKS = [
  {
    time: "09:00",
    label: "Morning Debrief",
    desc: "Review overnight intelligence and priority ops",
  },
  {
    time: "10:00",
    label: "LinkedIn Update",
    desc: "Post project update and engage with network",
  },
  {
    time: "11:00",
    label: "Project Work Block",
    desc: "Focused development session",
  },
  {
    time: "13:00",
    label: "Demo Review",
    desc: "Review and finalize SUZIE AI demo video",
  },
  {
    time: "15:00",
    label: "Deep Work",
    desc: "Uninterrupted focus — no interruptions",
  },
  {
    time: "17:00",
    label: "Global Risk Check",
    desc: "Monitor construction and supply chain risks",
  },
  {
    time: "19:00",
    label: "Next-Day Protocol",
    desc: "Plan the following day and close ops",
  },
];

export default function TomorrowPlan({
  open,
  onClose,
  tasks,
  userName,
  onSpeak,
}: TomorrowPlanProps) {
  const tom = tomorrowStr();
  const tomorrowTasks = tasks.filter((t) => t.date === tom);
  const active = tasks.filter((t) => t.status !== "completed");
  const critical = active.filter((t) => t.priority === "critical");
  const high = active.filter((t) => t.priority === "high");

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const dayName = tomorrowDate.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = tomorrowDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const planText = buildTomorrowPlanText(userName, tasks);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    if (!onSpeak) return;
    const t = setTimeout(() => onSpeak(planText), 700);
    return () => clearTimeout(t);
  }, [open]);

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
            className="absolute inset-0 bg-black/85"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          <motion.div
            className="relative z-10 w-full max-w-lg glass-panel border border-cyan-400/30 scan-line flex flex-col max-h-[88vh] overflow-hidden"
            style={{
              boxShadow:
                "0 0 60px rgba(0,240,255,0.13), inset 0 0 40px rgba(0,240,255,0.03)",
            }}
            initial={{ opacity: 0, scale: 0.94, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-cyan-400/12 shrink-0">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="font-display text-xs text-cyan-400 tracking-[0.22em] uppercase">
                    Next-Day Protocol
                  </p>
                  <p className="font-terminal text-[9px] text-gray-500">
                    {dayName} · {dateStr}
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

            <div className="flex-1 overflow-y-auto scroll-cyber p-5 space-y-5">
              {/* SUZIE analysis */}
              <div className="glass-panel p-4 border-l-2 border-cyan-400/50">
                <p className="font-display text-[9px] text-cyan-400 tracking-wider uppercase mb-2">
                  SUZIE Protocol Analysis
                </p>
                <p className="font-terminal text-sm text-green-400 leading-relaxed">
                  {planText}
                </p>
              </div>

              {/* Scheduled tasks */}
              {tomorrowTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-3.5 h-3.5 text-cyan-400" />
                    <p className="font-display text-[9px] text-gray-400 tracking-[0.2em] uppercase">
                      Scheduled Operations
                    </p>
                  </div>
                  <div className="space-y-2">
                    {tomorrowTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-800 hover:border-cyan-400/25 transition-colors"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            task.priority === "critical"
                              ? "bg-red-400"
                              : task.priority === "high"
                              ? "bg-orange-400"
                              : task.priority === "medium"
                              ? "bg-yellow-400"
                              : "bg-gray-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-[10px] text-gray-300 tracking-wider truncate">
                            {task.title}
                          </p>
                          {task.time && (
                            <p className="font-terminal text-[9px] text-gray-600 flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5" /> {task.time}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-3 h-3 text-gray-700 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested timeline */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <p className="font-display text-[9px] text-gray-400 tracking-[0.2em] uppercase">
                    Suggested Timeline
                  </p>
                </div>
                <div className="relative pl-5">
                  <div className="absolute left-1 top-0 bottom-0 w-px bg-cyan-400/18" />
                  <div className="space-y-3">
                    {SUGGESTED_BLOCKS.map((block, i) => (
                      <motion.div
                        key={block.time}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="relative flex gap-3"
                      >
                        <div className="absolute -left-[18px] top-2 w-2 h-2 rounded-full bg-cyan-400/30 border border-cyan-400/50" />
                        <div className="flex-1 p-2.5 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="font-terminal text-[10px] text-cyan-400 shrink-0">
                              {block.time}
                            </span>
                            <span className="font-display text-[10px] text-gray-300 tracking-wider">
                              {block.label}
                            </span>
                          </div>
                          <p className="font-terminal text-[9px] text-gray-600 mt-0.5">
                            {block.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Priority alert */}
              {[...critical, ...high].length > 0 && (
                <div className="glass-panel p-3 border border-orange-500/20 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="font-terminal text-[10px] text-gray-400">
                    Complete{" "}
                    {critical.length > 0 ? "Red Level" : "Priority Alpha"}{" "}
                    operations first:{" "}
                    <span className="text-orange-400">
                      {[...critical, ...high][0]?.title}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
