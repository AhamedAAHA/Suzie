"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { PredictionTimeline as PredictionType } from "@/types";

interface PredictionTimelineProps {
  prediction: PredictionType;
}

const STEPS = [
  { key: "hours24" as const, label: "24 Hours", color: "#ff2d55" },
  { key: "days7" as const, label: "7 Days", color: "#ff9500" },
  { key: "days30" as const, label: "30 Days", color: "#ffd60a" },
  { key: "months6" as const, label: "6 Months", color: "#00f0ff" },
];

export default function PredictionTimeline({ prediction }: PredictionTimelineProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-3 h-3 text-cyan-400" />
        <span className="text-xs text-gray-400 tracking-wider uppercase">Impact Timeline</span>
      </div>

      {STEPS.map((step, i) => (
        <motion.div
          key={step.key}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
          className="relative pl-4 border-l-2"
          style={{ borderColor: step.color }}
        >
          <div
            className="absolute -left-[5px] top-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: step.color }}
          />
          <p className="text-[10px] font-semibold" style={{ color: step.color }}>
            {step.label}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{prediction[step.key]}</p>
        </motion.div>
      ))}
    </div>
  );
}
