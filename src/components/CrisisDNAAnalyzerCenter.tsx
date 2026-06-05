"use client";

import { motion } from "framer-motion";
import { Dna, Globe2, Factory, Truck, Landmark } from "lucide-react";
import { GlobalEvent } from "@/types";
import { generateCrisisDNA } from "@/services/crisisDetector";

interface Props {
  events: GlobalEvent[];
}

function economicImpactScore(event: GlobalEvent): number {
  const base = event.riskLevel === "critical" ? 82 : event.riskLevel === "high" ? 68 : 52;
  return Math.min(98, base + event.rippleEffects.length * 2);
}

function constructionImpactScore(event: GlobalEvent): number {
  const hasConstruction = event.categories.includes("construction");
  const base = hasConstruction ? 72 : 46;
  return Math.min(96, base + (event.riskLevel === "critical" ? 12 : 5));
}

function supplyChainImpactScore(event: GlobalEvent): number {
  const hasSupply = event.categories.includes("supply_chain");
  const base = hasSupply ? 76 : 44;
  return Math.min(96, base + (event.type === "shipping_disruption" ? 14 : 4));
}

export default function CrisisDNAAnalyzerCenter({ events }: Props) {
  const focus = events.slice(0, 6).map((e) => {
    const dna = generateCrisisDNA(e);
    return {
      event: e,
      dna,
      economic: economicImpactScore(e),
      construction: constructionImpactScore(e),
      supply: supplyChainImpactScore(e),
    };
  });

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <Dna className="w-4 h-4 text-cyan-400" />
        <h3 className="font-display text-[11px] tracking-[0.15em] text-cyan-400 uppercase">Crisis DNA Analyzer</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 max-h-[460px] overflow-y-auto scroll-cyber pr-1">
        {focus.map(({ event, dna, economic, construction, supply }, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-cyan-400/20 bg-black/20 p-3"
          >
            <p className="text-sm text-gray-200 font-semibold">{event.title}</p>
            <p className="text-[11px] text-gray-500">{event.country} · {event.riskLevel.toUpperCase()}</p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
              <p><span className="text-gray-500">Origin:</span> <span className="text-gray-200">{dna.origin}</span></p>
              <p><span className="text-gray-500">Risk:</span> <span className="text-red-300">{dna.riskScore}</span></p>
              <p><span className="text-gray-500">Confidence:</span> <span className="text-cyan-300">{Math.round(dna.confidence * 100)}%</span></p>
              <p><span className="text-gray-500">Spread:</span> <span className="text-orange-300">{dna.spreadSpeed.toUpperCase()}</span></p>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded border border-gray-800 px-2 py-1">
                <p className="text-[10px] text-gray-500 flex items-center gap-1"><Landmark className="w-3 h-3" /> Economic</p>
                <p className="font-terminal text-[12px] text-orange-300">{economic}</p>
              </div>
              <div className="rounded border border-gray-800 px-2 py-1">
                <p className="text-[10px] text-gray-500 flex items-center gap-1"><Factory className="w-3 h-3" /> Construction</p>
                <p className="font-terminal text-[12px] text-yellow-300">{construction}</p>
              </div>
              <div className="rounded border border-gray-800 px-2 py-1">
                <p className="text-[10px] text-gray-500 flex items-center gap-1"><Truck className="w-3 h-3" /> Supply</p>
                <p className="font-terminal text-[12px] text-cyan-300">{supply}</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-2 flex items-center gap-1"><Globe2 className="w-3 h-3" /> Affected Countries</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {dna.affectedCountries.map((c) => (
                <span key={c} className="text-[10px] px-1.5 py-0.5 rounded border border-cyan-400/25 text-cyan-300">{c}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
