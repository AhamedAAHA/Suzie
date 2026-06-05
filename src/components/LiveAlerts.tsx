"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Radio } from "lucide-react";
import { GlobalEvent } from "@/types";

const RISK_STYLES: Record<string, string> = {
  critical: "border-red-500/50 bg-red-500/5 text-red-400",
  high: "border-orange-500/50 bg-orange-500/5 text-orange-400",
  medium: "border-yellow-500/50 bg-yellow-500/5 text-yellow-400",
  low: "border-blue-500/50 bg-blue-500/5 text-blue-400",
  monitoring: "border-cyan-500/50 bg-cyan-500/5 text-cyan-400",
};

interface LiveAlertsProps {
  events: GlobalEvent[];
  onSelect?: (event: GlobalEvent) => void;
  selectedId?: string;
  filter?: string;
}

export default function LiveAlerts({ events, onSelect, selectedId, filter = "all" }: LiveAlertsProps) {
  const filtered =
    filter === "all" ? events : events.filter((e) => e.categories.includes(filter as GlobalEvent["categories"][number]));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-3 h-3 text-red-400 animate-pulse" />
        <span className="text-xs text-gray-400 tracking-wider uppercase">Live Global Alerts</span>
        <span className="ml-auto text-xs font-mono text-cyan-400">{filtered.length} active</span>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {filtered.map((evt, i) => (
          <motion.button
            key={evt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect?.(evt)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              RISK_STYLES[evt.riskLevel]
            } ${selectedId === evt.id ? "ring-1 ring-cyan-400/50" : "hover:bg-white/5"}`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{evt.title}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{evt.country} · {evt.type.replace(/_/g, " ")}</p>
                <p className="text-[10px] opacity-50 mt-1 font-mono">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
