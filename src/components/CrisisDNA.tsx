"use client";

import { motion } from "framer-motion";
import { Dna } from "lucide-react";
import { CrisisDNA as CrisisDNAType } from "@/types";

interface CrisisDNAProps {
  dna: CrisisDNAType;
}

const SPREAD_COLORS: Record<string, string> = {
  critical: "text-red-400",
  fast: "text-orange-400",
  moderate: "text-yellow-400",
  slow: "text-cyan-400",
};

export default function CrisisDNA({ dna }: CrisisDNAProps) {
  const affectedSectors = [...new Set(dna.affectedSectors)];
  const affectedCountries = [...new Set(dna.affectedCountries)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Dna className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-cyan-400 tracking-wider">CRISIS DNA</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Origin</span>
          <p className="text-gray-200">{dna.origin}</p>
        </div>
        <div>
          <span className="text-gray-500">Spread Speed</span>
          <p className={SPREAD_COLORS[dna.spreadSpeed]}>{dna.spreadSpeed.toUpperCase()}</p>
        </div>
        <div>
          <span className="text-gray-500">Risk Score</span>
          <p className="font-mono text-red-400">{dna.riskScore}/100</p>
        </div>
        <div>
          <span className="text-gray-500">Confidence</span>
          <p className="font-mono text-cyan-400">{(dna.confidence * 100).toFixed(0)}%</p>
        </div>
      </div>

      <div>
        <span className="text-[10px] text-gray-500 uppercase">Affected Sectors</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {affectedSectors.map((s, i) => (
            <span key={`${s}-${i}`} className="text-[10px] px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div>
        <span className="text-[10px] text-gray-500 uppercase">Affected Countries</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {affectedCountries.map((c, i) => (
            <span key={`${c}-${i}`} className="text-[10px] px-2 py-0.5 rounded bg-red-400/10 text-red-400 border border-red-400/20">
              {c}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
