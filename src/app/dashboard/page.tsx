"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { hydrateOnlineState, useSuzieStore } from "@/store/suzieStore";
import LiveAlerts from "@/components/LiveAlerts";
import RiskPanel from "@/components/RiskPanel";
import IntelTerminal from "@/components/IntelTerminal";
import VoiceCommand from "@/components/VoiceCommand";
import BriefingPanel from "@/components/BriefingPanel";
import CrisisDNA from "@/components/CrisisDNA";
import PredictionTimeline from "@/components/PredictionTimeline";
import AnalysisModal from "@/components/AnalysisModal";
import MissionControl from "@/components/MissionControl";
import HolographicCore from "@/components/HolographicCore";
import IntelligenceMemoryCenter from "@/components/IntelligenceMemoryCenter";
import GlobalForesightCenter from "@/components/GlobalForesightCenter";
import ExecutiveBriefingRoom from "@/components/ExecutiveBriefingRoom";
import CrisisDNAAnalyzerCenter from "@/components/CrisisDNAAnalyzerCenter";
import StrategicReportsCenter from "@/components/StrategicReportsCenter";
import { generatePrediction } from "@/services/aimlService";
import { generateCrisisDNA } from "@/services/crisisDetector";
import { filterEventsByCategory } from "@/services/newsScanner";
import { speakGreeting } from "@/lib/speech";
import { mockNewsHeadlines } from "@/data/mockShippingData";
import { BrainCircuit, FileText, Maximize2, Radar, ShieldAlert, FlaskConical, Dna, Files } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModuleView } from "@/store/suzieStore";
import { ExecutiveBriefing } from "@/types";

const GlobeScene = dynamic(() => import("@/components/GlobeScene"), { ssr: false });

const FILTERS = ["all", "supply_chain", "conflict", "climate", "cyber", "construction", "food", "fuel"];

export default function DashboardPage() {
  const router = useRouter();
  const {
    events, riskScores, selectedEvent, briefing, logs, activeFilter,
    isOnline, selectEvent, setBriefing, addLog, setActiveFilter,
    addCommand, commandHistory, setAnalysisStage, setAnalysis, openAnalysis,
    setMissionControl, setAICoreState, aiCoreState, currentModule, setCurrentModule,
    foresightSignals, scenarios, setForesight,
    executiveBriefing, setExecutiveBriefing,
    intelligenceMemory, returningBriefing, hydrateMemory, trackIntelligenceSession,
    reports,
  } = useSuzieStore();

  const [response, setResponse] = useState("");
  const [ready, setReady] = useState(false);
  const voiceBusyRef = useRef(false);
  const lastVoiceRef = useRef<{ query: string; at: number } | null>(null);

  useEffect(() => {
    hydrateOnlineState();
    hydrateMemory();
    setReady(true);
  }, [hydrateMemory]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qp = new URLSearchParams(window.location.search).get("module");
    const map: Record<string, ModuleView> = {
      memory: "memory",
      foresight: "foresight",
      briefing: "briefing-room",
      scenario: "scenario-lab",
      dna: "dna-analyzer",
      reports: "reports-center",
    };
    if (qp && map[qp]) setCurrentModule(map[qp]);
  }, [setCurrentModule]);

  useEffect(() => {
    if (!ready) return;
    if (!isOnline) {
      router.push("/boot");
      return;
    }

    let cancelled = false;

    async function loadLiveData(isRefresh = false) {
      addLog(isRefresh ? "Refreshing live intelligence feeds..." : "Scanning live global intelligence feeds...");
      setAICoreState("analyzing");
      try {
        const res = await fetch("/api/scan", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          const store = useSuzieStore.getState();
          store.setEvents(data.events);
          store.setRiskScores(data.riskScores);
          setBriefing(data.briefing);
          if (!store.selectedEvent && data.events[0]) selectEvent(data.events[0]);
          addLog(`Live scan complete — ${data.events.length} events, risk ${data.riskScores.overall}/100 — ${new Date().toLocaleTimeString()}`);
          setAICoreState("success");
        } else {
          addLog("Using cached data — live scan unavailable");
          setAICoreState("warning");
        }
      } catch {
        if (!cancelled) addLog("Offline mode — using cached intelligence data");
        setAICoreState("warning");
      }
    }

    loadLiveData();
    const interval = setInterval(() => loadLiveData(true), 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [ready, isOnline, setBriefing, addLog, router, selectEvent, setAICoreState]);

  const loadForesight = useCallback(async (query: string) => {
    try {
      const res = await fetch("/api/foresight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = res.ok ? await res.json() : null;
      if (data?.signals) {
        setForesight(data.signals, data.scenarios ?? []);
        addLog("Global foresight matrix updated");
      }
    } catch {
      addLog("Foresight engine unavailable");
    }
  }, [addLog, setForesight]);

  const loadExecutiveBrief = useCallback(async (mode: ExecutiveBriefing["mode"]) => {
    try {
      setAICoreState("thinking");
      const res = await fetch("/api/executive-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = res.ok ? await res.json() : null;
      if (data?.briefing) {
        setExecutiveBriefing(data.briefing);
        addLog(`Executive briefing generated (${mode})`);
        setCurrentModule("briefing-room");
        await speakGreeting(data.briefing.spokenText);
        setAICoreState("success");
      }
    } catch {
      addLog("Executive briefing service unavailable");
      setAICoreState("warning");
    }
  }, [addLog, setAICoreState, setCurrentModule, setExecutiveBriefing]);

  const runAnalysisWorkflow = useCallback(async (query: string) => {
    setAnalysisStage("detected");
    setAICoreState("thinking");
    addLog(`Input detected: "${query}"`);
    openAnalysis();

    await new Promise((r) => setTimeout(r, 600));
    setAnalysisStage("scanning");
    setAICoreState("analyzing");
    addLog("AI scanning global intelligence feeds...");

    await new Promise((r) => setTimeout(r, 900));
    setAnalysisStage("analyzing");
    addLog("Running impact analysis...");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = res.ok ? await res.json() : null;
      if (data?.analysis) {
        setAnalysis(data.analysis);
        trackIntelligenceSession({
          id: `s-${Date.now()}`,
          at: new Date().toISOString(),
          query,
          module: "general",
          focusCountry: data.analysis.focusCountry,
          focusRisk: data.analysis.riskLabel,
        });
        await speakGreeting(data.analysis.summary);
        addLog(`Analysis complete — ${data.analysis.focusCountry}`);
        setAICoreState("success");
      } else {
        throw new Error("no data");
      }
    } catch {
      addLog("Analysis API unavailable — showing fallback.");
      setAnalysis(null);
      setAICoreState("warning");
    }
    setAnalysisStage("ready");
  }, [addLog, openAnalysis, setAICoreState, setAnalysis, setAnalysisStage, trackIntelligenceSession]);

  const handleCommand = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) return;
    addCommand(q);

    const lower = q.toLowerCase();

    if (lower.includes("scan") || lower.includes("analyze") || lower.includes("what") || lower.includes("show") || lower.includes("risk")) {
      await runAnalysisWorkflow(q);
      await loadForesight(q);
      return;
    }
    if (lower.includes("memory")) { setCurrentModule("memory"); return; }
    if (lower.includes("foresight") || lower.includes("forecast")) { setCurrentModule("foresight"); await loadForesight(q); return; }
    if (lower.includes("brief me") || lower.includes("executive briefing")) { await loadExecutiveBrief("60s"); return; }
    if (lower.includes("scenario")) { setCurrentModule("scenario-lab"); await loadForesight(q); return; }
    if (lower.includes("dna")) { setCurrentModule("dna-analyzer"); return; }
    if (lower.includes("strategic reports")) { setCurrentModule("reports-center"); return; }

    if (lower.includes("construction")) { router.push("/construction"); return; }
    if (lower.includes("report")) { router.push("/reports"); return; }
    if (lower.includes("simulator") || lower.includes("ripple") || lower.includes("what if")) { router.push("/simulator"); return; }
    if (lower.includes("mission control")) { setMissionControl(true); return; }

    const normalized = lower.replace(/\s+/g, " ");
    const now = Date.now();
    if (
      voiceBusyRef.current ||
      (lastVoiceRef.current &&
        lastVoiceRef.current.query === normalized &&
        now - lastVoiceRef.current.at < 5000)
    ) {
      return;
    }
    voiceBusyRef.current = true;
    lastVoiceRef.current = { query: normalized, at: now };
    setAICoreState("listening");

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = res.ok ? await res.json() : null;
      const answer = data?.response ?? `I heard you, ${q}. Could you rephrase that?`;
      setResponse(answer);
      await speakGreeting(answer);
      addLog(`SUZIE: ${answer.length > 80 ? answer.slice(0, 80) + "..." : answer}`);
      trackIntelligenceSession({
        id: `s-${Date.now()}`,
        at: new Date().toISOString(),
        query: q,
        module: "general",
      });
      setAICoreState("success");
    } catch {
      addLog("Voice query failed");
      setAICoreState("warning");
    } finally {
      voiceBusyRef.current = false;
    }
  }, [addCommand, addLog, loadExecutiveBrief, loadForesight, router, runAnalysisWorkflow, setAICoreState, setCurrentModule, setMissionControl, trackIntelligenceSession]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <p className="font-display text-sm text-cyan-400 tracking-[0.2em] animate-pulse">INITIALIZING COMMAND CENTER...</p>
      </div>
    );
  }

  const filtered = filterEventsByCategory(events, activeFilter);
  const dna = selectedEvent ? generateCrisisDNA(selectedEvent) : null;
  const prediction = generatePrediction(selectedEvent?.title ?? "stable");
  const moduleTabs: { id: ModuleView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "command", label: "Command", icon: BrainCircuit },
    { id: "memory", label: "Memory Center", icon: BrainCircuit },
    { id: "foresight", label: "Foresight Center", icon: Radar },
    { id: "briefing-room", label: "Briefing Room", icon: ShieldAlert },
    { id: "scenario-lab", label: "Scenario Lab", icon: FlaskConical },
    { id: "dna-analyzer", label: "DNA Analyzer", icon: Dna },
    { id: "reports-center", label: "Reports Center", icon: Files },
  ];

  return (
    <>
      <AnalysisModal />
      <MissionControl />

      <div className="min-h-screen pt-24 pb-4 px-4 grid-bg">
        <div className="max-w-[1900px] mx-auto mb-3 flex flex-wrap gap-2">
          {moduleTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentModule(id)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-display tracking-wider uppercase flex items-center gap-1.5 ${
                currentModule === id
                  ? "border-cyan-400/55 text-cyan-300 bg-cyan-400/10"
                  : "border-gray-800 text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="max-w-[1900px] mx-auto h-[calc(100vh-7rem)] grid grid-cols-12 grid-rows-[1fr_260px] gap-3">

          {/* LEFT — Live Alerts + Filters + Breaking News */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-3 row-span-1 glass-panel hover-glow p-4 flex flex-col gap-3 overflow-hidden"
          >
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`font-display text-[9px] tracking-wider px-2 py-0.5 rounded border transition-all ${
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

            <div className="mt-auto space-y-1.5">
              <p className="font-display text-[10px] text-gray-500 uppercase tracking-wider">Breaking News</p>
              {mockNewsHeadlines.slice(0, 4).map((n) => (
                <p key={n.headline} className="font-terminal text-[10px] text-gray-500 truncate">
                  <span className="text-gray-700">{n.time}</span> {n.headline}
                </p>
              ))}
            </div>
          </motion.div>

          {/* CENTER — Globe + Orb + Risk bars */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-6 row-span-1 relative glass-panel overflow-hidden"
          >
            <GlobeScene events={events} className="w-full h-full" />

            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
              <HolographicCore state={aiCoreState} speaking={voiceBusyRef.current} size={142} />
              <p className="font-display text-[10px] text-cyan-400/70 mt-1 tracking-[0.2em]">SCANNING</p>
            </div>

            <div className="absolute bottom-3 left-3 right-3 glass-panel p-3 pointer-events-none">
              <RiskPanel scores={riskScores} compact />
            </div>
          </motion.div>

          {/* RIGHT — Briefing + DNA + Predictions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-3 row-span-1 glass-panel hover-glow p-4 flex flex-col gap-4 overflow-y-auto scroll-cyber"
          >
            {currentModule === "command" && (
              <>
                <BriefingPanel briefing={briefing} selectedEvent={selectedEvent} />
                {dna && <CrisisDNA dna={dna} />}
                <PredictionTimeline prediction={prediction} />
                {response && (
                  <div className="glass-panel p-3 border border-cyan-400/20">
                    <p className="font-display text-[10px] text-cyan-400 tracking-wider uppercase mb-1">SUZIE Response</p>
                    <p className="text-[12px] text-gray-300">{response}</p>
                  </div>
                )}
              </>
            )}
            {currentModule === "briefing-room" && (
              <ExecutiveBriefingRoom briefing={executiveBriefing} onMode={loadExecutiveBrief} />
            )}
            {currentModule === "memory" && (
              <div className="text-sm text-gray-400">Intelligence Memory Center active in workspace panel below.</div>
            )}
            {currentModule === "foresight" && (
              <div className="text-sm text-gray-400">Global Foresight Center active in workspace panel below.</div>
            )}
            {currentModule === "scenario-lab" && (
              <div className="text-sm text-gray-400">Scenario Simulation Lab active in workspace panel below.</div>
            )}
            {currentModule === "dna-analyzer" && (
              <div className="text-sm text-gray-400">Crisis DNA Analyzer active in workspace panel below.</div>
            )}
            {currentModule === "reports-center" && (
              <div className="text-sm text-gray-400">Strategic Reports Center active in workspace panel below.</div>
            )}
          </motion.div>

          {/* BOTTOM — FULL-WIDTH TERMINAL */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-8 row-span-1"
          >
            {currentModule === "command" && (
              <IntelTerminal logs={logs} commandHistory={commandHistory} onCommand={handleCommand} />
            )}
            {currentModule === "memory" && (
              <IntelligenceMemoryCenter memory={intelligenceMemory} returningBriefing={returningBriefing} />
            )}
            {(currentModule === "foresight" || currentModule === "scenario-lab") && (
              <GlobalForesightCenter signals={foresightSignals} scenarios={scenarios} />
            )}
            {currentModule === "dna-analyzer" && (
              <CrisisDNAAnalyzerCenter events={events} />
            )}
            {currentModule === "reports-center" && (
              <StrategicReportsCenter reports={reports} />
            )}
            {currentModule === "briefing-room" && (
              <ExecutiveBriefingRoom briefing={executiveBriefing} onMode={loadExecutiveBrief} />
            )}
          </motion.div>

          {/* BOTTOM-RIGHT — Voice + Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-4 row-span-1 glass-panel hover-glow p-4 flex flex-col gap-3"
          >
            <p className="font-display text-[10px] text-cyan-400 tracking-[0.15em] uppercase">Voice Command</p>
            <VoiceCommand autoStart onCommand={handleCommand} />

            <div className="mt-auto flex flex-wrap gap-2">
              <motion.button
                onClick={() => router.push("/reports")}
                whileHover={{ scale: 1.03, boxShadow: "0 0 16px rgba(0,240,255,0.2)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-cyan-400/30 text-[11px] font-display tracking-wider text-cyan-400 hover:bg-cyan-400/10"
              >
                <FileText className="w-3.5 h-3.5" /> Report
              </motion.button>
              <motion.button
                onClick={() => setMissionControl(true)}
                whileHover={{ scale: 1.03, boxShadow: "0 0 16px rgba(0,240,255,0.2)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-cyan-400/30 text-[11px] font-display tracking-wider text-cyan-400 hover:bg-cyan-400/10"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Mission Control
              </motion.button>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
