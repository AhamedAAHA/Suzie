"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { hydrateOnlineState, useSuzieStore } from "@/store/suzieStore";
import LiveAlerts from "@/components/LiveAlerts";
import RiskPanel from "@/components/RiskPanel";
import TerminalLogs from "@/components/TerminalLogs";
import VoiceCommand from "@/components/VoiceCommand";
import SuzieOrb from "@/components/SuzieOrb";
import CrisisDNA from "@/components/CrisisDNA";
import PredictionTimeline from "@/components/PredictionTimeline";
import { generatePrediction } from "@/services/aimlService";
import { generateCrisisDNA } from "@/services/crisisDetector";
import { filterEventsByCategory } from "@/services/newsScanner";
import { speakGreeting } from "@/lib/speech";
import { mockNewsHeadlines } from "@/data/mockShippingData";
import { FileText, Maximize2 } from "lucide-react";
import { useRouter } from "next/navigation";

const GlobeScene = dynamic(() => import("@/components/GlobeScene"), { ssr: false });

const FILTERS = ["all", "supply_chain", "conflict", "climate", "cyber", "construction", "food", "fuel"];

export default function DashboardPage() {
  const router = useRouter();
  const {
    events, riskScores, selectedEvent, briefing, logs, activeFilter,
    isOnline, selectEvent, setBriefing, addLog, setActiveFilter,
  } = useSuzieStore();

  const [response, setResponse] = useState("");

  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrateOnlineState();
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isOnline) {
      router.push("/boot");
      return;
    }

    async function loadLiveData() {
      addLog("Scanning live global intelligence feeds...");
      try {
        const res = await fetch("/api/scan");
        if (res.ok) {
          const data = await res.json();
          useSuzieStore.getState().setEvents(data.events);
          useSuzieStore.getState().setRiskScores(data.riskScores);
          setBriefing(data.briefing);
          if (data.events[0]) selectEvent(data.events[0]);
          addLog(`Live scan complete — ${data.events.length} events, risk ${data.riskScores.overall}/100`);
        } else {
          addLog("Using cached data — live scan unavailable");
        }
      } catch {
        addLog("Offline mode — using cached intelligence data");
      }
    }

    loadLiveData();
  }, [ready, isOnline, setBriefing, addLog, router, selectEvent]);

  const handleVoice = useCallback(async (query: string) => {
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = res.ok ? await res.json() : null;
      const answer = data?.response ?? `Processing: "${query}"`;
      setResponse(answer);
      speakGreeting(answer);
      addLog(`SUZIE: ${answer.slice(0, 80)}...`);
    } catch {
      addLog("Voice query failed");
    }

    if (query.toLowerCase().includes("construction")) router.push("/construction");
    if (query.toLowerCase().includes("report")) router.push("/reports");
    if (query.toLowerCase().includes("simulator") || query.toLowerCase().includes("what if")) router.push("/simulator");
  }, [addLog, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <p className="text-cyan-400 font-mono text-sm animate-pulse">INITIALIZING COMMAND CENTER...</p>
      </div>
    );
  }

  const filtered = filterEventsByCategory(events, activeFilter);
  const dna = selectedEvent ? generateCrisisDNA(selectedEvent) : null;
  const prediction = generatePrediction(selectedEvent?.title ?? "stable");

  return (
    <div className="min-h-screen pt-14 pb-4 px-3 grid-bg">
      <div className="max-w-[1800px] mx-auto h-[calc(100vh-4rem)] grid grid-cols-12 grid-rows-[1fr_auto] gap-3">
        {/* Left Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-3 row-span-1 glass-panel p-4 flex flex-col gap-3 overflow-hidden"
        >
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`text-[9px] px-2 py-0.5 rounded border transition-all ${
                  activeFilter === f
                    ? "border-cyan-400/50 text-cyan-400 bg-cyan-400/10"
                    : "border-gray-800 text-gray-600 hover:text-gray-400"
                }`}
              >
                {f === "all" ? "ALL" : f.replace(/_/g, " ").toUpperCase()}
              </button>
            ))}
          </div>

          <LiveAlerts
            events={filtered}
            onSelect={selectEvent}
            selectedId={selectedEvent?.id}
            filter={activeFilter}
          />

          <div className="mt-auto space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Breaking News</p>
            {mockNewsHeadlines.slice(0, 4).map((n) => (
              <p key={n.headline} className="text-[10px] text-gray-500 truncate">
                <span className="text-gray-700">{n.time}</span> {n.headline}
              </p>
            ))}
          </div>
        </motion.div>

        {/* Center — Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-6 row-span-1 relative glass-panel overflow-hidden"
        >
          <GlobeScene events={events} className="w-full h-full" />

          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <SuzieOrb size={60} active pulsing />
            <p className="text-[10px] text-cyan-400/70 mt-1 tracking-widest">SCANNING</p>
          </div>

          <div className="absolute bottom-4 left-4 right-4 glass-panel p-3 pointer-events-none">
            <RiskPanel scores={riskScores} compact />
          </div>
        </motion.div>

        {/* Right Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-3 row-span-1 glass-panel p-4 flex flex-col gap-3 overflow-y-auto"
        >
          <div>
            <p className="text-[10px] text-cyan-400 tracking-wider uppercase mb-2">SUZIE Briefing</p>
            <p className="text-xs text-gray-300 leading-relaxed">{briefing}</p>
          </div>

          {selectedEvent && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-200">{selectedEvent.title}</p>
              <p className="text-[10px] text-gray-500">{selectedEvent.description}</p>
              <div className="space-y-1">
                {selectedEvent.rippleEffects.map((r) => (
                  <p key={r} className="text-[10px] text-orange-400/80 flex gap-1">
                    <span>→</span> {r}
                  </p>
                ))}
              </div>
            </div>
          )}

          {dna && <CrisisDNA dna={dna} />}
          <PredictionTimeline prediction={prediction} />

          {response && (
            <div className="glass-panel p-3 border border-cyan-400/20">
              <p className="text-[10px] text-cyan-400 mb-1">SUZIE Response</p>
              <p className="text-xs text-gray-300">{response}</p>
            </div>
          )}
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-12 glass-panel p-3 flex items-center gap-4"
        >
          <div className="flex-1">
            <TerminalLogs logs={logs} maxHeight="60px" />
          </div>

          <div className="w-80">
            <VoiceCommand onCommand={handleVoice} />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/reports")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-400/30 text-xs text-cyan-400 hover:bg-cyan-400/10"
            >
              <FileText className="w-3 h-3" /> Report
            </button>
            <button
              onClick={() => useSuzieStore.getState().setMissionControl(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-cyan-400"
            >
              <Maximize2 className="w-3 h-3" /> Mission Control
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
