"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  X, Maximize2, Minimize2, Save, FileDown, Brain, Activity, Gauge,
  Clock, ListChecks, Link2, Network, HardHat, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
} from "recharts";
import { useSuzieStore } from "@/store/suzieStore";
import { getRiskColor } from "@/services/riskScoring";
import { exportAnalysisPdf } from "@/lib/exportPdf";

const RISK_BADGE: Record<string, string> = {
  critical: "text-red-400 border-red-400/40 bg-red-400/10",
  high: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  medium: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  low: "text-cyan-400 border-cyan-400/40 bg-cyan-400/10",
  monitoring: "text-blue-400 border-blue-400/40 bg-blue-400/10",
};

function Typewriter({ text }: { text: string }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 3;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span>
      {shown}
      {shown.length < text.length && <span className="cursor-blink">▋</span>}
    </span>
  );
}

function Section({
  index, title, icon: Icon, children,
}: {
  index: number; title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass-panel p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <span className="font-terminal text-[10px] text-cyan-500/70">{String(index).padStart(2, "0")}</span>
        <Icon className="w-4 h-4 text-cyan-400" />
        <h3 className="font-display text-[12px] tracking-[0.12em] text-cyan-300 uppercase">{title}</h3>
      </div>
      <div className="text-sm text-gray-300">{children}</div>
    </motion.section>
  );
}

const STAGE_TEXT: Record<string, string> = {
  detected: "Input detected — parsing intent...",
  scanning: "Scanning global intelligence feeds...",
  analyzing: "Running AI impact analysis...",
};

export default function AnalysisModal() {
  const analysis = useSuzieStore((s) => s.analysis);
  const open = useSuzieStore((s) => s.analysisOpen);
  const stage = useSuzieStore((s) => s.analysisStage);
  const close = useSuzieStore((s) => s.closeAnalysis);
  const addReport = useSuzieStore((s) => s.addReport);
  const addLog = useSuzieStore((s) => s.addLog);

  const dragControls = useDragControls();
  const [maximized, setMaximized] = useState(false);
  const [size, setSize] = useState({ w: 920, h: 640 });
  const resizing = useRef(false);

  useEffect(() => {
    if (!resizing.current) return;
    const onMove = (e: PointerEvent) => {
      if (!resizing.current) return;
      setSize((s) => ({
        w: Math.max(420, s.w + e.movementX),
        h: Math.max(320, s.h + e.movementY),
      }));
    };
    const onUp = () => { resizing.current = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  });

  const handleSave = () => {
    if (!analysis) return;
    addReport({
      id: `analysis-${Date.now()}`,
      title: analysis.title,
      generatedAt: analysis.generatedAt,
      eventSummary: analysis.summary,
      affectedCountries: analysis.dna?.affectedCountries ?? [analysis.focusCountry],
      riskScore: analysis.riskScore,
      rippleChain: analysis.impact,
      prediction: analysis.prediction,
      recommendations: analysis.recommendations,
      briefing: analysis.summary,
    });
    addLog(`Analysis saved: ${analysis.title}`);
  };

  const loading = stage !== "ready";

  const chartData = analysis
    ? [
        { name: "World", v: analysis.riskScores.overall },
        { name: "Supply", v: analysis.riskScores.supplyChain },
        { name: "Conflict", v: analysis.riskScores.conflict },
        { name: "Climate", v: analysis.riskScores.climate },
        { name: "Cyber", v: analysis.riskScores.cyber },
        { name: "Constr.", v: analysis.riskScores.construction },
        { name: "Food", v: analysis.riskScores.food },
        { name: "Fuel", v: analysis.riskScores.fuel },
      ]
    : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
          />

          <motion.div
            drag={!maximized}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            style={
              maximized
                ? { width: "96vw", height: "92vh" }
                : { width: size.w, height: size.h }
            }
            className="relative animated-border flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Title bar (drag handle) */}
            <div
              onPointerDown={(e) => !maximized && dragControls.start(e)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b border-cyan-400/20 bg-black/50 ${maximized ? "" : "cursor-grab active:cursor-grabbing"}`}
            >
              <Brain className="w-4 h-4 text-cyan-400" />
              <span className="font-display text-[12px] tracking-[0.2em] text-cyan-300 uppercase">SUZIE Analysis</span>
              {analysis && (
                <span className="font-terminal text-[10px] text-gray-500 ml-2 truncate hidden sm:inline">
                  {analysis.focusCountry} · {new Date(analysis.generatedAt).toLocaleTimeString()}
                </span>
              )}
              <div className="ml-auto flex items-center gap-1">
                <button onClick={handleSave} title="Save" className="p-1.5 rounded hover:bg-cyan-400/10 text-gray-400 hover:text-cyan-400">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => analysis && exportAnalysisPdf(analysis)} title="Export PDF" className="p-1.5 rounded hover:bg-cyan-400/10 text-gray-400 hover:text-cyan-400">
                  <FileDown className="w-4 h-4" />
                </button>
                <button onClick={() => setMaximized((m) => !m)} title="Expand" className="p-1.5 rounded hover:bg-cyan-400/10 text-gray-400 hover:text-cyan-400">
                  {maximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button onClick={close} title="Close" className="p-1.5 rounded hover:bg-red-400/10 text-gray-400 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto scroll-cyber bg-suzie-bg/60 p-4">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-6 py-16">
                  <div className="relative">
                    <Loader2 className="w-14 h-14 text-cyan-400 animate-spin" />
                    <div className="absolute inset-0 rounded-full border border-cyan-400/30 globe-pulse-ring" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-display text-sm tracking-[0.15em] text-cyan-300 uppercase">
                      {STAGE_TEXT[stage] ?? "Initializing..."}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 font-terminal text-[10px] text-gray-500">
                      {["detected", "scanning", "analyzing"].map((st) => (
                        <span
                          key={st}
                          className={`px-2 py-0.5 rounded border ${
                            stage === st ? "border-cyan-400/50 text-cyan-400 bg-cyan-400/10" : "border-gray-800 text-gray-600"
                          }`}
                        >
                          {st.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : analysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* 1. AI Summary */}
                  <div className="lg:col-span-2">
                    <Section index={1} title="AI Summary" icon={Brain}>
                      <p className="leading-relaxed text-gray-200">
                        <Typewriter text={analysis.summary} />
                      </p>
                    </Section>
                  </div>

                  {/* 2. Impact Analysis */}
                  <Section index={2} title="Impact Analysis" icon={Activity}>
                    <ul className="space-y-1.5">
                      {analysis.impact.map((p, i) => (
                        <li key={i} className="flex gap-2 text-[13px] text-gray-300">
                          <span className="text-orange-400 mt-0.5">▸</span> {p}
                        </li>
                      ))}
                    </ul>
                  </Section>

                  {/* 3. Risk Assessment */}
                  <Section index={3} title="Risk Assessment" icon={Gauge}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-display text-3xl" style={{ color: getRiskColor(analysis.riskScore) }}>
                        {analysis.riskScore}
                      </span>
                      <span className="font-display text-[11px] tracking-wider px-2 py-0.5 rounded border"
                        style={{ color: getRiskColor(analysis.riskScore), borderColor: getRiskColor(analysis.riskScore) + "66" }}>
                        {analysis.riskLabel}
                      </span>
                    </div>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: "#0a1220", border: "1px solid rgba(0,240,255,0.3)", borderRadius: 8, fontSize: 11 }}
                            cursor={{ fill: "rgba(0,240,255,0.05)" }}
                          />
                          <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                            {chartData.map((d, i) => (
                              <Cell key={i} fill={getRiskColor(d.v)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Section>

                  {/* 4. Predictions */}
                  <Section index={4} title="Predictions" icon={Clock}>
                    <div className="space-y-2">
                      {[
                        { label: "24 Hours", v: analysis.prediction.hours24, c: "#ff2d55" },
                        { label: "7 Days", v: analysis.prediction.days7, c: "#ff9500" },
                        { label: "30 Days", v: analysis.prediction.days30, c: "#ffd60a" },
                        { label: "6 Months", v: analysis.prediction.months6, c: "#00f0ff" },
                      ].map((p) => (
                        <div key={p.label} className="pl-3 border-l-2" style={{ borderColor: p.c }}>
                          <p className="font-display text-[10px] tracking-wider" style={{ color: p.c }}>{p.label}</p>
                          <p className="text-[12px] text-gray-400">{p.v}</p>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* 5. Recommendations */}
                  <Section index={5} title="Recommendations" icon={ListChecks}>
                    <ol className="space-y-1.5">
                      {analysis.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2 text-[13px] text-gray-300">
                          <span className="font-terminal text-cyan-400">{i + 1}.</span> {r}
                        </li>
                      ))}
                    </ol>
                  </Section>

                  {/* 6. Sources */}
                  <Section index={6} title="Sources" icon={Link2}>
                    <ul className="space-y-1.5">
                      {analysis.sources.map((s, i) => (
                        <li key={i} className="text-[12px]">
                          <span className="font-display text-[10px] tracking-wider text-cyan-400">{s.label}</span>
                          <span className="text-gray-500"> — {s.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>

                  {/* 7. Related Events */}
                  <Section index={7} title="Related Events" icon={Network}>
                    <div className="space-y-1.5">
                      {analysis.relatedEvents.length === 0 && (
                        <p className="text-[12px] text-gray-500">No directly related events detected.</p>
                      )}
                      {analysis.relatedEvents.map((e) => (
                        <div key={e.id} className={`flex items-center justify-between gap-2 px-2 py-1 rounded border ${RISK_BADGE[e.riskLevel]}`}>
                          <span className="text-[12px] truncate">{e.title}</span>
                          <span className="font-terminal text-[9px] shrink-0">{e.country}</span>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* 8. Construction Impact */}
                  <Section index={8} title="Construction Impact" icon={HardHat}>
                    <div className="flex items-center gap-3 mb-2 text-[12px]">
                      <span className="text-gray-500">Sector risk</span>
                      <span className="font-display text-lg" style={{ color: getRiskColor(analysis.construction.overallRisk) }}>
                        {analysis.construction.overallRisk}
                      </span>
                      <span className="text-gray-500 ml-auto">BOQ overrun</span>
                      <span className="font-terminal text-orange-400">+{analysis.construction.boq.overrunPercent.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-1">
                      {analysis.construction.materials.map((m) => (
                        <div key={m.name} className="flex items-center justify-between text-[12px]">
                          <span className="text-gray-300">{m.name}</span>
                          <span className="flex items-center gap-2">
                            <span className="text-gray-500 font-terminal">${m.currentPrice.toFixed(0)}/{m.unit}</span>
                            <span className={m.changePercent > 0 ? "text-red-400" : "text-green-400"}>
                              {m.changePercent > 0 ? "+" : ""}{m.changePercent.toFixed(1)}%
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* 9. Generate PDF */}
                  <div className="lg:col-span-2 flex justify-center pt-1 pb-2">
                    <motion.button
                      onClick={() => analysis && exportAnalysisPdf(analysis)}
                      whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(0,240,255,0.25)" }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-cyan-400/40 text-cyan-400 font-display text-[12px] tracking-[0.15em] uppercase hover:bg-cyan-400/10"
                    >
                      <FileDown className="w-4 h-4" /> Generate PDF Report
                    </motion.button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Resize handle */}
            {!maximized && (
              <div
                onPointerDown={(e) => {
                  e.preventDefault();
                  resizing.current = true;
                }}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                style={{
                  background:
                    "linear-gradient(135deg, transparent 50%, rgba(0,240,255,0.5) 50%, rgba(0,240,255,0.5) 60%, transparent 60%, transparent 70%, rgba(0,240,255,0.5) 70%, rgba(0,240,255,0.5) 80%, transparent 80%)",
                }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
