"use client";

import { motion } from "framer-motion";
import { getRiskColor } from "@/services/riskScoring";

interface WorldPulseProps {
  riskScore: number;
}

export default function WorldPulse({ riskScore }: WorldPulseProps) {
  const color = getRiskColor(riskScore);
  const isHigh = riskScore >= 60;
  const duration = isHigh ? 0.6 : riskScore >= 40 ? 1.0 : 1.4;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-8 h-8">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color, opacity: 0.3 }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-1 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration, repeat: Infinity }}
        />
      </div>
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">World Pulse</p>
        <p className="text-xs font-mono" style={{ color }}>
          {riskScore}/100 — {isHigh ? "ELEVATED" : "STABLE"}
        </p>
      </div>
    </div>
  );
}
