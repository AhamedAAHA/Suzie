"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HardHat } from "lucide-react";
import ConstructionImpact from "@/components/ConstructionImpact";
import { scanConstructionImpact } from "@/services/constructionImpactScanner";
import { useSuzieStore } from "@/store/suzieStore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function ConstructionPage() {
  const events = useSuzieStore((s) => s.events);
  const [data, setData] = useState(() => scanConstructionImpact(events));

  useEffect(() => {
    setData(scanConstructionImpact(events));
  }, [events]);

  const chartData = data.materials.map((m) => ({
    name: m.name.split(" ")[0],
    change: m.changePercent,
    risk: m.riskLevel,
  }));

  const COLORS: Record<string, string> = {
    high: "#ff9500",
    medium: "#ffd60a",
    low: "#00f0ff",
    critical: "#ff2d55",
    monitoring: "#0a84ff",
  };

  return (
    <div className="min-h-screen pt-16 px-6 pb-8 grid-bg">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <HardHat className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold neon-text-cyan tracking-wider">CONSTRUCTION IMPACT MODE</h1>
          </div>
          <p className="text-sm text-gray-500">
            QS-focused analysis — how global events affect materials, BOQ, and project timelines
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Overall Risk", value: data.overallRisk, color: "#ff9500" },
            { label: "BOQ Overrun", value: `${data.boqImpact.overrunPercent.toFixed(1)}%`, color: "#ff2d55" },
            { label: "Delay Probability", value: `${data.boqImpact.delayProbability}%`, color: "#ffd60a" },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-4 text-center">
              <p className="text-[10px] text-gray-500 uppercase">{stat.label}</p>
              <p className="text-2xl font-mono font-bold mt-1" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6">
            <h2 className="text-sm font-semibold text-cyan-400 mb-4 tracking-wider">MATERIAL RISK DASHBOARD</h2>
            <ConstructionImpact materials={data.materials} boqImpact={data.boqImpact} />
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-sm font-semibold text-cyan-400 mb-4 tracking-wider">PRICE CHANGE CHART</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                <XAxis type="number" stroke="#4a5568" fontSize={10} unit="%" />
                <YAxis type="category" dataKey="name" stroke="#4a5568" fontSize={10} width={60} />
                <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid #00f0ff33", fontSize: 11 }} />
                <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.risk] ?? "#00f0ff"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
