"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Search } from "lucide-react";
import RippleGraph from "@/components/RippleGraph";
import PredictionTimeline from "@/components/PredictionTimeline";
import { analyzeRipple } from "@/services/rippleAnalyzer";
import { speakGreeting } from "@/lib/speech";
import { useSuzieStore } from "@/store/suzieStore";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const PRESETS = [
  "What happens if oil prices rise 20%?",
  "What if China stops exports?",
  "What if a port closes?",
  "What if heavy rain hits Sri Lanka?",
];

export default function SimulatorPage() {
  const [scenario, setScenario] = useState(PRESETS[0]);
  const [result, setResult] = useState(() => analyzeRipple(PRESETS[0]));
  const addLog = useSuzieStore((s) => s.addLog);

  const runSimulation = (text: string) => {
    const analysis = analyzeRipple(text);
    setResult(analysis);
    addLog(`Ripple simulation: ${text}`);
    speakGreeting(analysis.summary);
  };

  const chartData = result.chain.map((node, i) => ({
    step: i + 1,
    impact: node.impact,
    label: node.label.slice(0, 20),
  }));

  return (
    <div className="min-h-screen pt-24 px-6 pb-8 grid-bg">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold neon-text-cyan tracking-wider">RIPPLE SIMULATOR</h1>
          </div>
          <p className="text-sm text-gray-500">Model how global events cascade through supply chains and construction</p>
        </motion.div>

        <div className="glass-panel p-4">
          <div className="flex gap-2">
            <input
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSimulation(scenario)}
              className="flex-1 bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-cyan-400/50"
              placeholder="Enter a what-if scenario..."
            />
            <button
              onClick={() => runSimulation(scenario)}
              className="px-4 py-2 rounded-lg border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Simulate
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => { setScenario(p); runSimulation(p); }}
                className="text-[10px] px-3 py-1 rounded-full border border-gray-700 text-gray-500 hover:border-cyan-400/30 hover:text-cyan-400"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6">
            <h2 className="text-sm font-semibold text-cyan-400 mb-4 tracking-wider">IMPACT CHAIN</h2>
            <RippleGraph chain={result.chain} />
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-6">
              <h2 className="text-sm font-semibold text-cyan-400 mb-4 tracking-wider">IMPACT GRAPH</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                  <XAxis dataKey="step" stroke="#4a5568" fontSize={10} />
                  <YAxis stroke="#4a5568" fontSize={10} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#0a1628", border: "1px solid #00f0ff33", fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="impact" stroke="#00f0ff" strokeWidth={2} dot={{ fill: "#00f0ff", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel p-6">
              <PredictionTimeline prediction={result.prediction} />
            </div>
          </div>
        </div>

        <div className="glass-panel p-4">
          <p className="text-xs text-gray-400">{result.summary}</p>
        </div>
      </div>
    </div>
  );
}
