"use client";

import { motion } from "framer-motion";
import { Mic2, ShieldAlert } from "lucide-react";
import { ExecutiveBriefing } from "@/types";

interface Props {
  briefing: ExecutiveBriefing | null;
  onMode: (mode: ExecutiveBriefing["mode"]) => void;
}

const MODE: ExecutiveBriefing["mode"][] = ["30s", "60s", "full"];

export default function ExecutiveBriefingRoom({ briefing, onMode }: Props) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="w-4 h-4 text-cyan-400" />
        <h3 className="font-display text-[11px] tracking-[0.15em] text-cyan-400 uppercase">Executive Briefing Room</h3>
      </div>
      <div className="flex gap-2 mb-3">
        {MODE.map((m) => (
          <button
            key={m}
            onClick={() => onMode(m)}
            className="px-3 py-1 rounded border border-cyan-400/30 text-cyan-300 text-[11px] font-display tracking-wider hover:bg-cyan-400/10"
          >
            {m.toUpperCase()} BRIEF
          </button>
        ))}
      </div>
      {!briefing ? (
        <p className="text-sm text-gray-400">Request a briefing mode to generate a strategic intelligence summary.</p>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <p className="text-sm text-gray-200">{briefing.headline}</p>
          <div className="space-y-1">
            {briefing.bullets.map((b) => (
              <p key={b} className="text-sm text-gray-300">• {b}</p>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded border border-cyan-400/20 p-2 bg-black/20">
              <p className="text-[10px] text-gray-500 uppercase">World Risk</p>
              <p className="font-display text-cyan-300">{briefing.worldRiskScore}</p>
            </div>
            <div className="rounded border border-cyan-400/20 p-2 bg-black/20">
              <p className="text-[10px] text-gray-500 uppercase">Construction Impact</p>
              <p className="font-display text-orange-300">{briefing.constructionImpactLevel}</p>
            </div>
            <div className="rounded border border-cyan-400/20 p-2 bg-black/20">
              <p className="text-[10px] text-gray-500 uppercase">Mode</p>
              <p className="font-display text-cyan-300">{briefing.mode.toUpperCase()}</p>
            </div>
          </div>
          <div className="rounded-lg border border-cyan-400/20 p-3 bg-black/25">
            <div className="flex items-center gap-2 mb-1">
              <Mic2 className="w-3.5 h-3.5 text-cyan-400" />
              <p className="font-display text-[10px] tracking-wider text-cyan-300 uppercase">Spoken Script</p>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">{briefing.spokenText}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
