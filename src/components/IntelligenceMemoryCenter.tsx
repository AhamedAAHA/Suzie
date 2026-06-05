"use client";

import { motion } from "framer-motion";
import { BrainCircuit, History, User, ActivitySquare } from "lucide-react";
import { IntelligenceMemory } from "@/types";

interface Props {
  memory: IntelligenceMemory;
  returningBriefing: string;
}

function topN(map: Record<string, number>, count = 4) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);
}

export default function IntelligenceMemoryCenter({ memory, returningBriefing }: Props) {
  const topTopics = topN(memory.behavior.topicsViewed, 5);
  const topCountries = topN(memory.behavior.countriesMonitored, 5);
  const topRisks = topN(memory.behavior.risksChecked, 4);

  return (
    <div className="grid grid-cols-12 gap-3">
      <motion.section className="col-span-4 glass-panel p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-cyan-400" />
          <h3 className="font-display text-[11px] tracking-[0.15em] text-cyan-400 uppercase">User Profile</h3>
        </div>
        <div className="space-y-1.5 text-sm">
          <p><span className="text-gray-500">Name:</span> <span className="text-gray-200">{memory.profile.name}</span></p>
          <p><span className="text-gray-500">Country:</span> <span className="text-gray-200">{memory.profile.country}</span></p>
          <p><span className="text-gray-500">Profession:</span> <span className="text-gray-200">{memory.profile.profession ?? "Analyst"}</span></p>
        </div>
        <p className="font-display text-[10px] tracking-wider uppercase text-gray-500 mt-3">Interests</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {memory.profile.interests.map((i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded border border-cyan-400/30 text-cyan-300 bg-cyan-400/10">
              {i}
            </span>
          ))}
        </div>
      </motion.section>

      <motion.section className="col-span-4 glass-panel p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-center gap-2 mb-3">
          <ActivitySquare className="w-4 h-4 text-cyan-400" />
          <h3 className="font-display text-[11px] tracking-[0.15em] text-cyan-400 uppercase">Behavioral Memory</h3>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Topics Viewed Most</p>
            {topTopics.map(([k, v]) => <p key={k} className="text-sm text-gray-300">{k} <span className="text-cyan-400 font-terminal">({v})</span></p>)}
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Countries Monitored</p>
            {topCountries.map(([k, v]) => <p key={k} className="text-sm text-gray-300">{k} <span className="text-cyan-400 font-terminal">({v})</span></p>)}
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Risks Checked</p>
            {topRisks.map(([k, v]) => <p key={k} className="text-sm text-gray-300">{k} <span className="text-orange-400 font-terminal">({v})</span></p>)}
          </div>
        </div>
      </motion.section>

      <motion.section className="col-span-4 glass-panel p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-2 mb-3">
          <BrainCircuit className="w-4 h-4 text-cyan-400" />
          <h3 className="font-display text-[11px] tracking-[0.15em] text-cyan-400 uppercase">Intelligent Login Briefing</h3>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{returningBriefing}</p>
      </motion.section>

      <motion.section className="col-span-12 glass-panel p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="font-display text-[11px] tracking-[0.15em] text-cyan-400 uppercase">Intelligence Memory Timeline</h3>
        </div>
        <div className="max-h-44 overflow-y-auto scroll-cyber pr-1 grid grid-cols-2 gap-2">
          {[...memory.timeline].reverse().map((s) => (
            <div key={s.id} className="border border-cyan-400/20 rounded-lg px-3 py-2 bg-black/25">
              <p className="font-terminal text-[10px] text-cyan-400">{new Date(s.at).toLocaleString()}</p>
              <p className="text-sm text-gray-200">{s.query}</p>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">{s.module}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
