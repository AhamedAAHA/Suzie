"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { hydrateOnlineState, useSuzieStore } from "@/store/suzieStore";
import LiveAlerts from "@/components/LiveAlerts";
import RiskPanel from "@/components/RiskPanel";
import IntelTerminal from "@/components/IntelTerminal";
import VoiceCommand, { VoiceCommandHandle } from "@/components/VoiceCommand";
import ClapDetector from "@/components/ClapDetector";
import BriefingPanel from "@/components/BriefingPanel";
import CrisisDNA from "@/components/CrisisDNA";
import PredictionTimeline from "@/components/PredictionTimeline";
import AnalysisModal from "@/components/AnalysisModal";
import MissionControl from "@/components/MissionControl";
import IntelligenceMemoryCenter from "@/components/IntelligenceMemoryCenter";
import GlobalForesightCenter from "@/components/GlobalForesightCenter";
import ExecutiveBriefingRoom from "@/components/ExecutiveBriefingRoom";
import CrisisDNAAnalyzerCenter from "@/components/CrisisDNAAnalyzerCenter";
import StrategicReportsCenter from "@/components/StrategicReportsCenter";
import MissionQueue from "@/components/MissionQueue";
import AddTaskModal from "@/components/AddTaskModal";
import DailyBriefing from "@/components/DailyBriefing";
import TomorrowPlan from "@/components/TomorrowPlan";
import TaskAnalysisPopup from "@/components/TaskAnalysisPopup";
import WakeWordListener from "@/components/WakeWordListener";
import HoloCore from "@/components/HoloCore";
import { WakeState } from "@/components/SuzieStatusOrb";
import { generatePrediction } from "@/services/aimlService";
import { generateCrisisDNA } from "@/services/crisisDetector";
import { filterEventsByCategory } from "@/services/newsScanner";
import { primeSpeech, speakGreeting } from "@/lib/speech";
import { isWakePhrase } from "@/lib/wakePhrases";
import { mockNewsHeadlines } from "@/data/mockShippingData";
import { buildRecommendText } from "@/services/dailyBriefingService";
import {
  parseVoiceCommand,
  stripWakePrefix,
  isJustWake,
  normalizeVoiceNav,
} from "@/services/speechCommandService";
import { Task } from "@/types/task";
import {
  BrainCircuit,
  FileText,
  Maximize2,
  Radar,
  ShieldAlert,
  FlaskConical,
  Dna,
  Files,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ModuleView } from "@/store/suzieStore";
import { ExecutiveBriefing } from "@/types";

const GlobeScene = dynamic(() => import("@/components/GlobeScene"), {
  ssr: false,
});

const FILTERS = [
  "all",
  "supply_chain",
  "conflict",
  "climate",
  "cyber",
  "construction",
  "food",
  "fuel",
];

export default function DashboardPage() {
  const router = useRouter();
  const {
    events,
    riskScores,
    selectedEvent,
    briefing,
    logs,
    activeFilter,
    isOnline,
    selectEvent,
    setBriefing,
    addLog,
    setActiveFilter,
    addCommand,
    commandHistory,
    setAnalysisStage,
    setAnalysis,
    openAnalysis,
    setMissionControl,
    setAICoreState,
    aiCoreState,
    currentModule,
    setCurrentModule,
    foresightSignals,
    scenarios,
    setForesight,
    executiveBriefing,
    setExecutiveBriefing,
    intelligenceMemory,
    returningBriefing,
    hydrateMemory,
    trackIntelligenceSession,
    reports,
    userMemory,
    // task state
    tasks,
    hydrateTasks,
    addTaskItem,
    updateTaskItem,
    removeTaskItem,
    completeTaskItem,
    taskAnalysisOpen,
    dailyBriefingOpen,
    tomorrowPlanOpen,
    addTaskModalOpen,
    editingTask,
    setTaskAnalysisOpen,
    setDailyBriefingOpen,
    setTomorrowPlanOpen,
    setAddTaskModalOpen,
    setEditingTask,
  } = useSuzieStore();

  const [response, setResponse] = useState("");
  const [ready, setReady] = useState(false);
  const voiceBusyRef    = useRef(false);
  const lastVoiceRef    = useRef<{ query: string; at: number } | null>(null);
  const hasGreetedRef   = useRef(false);
  const voiceCommandRef = useRef<VoiceCommandHandle>(null);
  const [voiceGateLocked, setVoiceGateLocked] = useState(false);

  // Derive wake state from AI core state + speech events
  const [wakeState, setWakeState] = useState<WakeState>("online");
  const wakeLogs = logs.filter(
    (l) =>
      l.includes("[SYSTEM]") ||
      l.includes("[BOOT]") ||
      l.includes("[VOICE]") ||
      l.includes("[TASKS]") ||
      l.includes("[ALERT]") ||
      l.includes("Wake signal") ||
      l.includes("SUZIE ONLINE")
  );

  // Track speech events for wake state
  useEffect(() => {
    const onStart = () => setWakeState("speaking");
    const onEnd = () => setWakeState("online");
    window.addEventListener("suzie:speech-start", onStart);
    window.addEventListener("suzie:speech-end", onEnd);
    return () => {
      window.removeEventListener("suzie:speech-start", onStart);
      window.removeEventListener("suzie:speech-end", onEnd);
    };
  }, []);

  // Mirror aiCoreState into wakeState (speech events take priority via above)
  useEffect(() => {
    if (aiCoreState === "thinking" || aiCoreState === "analyzing") {
      setWakeState("thinking");
    } else if (aiCoreState === "listening") {
      setWakeState("listening");
    } else if (
      aiCoreState === "success" ||
      aiCoreState === "idle" ||
      aiCoreState === "warning"
    ) {
      setWakeState((prev) => (prev === "speaking" ? "speaking" : "online"));
    }
  }, [aiCoreState]);

  useEffect(() => {
    hydrateOnlineState();
    hydrateMemory();
    hydrateTasks();
    setReady(true);
  }, [hydrateMemory, hydrateTasks]);

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
      mission: "mission",
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
      addLog(
        isRefresh
          ? "Refreshing live intelligence feeds..."
          : "Scanning live global intelligence feeds..."
      );
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
          addLog(
            `Live scan complete — ${data.events.length} events, risk ${data.riskScores.overall}/100 — ${new Date().toLocaleTimeString()}`
          );
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

  // Auto-activate voice gate on dashboard load so commands work immediately
  useEffect(() => {
    if (!ready || hasGreetedRef.current) return;
    hasGreetedRef.current = true;
    primeSpeech();
    // Unlock the gate right away — no need to say "hey suzie" on first load
    // Gate will auto-lock after 15 min of inactivity
    setTimeout(() => {
      voiceCommandRef.current?.wake();
    }, 800);
    addLog("[SYSTEM] SUZIE online — neural link active.");
  }, [ready]);

  const loadForesight = useCallback(
    async (query: string) => {
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
    },
    [addLog, setForesight]
  );

  const loadExecutiveBrief = useCallback(
    async (mode: ExecutiveBriefing["mode"]) => {
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
    },
    [addLog, setAICoreState, setCurrentModule, setExecutiveBriefing]
  );

  const runAnalysisWorkflow = useCallback(
    async (query: string, options?: { openModal?: boolean }) => {
      setAnalysisStage("detected");
      setAICoreState("thinking");
      addLog(`Input detected: "${query}"`);
      if (options?.openModal) openAnalysis();

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
    },
    [
      addLog,
      openAnalysis,
      setAICoreState,
      setAnalysis,
      setAnalysisStage,
      trackIntelligenceSession,
    ]
  );

  const handleCommand = useCallback(
    async (query: string) => {
      const q = query.trim();
      if (!q) return;
      addCommand(q);
      addLog(`[CMD] "${q.slice(0, 60)}"`);

      const lower = q.toLowerCase();

      // ── WAKE WORD ONLY ──────────────────────────────────────────────────
      if (isWakePhrase(lower) && isJustWake(lower)) {
        addLog("[SYSTEM] Wake signal detected");
        setWakeState("online");
        setAICoreState("success");

        // Concise hacker-style status — counts only, no event titles
        const st     = useSuzieStore.getState();
        const evts   = st.events ?? [];
        const scores = st.riskScores;
        const tasks  = (st.tasks ?? []).filter((t) => t.status !== "completed");
        const critical = evts.filter((e) => e.riskLevel === "critical").length;

        const parts: string[] = ["Neural link established."];
        if (evts.length > 0) {
          parts.push(
            critical > 0
              ? `${evts.length} threats detected. ${critical} critical.`
              : `${evts.length} signals in threat matrix.`
          );
        }
        if (scores?.overall) parts.push(`Threat index: ${scores.overall}.`);
        if (tasks.length > 0) parts.push(`${tasks.length} operations queued.`);
        parts.push("Awaiting directive.");

        const brief = parts.join(" ");
        addLog(`[SYSTEM] ${brief}`);
        await speakGreeting(brief);
        return;
      }

      // Strip wake prefix for task command matching
      const stripped = stripWakePrefix(lower);
      const nav = normalizeVoiceNav(q);
      const cmd = parseVoiceCommand(q);

      // ── DAILY BRIEFING ──────────────────────────────────────────────────
      if (
        cmd.type === "brief_day" ||
        stripped.includes("brief my day") ||
        stripped.includes("daily brief")
      ) {
        addLog("[SYSTEM] Generating daily protocol briefing...");
        setDailyBriefingOpen(true);
        return;
      }

      // ── TOMORROW PLAN ───────────────────────────────────────────────────
      if (
        cmd.type === "tomorrow_plan" ||
        stripped.includes("plan my tomorrow") ||
        stripped.includes("plan tomorrow")
      ) {
        addLog("[SYSTEM] Loading next-day protocol...");
        setTomorrowPlanOpen(true);
        return;
      }

      // ── SHOW TASKS ──────────────────────────────────────────────────────
      if (
        cmd.type === "show_tasks" ||
        stripped.includes("show my tasks") ||
        stripped.includes("show tasks") ||
        stripped.includes("mission queue") ||
        stripped.includes("show operations")
      ) {
        addLog("[SYSTEM] Opening mission queue analysis...");
        setTaskAnalysisOpen(true);
        return;
      }

      // ── PENDING / FILTER ────────────────────────────────────────────────
      if (
        cmd.type === "show_pending" ||
        stripped.includes("pending operations") ||
        stripped.includes("awaiting execution")
      ) {
        addLog("[SYSTEM] Filtering pending operations...");
        setCurrentModule("mission");
        setTaskAnalysisOpen(true);
        return;
      }

      // ── RECOMMEND ───────────────────────────────────────────────────────
      if (
        cmd.type === "recommend" ||
        stripped.includes("what should i do") ||
        stripped.includes("do first")
      ) {
        const currentTasks = useSuzieStore.getState().tasks;
        const rec = buildRecommendText(userMemory.name, currentTasks);
        addLog(`[SYSTEM] ${rec}`);
        await speakGreeting(rec);
        return;
      }

      // ── COMPLETE TASK BY VOICE ───────────────────────────────────────────
      if (cmd.type === "complete_task" && cmd.taskTitle) {
        const currentTasks = useSuzieStore.getState().tasks;
        const match = currentTasks.find((t) =>
          t.title.toLowerCase().includes(cmd.taskTitle!.toLowerCase())
        );
        if (match) {
          completeTaskItem(match.id);
          addLog(`[SYSTEM] Operation "${match.title}" marked as executed.`);
          await speakGreeting(
            `Operation complete. ${match.title} neutralised. Mission queue synced.`
          );
        } else {
          await speakGreeting(
            `No operation matching "${cmd.taskTitle}" in the queue. Verify designation.`
          );
        }
        return;
      }

      // ── ADD TASK ────────────────────────────────────────────────────────
      if (cmd.type === "add_task") {
        addLog("[SYSTEM] Opening add operation modal...");
        setAddTaskModalOpen(true);
        return;
      }

      // ── MISSION CONTROL overlay (must be before generic "mission") ────────
      if (stripped.includes("mission control") || lower.includes("mission control")) {
        setMissionControl(true);
        addLog("[SYSTEM] Mission Control overlay activated.");
        return;
      }

      // ── OPEN MISSION MODULE ──────────────────────────────────────────────
      if (
        stripped.includes("mission") ||
        stripped.includes("task list") ||
        stripped.includes("open tasks")
      ) {
        setCurrentModule("mission");
        addLog("[SYSTEM] Mission Queue module activated.");
        return;
      }

      // ── CLOSE ACTIVE OVERLAY ─────────────────────────────────────────────
      if (
        stripped === "close" ||
        stripped === "dismiss" ||
        stripped === "cancel" ||
        stripped.includes("close modal") ||
        stripped.includes("close window") ||
        stripped.includes("dismiss modal") ||
        stripped.includes("close popup")
      ) {
        if (taskAnalysisOpen) { setTaskAnalysisOpen(false); addLog("[SYSTEM] Task analysis dismissed."); return; }
        if (dailyBriefingOpen) { setDailyBriefingOpen(false); addLog("[SYSTEM] Briefing dismissed."); return; }
        if (tomorrowPlanOpen) { setTomorrowPlanOpen(false); addLog("[SYSTEM] Tomorrow plan dismissed."); return; }
        if (addTaskModalOpen) { setAddTaskModalOpen(false); addLog("[SYSTEM] Modal dismissed."); return; }
        addLog("[SYSTEM] No active overlay to close.");
        return;
      }

      // ── MODULE NAVIGATION (all dashboard modules) ────────────────────────
      if (stripped.includes("command center") || stripped === "command" || stripped.includes("open command")) {
        setCurrentModule("command");
        addLog("[SYSTEM] Command center activated.");
        return;
      }
      if (stripped.includes("briefing room") || stripped === "open briefing") {
        setCurrentModule("briefing-room");
        addLog("[SYSTEM] Briefing room activated.");
        return;
      }
      if (stripped.includes("scenario lab") || stripped.includes("open scenario")) {
        setCurrentModule("scenario-lab");
        addLog("[SYSTEM] Scenario lab activated.");
        return;
      }
      if (stripped.includes("dna analyzer") || stripped.includes("open dna") || stripped === "dna") {
        setCurrentModule("dna-analyzer");
        addLog("[SYSTEM] DNA analyzer activated.");
        return;
      }
      if (stripped.includes("reports center") || stripped.includes("strategic reports") || stripped.includes("open reports center")) {
        setCurrentModule("reports-center");
        addLog("[SYSTEM] Reports center activated.");
        return;
      }
      if (stripped.includes("memory center") || stripped === "memory" || stripped.includes("open memory")) {
        setCurrentModule("memory");
        addLog("[SYSTEM] Memory center activated.");
        return;
      }
      if (stripped.includes("foresight center") || stripped === "foresight" || stripped.includes("open foresight") || stripped.includes("forecast")) {
        setCurrentModule("foresight");
        loadForesight(q); // non-blocking
        addLog("[SYSTEM] Foresight center activated.");
        return;
      }

      // ── PAGE NAVIGATION (uses normalized nav text for speech variants) ───
      if (
        nav.includes("settings") ||
        nav.includes("preferences") ||
        /\bconfig\b/.test(nav) ||
        /open\s+settings/.test(nav) ||
        /go\s+to\s+settings/.test(nav)
      ) {
        addLog("[NAV] → /settings");
        speakGreeting("Opening settings.");
        router.push("/settings");
        return;
      }
      if (
        nav === "home" ||
        nav.includes("go home") ||
        nav.includes("home page") ||
        nav.includes("landing page") ||
        nav.includes("open home") ||
        nav.includes("main page")
      ) {
        addLog("[NAV] → / (landing)");
        router.push("/");
        return;
      }
      if (
        nav.includes("open ripple") ||
        nav.includes("start ripple") ||
        nav.includes("ripple simulator") ||
        nav.includes("simulator") ||
        nav.includes("ripple") ||
        nav.includes("what if")
      ) {
        addLog("[NAV] → /simulator (Ripple)");
        speakGreeting("Opening ripple simulator.");
        router.push("/simulator");
        return;
      }
      if (nav.includes("construction")) {
        addLog("[NAV] → /construction");
        router.push("/construction");
        return;
      }
      if (
        (nav.includes("open reports") || nav.includes("show reports") || nav.includes("reports page")) &&
        !nav.includes("reports center") &&
        !nav.includes("strategic reports")
      ) {
        addLog("[NAV] → /reports");
        router.push("/reports");
        return;
      }

      // ── EXISTING MODAL / ANALYSIS SHORTCUTS ────────────────────────────
      const requestedPopup =
        lower.includes("open analysis") ||
        lower.includes("analysis window") ||
        lower.includes("open popup") ||
        lower.includes("show popup") ||
        lower.includes("open modal") ||
        lower.includes("show analysis");

      if (requestedPopup) {
        openAnalysis();
        addLog("Analysis window opened on user request");
        return;
      }

      if (
        lower.includes("scan") ||
        lower.includes("analyze") ||
        lower.includes("what") ||
        lower.includes("show") ||
        lower.includes("risk")
      ) {
        await runAnalysisWorkflow(q, { openModal: false });
        await loadForesight(q);
        return;
      }

      if (lower.includes("memory")) {
        setCurrentModule("memory");
        return;
      }
      if (lower.includes("foresight") || lower.includes("forecast")) {
        setCurrentModule("foresight");
        await loadForesight(q);
        return;
      }
      if (lower.includes("brief me") || lower.includes("executive briefing")) {
        await loadExecutiveBrief("60s");
        return;
      }
      if (lower.includes("scenario")) {
        setCurrentModule("scenario-lab");
        await loadForesight(q);
        return;
      }
      if (lower.includes("dna")) {
        setCurrentModule("dna-analyzer");
        return;
      }

      // ── GENERIC VOICE API FALLBACK (3-second hard timeout) ───────────────
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

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
          signal: controller.signal,
        });
        const data = res.ok ? await res.json() : null;
        const answer = data?.response ?? `Command received: ${q}`;
        setResponse(answer);
        speakGreeting(answer); // non-blocking — don't await
        addLog(`SUZIE: ${answer.length > 80 ? answer.slice(0, 80) + "..." : answer}`);
        trackIntelligenceSession({
          id: `s-${Date.now()}`,
          at: new Date().toISOString(),
          query: q,
          module: "general",
        });
        setAICoreState("success");
      } catch (err) {
        const timedOut = err instanceof DOMException && err.name === "AbortError";
        const fallback = timedOut
          ? "Signal lost. Re-transmit directive."
          : "Directive unrecognised. Awaiting valid input.";
        setResponse(fallback);
        speakGreeting(fallback);
        addLog(timedOut ? "[VOICE] Timeout — signal lost" : "[VOICE] Directive unrecognised");
        setAICoreState("warning");
      } finally {
        clearTimeout(timeout);
        voiceBusyRef.current = false;
      }
    },
    [
      addCommand,
      addLog,
      addTaskModalOpen,
      completeTaskItem,
      dailyBriefingOpen,
      loadExecutiveBrief,
      loadForesight,
      openAnalysis,
      router,
      runAnalysisWorkflow,
      setAICoreState,
      setAddTaskModalOpen,
      setCurrentModule,
      setDailyBriefingOpen,
      setMissionControl,
      setTaskAnalysisOpen,
      setTomorrowPlanOpen,
      taskAnalysisOpen,
      tomorrowPlanOpen,
      trackIntelligenceSession,
      userMemory.name,
    ]
  );

  // Alt+S global keyboard shortcut → wake SUZIE voice gate (must be after handleCommand)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        voiceCommandRef.current?.wake();
        handleCommand("hey suzie");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleCommand]);

  // Task CRUD helpers surfaced to child components
  const handleTaskComplete = useCallback(
    (id: string) => {
      completeTaskItem(id);
      addLog(`[SYSTEM] Operation executed — mission queue updated`);
    },
    [completeTaskItem, addLog]
  );

  const handleTaskDelete = useCallback(
    (id: string) => {
      removeTaskItem(id);
      addLog(`[SYSTEM] Operation removed from mission queue`);
    },
    [removeTaskItem, addLog]
  );

  const handleTaskEdit = useCallback(
    (task: Task) => {
      setEditingTask(task);
      setAddTaskModalOpen(true);
    },
    [setEditingTask, setAddTaskModalOpen]
  );

  const handleTaskSave = useCallback(
    (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      if (editingTask) {
        updateTaskItem(editingTask.id, taskData);
        addLog(`[SYSTEM] Operation updated: ${taskData.title}`);
        setEditingTask(null);
      } else {
        addTaskItem(taskData);
        addLog(`[SYSTEM] Operation deployed: ${taskData.title}`);
        speakGreeting(
          `Directive logged. ${taskData.title} deployed to mission queue.`
        );
      }
    },
    [editingTask, addTaskItem, updateTaskItem, addLog, setEditingTask]
  );

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <p className="font-display text-sm text-cyan-400 tracking-[0.2em] animate-pulse">
          INITIALIZING COMMAND CENTER...
        </p>
      </div>
    );
  }

  const filtered   = filterEventsByCategory(events, activeFilter);
  const dna        = selectedEvent ? generateCrisisDNA(selectedEvent) : null;
  const prediction = generatePrediction(selectedEvent?.title ?? "stable");

  const moduleTabs: {
    id: ModuleView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "command", label: "Command", icon: BrainCircuit },
    { id: "mission", label: "Mission Queue", icon: Target },
    { id: "memory", label: "Memory Center", icon: BrainCircuit },
    { id: "foresight", label: "Foresight", icon: Radar },
    { id: "briefing-room", label: "Briefing Room", icon: ShieldAlert },
    { id: "scenario-lab", label: "Scenario Lab", icon: FlaskConical },
    { id: "dna-analyzer", label: "DNA Analyzer", icon: Dna },
    { id: "reports-center", label: "Reports", icon: Files },
  ];

  return (
    <>
      {/* ── Global overlays ─────────────────────────────────────────── */}
      <AnalysisModal />
      <MissionControl />

      <AddTaskModal
        open={addTaskModalOpen}
        onClose={() => {
          setAddTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleTaskSave}
        editTask={editingTask}
      />

      <DailyBriefing
        open={dailyBriefingOpen}
        onClose={() => setDailyBriefingOpen(false)}
        tasks={tasks}
        userName={userMemory.name}
        onSpeak={speakGreeting}
      />

      <TomorrowPlan
        open={tomorrowPlanOpen}
        onClose={() => setTomorrowPlanOpen(false)}
        tasks={tasks}
        userName={userMemory.name}
        onSpeak={speakGreeting}
      />

      <TaskAnalysisPopup
        open={taskAnalysisOpen}
        onClose={() => setTaskAnalysisOpen(false)}
        tasks={tasks}
        onComplete={handleTaskComplete}
        onDelete={handleTaskDelete}
        onEdit={handleTaskEdit}
        userName={userMemory.name}
      />

      {/* ── Dashboard layout ─────────────────────────────────────────── */}
      <div className="min-h-screen pt-24 pb-4 px-4 grid-bg">
        {/* Module tab bar */}
        <div className="max-w-[1900px] mx-auto mb-3 flex flex-wrap gap-2">
          {moduleTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentModule(id)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-display tracking-wider uppercase flex items-center gap-1.5 transition-all ${
                currentModule === id
                  ? "border-cyan-400/55 text-cyan-300 bg-cyan-400/10"
                  : "border-gray-800 text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === "mission" && tasks.filter((t) => t.status !== "completed").length > 0 && (
                <span className="ml-0.5 font-terminal text-[8px] text-cyan-400 bg-cyan-400/15 px-1 rounded">
                  {tasks.filter((t) => t.status !== "completed").length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="max-w-[1900px] mx-auto h-[calc(100vh-7rem)] grid grid-cols-12 grid-rows-[1fr_260px] gap-3">

          {/* ── LEFT — Live Alerts + Filters ─────────────────────────── */}
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
              <p className="font-display text-[10px] text-gray-500 uppercase tracking-wider">
                Breaking News
              </p>
              {mockNewsHeadlines.slice(0, 4).map((n) => (
                <p
                  key={n.headline}
                  className="font-terminal text-[10px] text-gray-500 truncate"
                >
                  <span className="text-gray-700">{n.time}</span> {n.headline}
                </p>
              ))}
            </div>
          </motion.div>

          {/* ── CENTER — HoloCore (primary) + Globe (ghost background) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-6 row-span-1 relative glass-panel overflow-hidden"
            style={{
              background:
                "radial-gradient(ellipse at 50% 40%, rgba(0,240,255,0.04) 0%, rgba(3,7,18,0.92) 70%)",
            }}
          >
            {/* Primary visualization: holographic neural core */}
            <HoloCore
              wakeState={wakeState}
              aiCoreState={aiCoreState}
              className="absolute inset-0 z-10"
            />

            {/* Risk scores pinned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
              <div className="glass-panel mx-3 mb-3 p-3">
                <RiskPanel scores={riskScores} compact />
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT — Context panel ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-3 row-span-1 glass-panel hover-glow p-4 flex flex-col gap-4 overflow-y-auto scroll-cyber"
          >
            {currentModule === "command" && (
              <>
                <BriefingPanel
                  briefing={briefing}
                  selectedEvent={selectedEvent}
                />
                {dna && <CrisisDNA dna={dna} />}
                <PredictionTimeline prediction={prediction} />
                {response && (
                  <div className="glass-panel p-3 border border-cyan-400/20">
                    <p className="font-display text-[10px] text-cyan-400 tracking-wider uppercase mb-1">
                      SUZIE Response
                    </p>
                    <p className="text-[12px] text-gray-300">{response}</p>
                  </div>
                )}
              </>
            )}

            {currentModule === "mission" && (
              <MissionQueue
                tasks={tasks}
                onComplete={handleTaskComplete}
                onDelete={handleTaskDelete}
                onEdit={handleTaskEdit}
                onAddTask={() => {
                  setEditingTask(null);
                  setAddTaskModalOpen(true);
                }}
                onVoiceAdd={() => setAddTaskModalOpen(true)}
                onOpenFull={() => setTaskAnalysisOpen(true)}
              />
            )}

            {currentModule === "briefing-room" && (
              <ExecutiveBriefingRoom
                briefing={executiveBriefing}
                onMode={loadExecutiveBrief}
              />
            )}
            {currentModule === "memory" && (
              <div className="text-sm text-gray-400">
                Intelligence Memory Center active in workspace panel below.
              </div>
            )}
            {currentModule === "foresight" && (
              <div className="text-sm text-gray-400">
                Global Foresight Center active in workspace panel below.
              </div>
            )}
            {currentModule === "scenario-lab" && (
              <div className="text-sm text-gray-400">
                Scenario Simulation Lab active in workspace panel below.
              </div>
            )}
            {currentModule === "dna-analyzer" && (
              <div className="text-sm text-gray-400">
                Crisis DNA Analyzer active in workspace panel below.
              </div>
            )}
            {currentModule === "reports-center" && (
              <div className="text-sm text-gray-400">
                Strategic Reports Center active in workspace panel below.
              </div>
            )}
          </motion.div>

          {/* ── BOTTOM LEFT — Workspace panel ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-8 row-span-1"
          >
            {(currentModule === "command" || currentModule === "mission") && (
              <IntelTerminal
                logs={logs}
                commandHistory={commandHistory}
                onCommand={handleCommand}
              />
            )}
            {currentModule === "memory" && (
              <IntelligenceMemoryCenter
                memory={intelligenceMemory}
                returningBriefing={returningBriefing}
              />
            )}
            {(currentModule === "foresight" ||
              currentModule === "scenario-lab") && (
              <GlobalForesightCenter
                signals={foresightSignals}
                scenarios={scenarios}
              />
            )}
            {currentModule === "dna-analyzer" && (
              <CrisisDNAAnalyzerCenter events={events} />
            )}
            {currentModule === "reports-center" && (
              <StrategicReportsCenter reports={reports} />
            )}
            {currentModule === "briefing-room" && (
              <ExecutiveBriefingRoom
                briefing={executiveBriefing}
                onMode={loadExecutiveBrief}
              />
            )}
          </motion.div>

          {/* ── BOTTOM RIGHT — Voice + Wake state + Action buttons ───── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-4 row-span-1 glass-panel hover-glow p-4 flex flex-col gap-3"
          >
            {/* Gate status badge */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-[10px] text-cyan-400 tracking-[0.15em] uppercase">
                  Voice Command
                </p>
                <p className="font-terminal text-[9px] text-gray-600 mt-0.5">
                  Alt+S to activate
                </p>
              </div>
              <span
                className={`font-terminal text-[8px] px-2 py-0.5 rounded border tracking-widest ${
                  voiceGateLocked
                    ? "border-red-500/40 text-red-400 bg-red-400/08"
                    : "border-green-400/40 text-green-400 bg-green-400/08"
                }`}
              >
                {voiceGateLocked ? "🔒 LOCKED" : "🔓 ACTIVE"}
              </span>
            </div>

            <VoiceCommand
              ref={voiceCommandRef}
              autoStart
              requireWake
              awakeTimeoutMs={15 * 60 * 1000}
              onCommand={handleCommand}
              onGateChange={(awake) => setVoiceGateLocked(!awake)}
            />

            {/* Clap to wake — hidden UI, runs audio detection only */}
            <div className="sr-only" aria-hidden>
              <ClapDetector
                enabled
                onClap={() => {
                  voiceCommandRef.current?.wake();
                  handleCommand("hey suzie");
                }}
              />
            </div>

            {/* Wake state indicator */}
            <WakeWordListener
              wakeState={wakeState}
              wakeLogs={wakeLogs}
              gateLocked={voiceGateLocked}
            />

            {/* Quick action buttons */}
            <div className="mt-auto flex flex-wrap gap-2">
              <motion.button
                onClick={() => setDailyBriefingOpen(true)}
                whileHover={{ scale: 1.03, boxShadow: "0 0 14px rgba(0,240,255,0.18)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-400/30 text-[10px] font-display tracking-wider text-cyan-400 hover:bg-cyan-400/10 transition-all"
              >
                Daily Brief
              </motion.button>
              <motion.button
                onClick={() => setTomorrowPlanOpen(true)}
                whileHover={{ scale: 1.03, boxShadow: "0 0 14px rgba(0,240,255,0.18)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-400/30 text-[10px] font-display tracking-wider text-cyan-400 hover:bg-cyan-400/10 transition-all"
              >
                Tomorrow Plan
              </motion.button>
              <motion.button
                onClick={() => router.push("/reports")}
                whileHover={{ scale: 1.03, boxShadow: "0 0 14px rgba(0,240,255,0.18)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-400/30 text-[10px] font-display tracking-wider text-cyan-400 hover:bg-cyan-400/10 transition-all"
              >
                <FileText className="w-3.5 h-3.5" /> Report
              </motion.button>
              <motion.button
                onClick={() => openAnalysis()}
                whileHover={{ scale: 1.03, boxShadow: "0 0 14px rgba(0,240,255,0.18)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-400/30 text-[10px] font-display tracking-wider text-cyan-400 hover:bg-cyan-400/10 transition-all"
              >
                <BrainCircuit className="w-3.5 h-3.5" /> Analysis
              </motion.button>
              <motion.button
                onClick={() => setMissionControl(true)}
                whileHover={{ scale: 1.03, boxShadow: "0 0 14px rgba(0,240,255,0.18)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-400/30 text-[10px] font-display tracking-wider text-cyan-400 hover:bg-cyan-400/10 transition-all"
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
