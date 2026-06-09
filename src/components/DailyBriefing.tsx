"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, AlertTriangle, ChevronRight } from "lucide-react";
import { Task } from "@/types/task";
import { buildDailyBriefingText } from "@/services/dailyBriefingService";

interface DailyBriefingProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  userName: string;
  onSpeak?: (text: string) => void;
}

function TypingText({ text, speed = 22 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      <span className="cursor-blink inline-block w-2 h-3 bg-green-400/70 ml-0.5 align-text-bottom" />
    </span>
  );
}

export default function DailyBriefing({
  open,
  onClose,
  tasks,
  userName,
  onSpeak,
}: DailyBriefingProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(
    (t) => t.date === todayStr && t.status !== "completed"
  );
  const critical = tasks.filter(
    (t) => t.priority === "critical" && t.status !== "completed"
  );
  const high = tasks.filter(
    (t) => t.priority === "high" && t.status !== "completed"
  );
  const completed = tasks.filter((t) => t.status === "completed");
  const pending = tasks.filter((t) => t.status === "pending");

  const briefingText = buildDailyBriefingText(userName, tasks);

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    if (!onSpeak) return;
    const t = setTimeout(() => onSpeak(briefingText), 700);
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
            className="relative z-10 w-full max-w-lg glass-panel border border-cyan-400/30 scan-line overflow-hidden"
            style={{
              boxShadow:
                "0 0 60px rgba(0,240,255,0.13), inset 0 0 40px rgba(0,240,255,0.03)",
            }}
            initial={{ opacity: 0, scale: 0.94, y: -22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-cyan-400/12">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Sun className="w-5 h-5 text-cyan-400" />
                  <motion.div
                    className="absolute -inset-1.5 rounded-full"
                    style={{ background: "rgba(0,240,255,0.1)" }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <p className="font-display text-xs text-cyan-400 tracking-[0.22em] uppercase">
                    Daily Protocol
                  </p>
                  <p className="font-terminal text-[9px] text-gray-500">
                    {dayName} · {dateStr} · {timeStr}
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

            <div className="p-5 space-y-5">
              {/* Typed briefing */}
              <div className="glass-panel p-4 border-l-2 border-cyan-400/50">
                <p className="font-terminal text-sm text-green-400 leading-relaxed">
                  <TypingText text={briefingText} />
                </p>
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    label: "Total Ops",
                    value: tasks.length,
                    color: "text-gray-300",
                  },
                  {
                    label: "Critical",
                    value: critical.length,
                    color: "text-red-400",
                  },
                  {
                    label: "Today",
                    value: todayTasks.length,
                    color: "text-cyan-400",
                  },
                  {
                    label: "Executed",
                    value: completed.length,
                    color: "text-green-400",
                  },
                ].map((s) => (
                  <div key={s.label} className="glass-panel p-2.5 text-center">
                    <p className={`font-display text-xl ${s.color}`}>
                      {s.value}
                    </p>
                    <p className="font-display text-[8px] text-gray-600 tracking-wider uppercase mt-0.5">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Priority operations */}
              {[...critical, ...high].length > 0 && (
                <div>
                  <p className="font-display text-[9px] text-gray-500 tracking-[0.2em] uppercase mb-2.5">
                    Priority Operations
                  </p>
                  <div className="space-y-1.5">
                    {[...critical, ...high].slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-800"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            task.priority === "critical"
                              ? "bg-red-400"
                              : "bg-orange-400"
                          }`}
                        />
                        <p className="font-display text-[10px] text-gray-300 tracking-wider flex-1 truncate">
                          {task.title}
                        </p>
                        <ChevronRight className="w-3 h-3 text-gray-700 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending warning */}
              {pending.length > 0 && (
                <div className="flex items-center gap-3 p-3 glass-panel border border-yellow-500/20">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                  <p className="font-terminal text-[10px] text-yellow-400">
                    {pending.length} operation
                    {pending.length > 1 ? "s" : ""} awaiting execution
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
