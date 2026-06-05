"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Minimize2, Radio, Activity } from "lucide-react";
import { useSuzieStore } from "@/store/suzieStore";
import RiskPanel from "./RiskPanel";
import SuzieOrb from "./SuzieOrb";
import { getRiskColor } from "@/services/riskScoring";

const GlobeScene = dynamic(() => import("./GlobeScene"), { ssr: false });

const RISK_TEXT: Record<string, string> = {
  critical: "text-red-400 border-red-400/40",
  high: "text-orange-400 border-orange-400/40",
  medium: "text-yellow-400 border-yellow-400/40",
  low: "text-cyan-400 border-cyan-400/40",
  monitoring: "text-blue-400 border-blue-400/40",
};

export default function MissionControl() {
  const active = useSuzieStore((s) => s.missionControl);
  const setMissionControl = useSuzieStore((s) => s.setMissionControl);
  const events = useSuzieStore((s) => s.events);
  const riskScores = useSuzieStore((s) => s.riskScores);
  const briefing = useSuzieStore((s) => s.briefing);
  const logs = useSuzieStore((s) => s.logs);

  const topAlerts = events.slice(0, 5);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] bg-suzie-bg grid-bg overflow-hidden"
        >
          {/* Massive globe */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="absolute inset-0"
          >
            <GlobeScene events={events} className="w-full h-full" />
          </motion.div>

          {/* Center orb + title */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <div className="breathe">
              <SuzieOrb size={70} active pulsing />
            </div>
            <p className="font-display text-sm tracking-[0.3em] text-cyan-400 mt-2 neon-text-cyan">MISSION CONTROL</p>
            <p className="font-terminal text-[10px] text-gray-500 mt-1">GLOBAL INTELLIGENCE THEATER</p>
          </div>

          {/* Exit button */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setMissionControl(false)}
            className="absolute top-6 right-6 z-10 flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-400/40 text-cyan-400 font-display text-[11px] tracking-wider hover:bg-cyan-400/10"
          >
            <Minimize2 className="w-4 h-4" /> EXIT
          </motion.button>

          {/* Floating risk panel — top left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-24 left-6 w-72 glass-panel hover-glow p-4 float-soft"
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="font-display text-[11px] tracking-[0.15em] text-cyan-400 uppercase">Global Risk Matrix</span>
            </div>
            <RiskPanel scores={riskScores} compact />
          </motion.div>

          {/* Floating briefing — bottom left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-6 left-6 w-80 glass-panel hover-glow p-4 float-soft"
            style={{ animationDelay: "1.5s" }}
          >
            <span className="font-display text-[11px] tracking-[0.15em] text-cyan-400 uppercase">SUZIE Briefing</span>
            <p className="text-[12px] text-gray-300 leading-relaxed mt-2 max-h-32 overflow-y-auto scroll-cyber">
              {briefing || "Global monitoring active. All feeds nominal."}
            </p>
          </motion.div>

          {/* Floating live alerts — right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="absolute top-24 right-6 w-80 glass-panel hover-glow p-4 float-soft"
            style={{ animationDelay: "0.8s" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="font-display text-[11px] tracking-[0.15em] text-gray-300 uppercase">Live Global Alerts</span>
            </div>
            <div className="space-y-2">
              {topAlerts.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className={`px-3 py-2 rounded-lg border bg-black/30 ${RISK_TEXT[e.riskLevel]}`}
                >
                  <p className="text-[12px] truncate">{e.title}</p>
                  <p className="font-terminal text-[9px] opacity-70 mt-0.5">
                    {e.country} · {e.riskLevel.toUpperCase()}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Floating mini terminal — bottom right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="absolute bottom-6 right-6 w-96 glass-panel hover-glow p-3 float-soft"
            style={{ animationDelay: "2.2s" }}
          >
            <span className="font-display text-[10px] tracking-[0.15em] text-cyan-400 uppercase">Intel Stream</span>
            <div className="mt-2 h-24 overflow-y-auto scroll-cyber font-terminal text-[10px] space-y-0.5">
              {logs.slice(-8).map((l, i) => (
                <p key={i} className="text-gray-400 truncate">{l}</p>
              ))}
              <span className="inline-block w-2 h-3 bg-cyan-400 cursor-blink" />
            </div>
          </motion.div>

          {/* Pulsing rings around globe center */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-cyan-400/20 globe-pulse-ring pointer-events-none"
              style={{ animationDelay: `${i * 0.9}s` }}
            />
          ))}

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <span className="font-display text-[10px] tracking-[0.25em]"
              style={{ color: getRiskColor(riskScores.overall) }}>
              {riskScores.overall}/100
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
