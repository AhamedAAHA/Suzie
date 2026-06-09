"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Radar } from "lucide-react";
import { ForesightSignal, ScenarioVariant } from "@/types";

interface Props {
  signals: ForesightSignal[];
  scenarios: ScenarioVariant[];
}

function DirIcon({ direction }: { direction: ForesightSignal["direction"] }) {
  if (direction === "up") return <TrendingUp className="w-3.5 h-3.5 text-red-400" />;
  if (direction === "down") return <TrendingDown className="w-3.5 h-3.5 text-green-400" />;
  return <Minus className="w-3.5 h-3.5 text-cyan-400" />;
}

const SCENARIO_STYLE: Record<string, string> = {
  critical: "border-red-400/45 text-red-300 bg-red-400/10",
  high: "border-orange-400/45 text-orange-300 bg-orange-400/10",
  medium: "border-yellow-400/45 text-yellow-300 bg-yellow-400/10",
  low: "border-cyan-400/45 text-cyan-300 bg-cyan-400/10",
  monitoring: "border-blue-400/45 text-blue-300 bg-blue-400/10",
};

export default function GlobalForesightCenter({ signals, scenarios }: Props) {
  return (
    <div className="grid grid-cols-12 gap-3">
      <section className="col-span-8 glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radar className="w-4 h-4 text-cyan-400" />
          <h3 className="font-display text-[11px] tracking-[0.15em] text-cyan-400 uppercase">Prediction Center</h3>
        </div>
        <div className="space-y-2 max-h-[420px] overflow-y-auto scroll-cyber pr-1">
          {signals.map((s, idx) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="border border-cyan-400/20 rounded-lg p-3 bg-black/20"
            >
              <div className="flex items-center gap-2">
                <p className="font-display text-[11px] tracking-wider text-gray-200 uppercase">{s.name}</p>
                <DirIcon direction={s.direction} />
                <p className="ml-auto font-terminal text-[11px] text-cyan-300">Risk {s.probability}%</p>
                <p className="font-terminal text-[11px] text-gray-500">Conf {s.confidence}%</p>
              </div>
              <p className="text-sm text-gray-300 mt-1">{s.explanation}</p>
              <div className="grid grid-cols-5 gap-1 mt-2">
                {[
                  ["24H", s.timeline.hours24],
                  ["7D", s.timeline.days7],
                  ["30D", s.timeline.days30],
                  ["90D", s.timeline.days90],
                  ["6M", s.timeline.months6],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded border border-gray-800 px-1.5 py-1 text-center">
                    <p className="font-display text-[9px] text-gray-500">{label}</p>
                    <p className="font-terminal text-[11px] text-cyan-400">{value}%</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="col-span-4 glass-panel p-4">
        <h3 className="font-display text-[11px] tracking-[0.15em] text-cyan-400 uppercase mb-3">Scenario Simulation Lab</h3>
        <div className="space-y-2">
          {scenarios.map((sc) => (
            <div key={sc.id} className={`rounded-lg border p-3 ${SCENARIO_STYLE[sc.riskLevel]}`}>
              <p className="font-display text-[10px] tracking-wider uppercase">{sc.title}</p>
              <p className="text-sm mt-1">{sc.summary}</p>
              <ul className="mt-1.5 text-[12px] space-y-0.5">
                {sc.impacts.map((impact) => <li key={impact}>• {impact}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
