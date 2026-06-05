"use client";

import { motion } from "framer-motion";
import { RiskScores } from "@/types";
import { getRiskColor, getRiskLabel } from "@/services/riskScoring";

interface RiskPanelProps {
  scores: RiskScores;
  compact?: boolean;
}

const CATEGORIES: { key: keyof RiskScores; label: string }[] = [
  { key: "supplyChain", label: "Supply Chain" },
  { key: "conflict", label: "Conflict" },
  { key: "climate", label: "Climate" },
  { key: "cyber", label: "Cyber" },
  { key: "construction", label: "Construction" },
  { key: "food", label: "Food" },
  { key: "fuel", label: "Fuel" },
];

export default function RiskPanel({ scores, compact: _compact = false }: RiskPanelProps) {
  void _compact;
  const overallColor = getRiskColor(scores.overall);

  return (
    <div className="space-y-2">
      {/* Overall — prominent header bar */}
      <div className="flex items-center gap-2">
        <span className="font-display text-[10px] tracking-[0.15em] text-cyan-400 uppercase whitespace-nowrap">
          World Risk
        </span>
        <div className="flex-1 h-1.5 bg-gray-800/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: overallColor }}
            initial={{ width: 0 }}
            animate={{ width: `${scores.overall}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <span className="font-terminal text-xs tabular-nums" style={{ color: overallColor }}>
          {scores.overall}
        </span>
        <span className="font-display text-[8px] tracking-wider uppercase" style={{ color: overallColor }}>
          {getRiskLabel(scores.overall)}
        </span>
      </div>

      {/* Remaining metrics in a tight 2-column grid (thin bars) */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {CATEGORIES.map(({ key, label }, i) => {
          const score = scores[key];
          const color = getRiskColor(score);
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-2"
            >
              <span className="text-[10px] text-gray-400 w-[68px] shrink-0 truncate font-medium">
                {label}
              </span>
              <div className="flex-1 h-1 bg-gray-800/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.9, delay: i * 0.04 }}
                />
              </div>
              <span className="font-terminal text-[10px] tabular-nums w-5 text-right" style={{ color }}>
                {score}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
