"use client";

import { motion } from "framer-motion";
import { RiskScores } from "@/types";
import { getRiskColor, getRiskLabel } from "@/services/riskScoring";

interface RiskPanelProps {
  scores: RiskScores;
  compact?: boolean;
}

const CATEGORIES: { key: keyof RiskScores; label: string }[] = [
  { key: "overall", label: "World Risk" },
  { key: "supplyChain", label: "Supply Chain" },
  { key: "conflict", label: "Conflict" },
  { key: "climate", label: "Climate" },
  { key: "cyber", label: "Cyber" },
  { key: "construction", label: "Construction" },
  { key: "food", label: "Food" },
  { key: "fuel", label: "Fuel" },
];

export default function RiskPanel({ scores, compact = false }: RiskPanelProps) {
  return (
    <div className={`space-y-${compact ? "2" : "3"}`}>
      {CATEGORIES.map(({ key, label }, i) => {
        const score = scores[key];
        const color = getRiskColor(score);
        const riskLabel = getRiskLabel(score);
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="space-y-1"
          >
            <div className="flex justify-between items-center text-xs">
              <span className={`${key === "overall" ? "text-cyan-400 font-semibold" : "text-gray-400"}`}>
                {label}
              </span>
              <span className="font-mono" style={{ color }}>
                {score}
                {!compact && <span className="text-gray-600 ml-1 text-[10px]">{riskLabel}</span>}
              </span>
            </div>
            <div className="h-1.5 bg-gray-800/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, delay: i * 0.05 }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
