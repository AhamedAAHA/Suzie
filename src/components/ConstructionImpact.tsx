"use client";

import { motion } from "framer-motion";
import { ConstructionMaterial } from "@/types";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

const RISK_COLORS: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-cyan-400",
  monitoring: "text-blue-400",
};

interface ConstructionImpactProps {
  materials: ConstructionMaterial[];
  boqImpact?: {
    projectName: string;
    originalBudget: number;
    projectedOverrun: number;
    overrunPercent: number;
    delayProbability: number;
    delayWeeks: number;
    topRisks: string[];
  };
}

export default function ConstructionImpact({ materials, boqImpact }: ConstructionImpactProps) {
  return (
    <div className="space-y-6">
      {boqImpact && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4 space-y-3"
        >
          <h3 className="text-sm font-semibold text-cyan-400">{boqImpact.projectName}</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Original Budget</span>
              <p className="font-mono text-lg">${(boqImpact.originalBudget / 1e6).toFixed(1)}M</p>
            </div>
            <div>
              <span className="text-gray-500">Projected Overrun</span>
              <p className="font-mono text-lg text-red-400">+${(boqImpact.projectedOverrun / 1e6).toFixed(2)}M</p>
            </div>
            <div>
              <span className="text-gray-500">Overrun %</span>
              <p className="font-mono text-orange-400">{boqImpact.overrunPercent.toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-gray-500">Delay Probability</span>
              <p className="font-mono text-yellow-400">{boqImpact.delayProbability}%</p>
            </div>
          </div>
          <div className="space-y-1">
            {boqImpact.topRisks.map((risk) => (
              <p key={risk} className="text-[10px] text-gray-400 flex items-center gap-1">
                <span className="text-red-400">▸</span> {risk}
              </p>
            ))}
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {materials.map((mat, i) => (
          <motion.div
            key={mat.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-panel p-3 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-200">{mat.name}</span>
                <span className={`text-xs font-mono ${RISK_COLORS[mat.riskLevel]}`}>
                  {mat.riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>${mat.currentPrice.toFixed(2)}/{mat.unit}</span>
                <span className={`flex items-center gap-0.5 ${mat.changePercent > 0 ? "text-red-400" : "text-green-400"}`}>
                  {mat.changePercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {mat.changePercent > 0 ? "+" : ""}{mat.changePercent.toFixed(1)}%
                </span>
                {mat.delayDays > 0 && (
                  <span className="flex items-center gap-0.5 text-orange-400">
                    <Clock className="w-3 h-3" /> +{mat.delayDays}d
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
