import { create } from "zustand";
import { mockGlobalEvents, mockRiskScores } from "@/data/mockGlobalEvents";
import {
  ExecutiveBriefing,
  ForesightSignal,
  GlobalEvent,
  IntelligenceMemory,
  IntelAnalysis,
  IntelligenceReport,
  RiskScores,
  ScenarioVariant,
  SessionRecord,
  UserMemory,
} from "@/types";
import { Task } from "@/types/task";
import {
  buildReturningBrief,
  loadIntelligenceMemory,
  saveIntelligenceMemory,
  trackSession,
} from "@/services/memoryEngine";
import {
  getTasks as loadStoredTasks,
  addTask as persistAddTask,
  updateTask as persistUpdateTask,
  deleteTask as persistDeleteTask,
  completeTask as persistCompleteTask,
} from "@/services/taskService";

export type AnalysisStage = "idle" | "detected" | "scanning" | "analyzing" | "ready";
export type AICoreState = "idle" | "listening" | "thinking" | "analyzing" | "warning" | "success";
export type WakeState = "idle" | "listening" | "online" | "thinking" | "speaking";
export type ModuleView =
  | "command"
  | "memory"
  | "foresight"
  | "briefing-room"
  | "scenario-lab"
  | "dna-analyzer"
  | "reports-center"
  | "mission";

interface SuzieStore {
  isOnline: boolean;
  isBooting: boolean;
  isListening: boolean;
  silentWatch: boolean;
  missionControl: boolean;
  events: GlobalEvent[];
  riskScores: RiskScores;
  selectedEvent: GlobalEvent | null;
  briefing: string;
  logs: string[];
  reports: IntelligenceReport[];
  userMemory: UserMemory;
  activeFilter: string;
  commandHistory: string[];
  currentModule: ModuleView;
  aiCoreState: AICoreState;
  wakeState: WakeState;

  analysis: IntelAnalysis | null;
  analysisOpen: boolean;
  analysisStage: AnalysisStage;
  foresightSignals: ForesightSignal[];
  scenarios: ScenarioVariant[];
  executiveBriefing: ExecutiveBriefing | null;
  intelligenceMemory: IntelligenceMemory;
  returningBriefing: string;

  // Task / Mission Queue state
  tasks: Task[];
  taskAnalysisOpen: boolean;
  dailyBriefingOpen: boolean;
  tomorrowPlanOpen: boolean;
  addTaskModalOpen: boolean;
  editingTask: Task | null;

  setOnline: (v: boolean) => void;
  setBooting: (v: boolean) => void;
  setListening: (v: boolean) => void;
  setSilentWatch: (v: boolean) => void;
  setMissionControl: (v: boolean) => void;
  setEvents: (events: GlobalEvent[]) => void;
  setRiskScores: (scores: RiskScores) => void;
  selectEvent: (event: GlobalEvent | null) => void;
  setBriefing: (text: string) => void;
  addLog: (msg: string) => void;
  addReport: (report: IntelligenceReport) => void;
  setActiveFilter: (filter: string) => void;
  updateMemory: (partial: Partial<UserMemory>) => void;
  addCommand: (cmd: string) => void;
  setAnalysisStage: (stage: AnalysisStage) => void;
  setAnalysis: (analysis: IntelAnalysis | null) => void;
  openAnalysis: () => void;
  closeAnalysis: () => void;
  setCurrentModule: (module: ModuleView) => void;
  setAICoreState: (state: AICoreState) => void;
  setWakeState: (state: WakeState) => void;
  setForesight: (signals: ForesightSignal[], scenarios: ScenarioVariant[]) => void;
  setExecutiveBriefing: (briefing: ExecutiveBriefing | null) => void;
  hydrateMemory: () => void;
  trackIntelligenceSession: (record: SessionRecord) => void;
  wakeUp: () => void;

  // Task actions
  hydrateTasks: () => void;
  addTaskItem: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task;
  updateTaskItem: (id: string, updates: Partial<Task>) => void;
  removeTaskItem: (id: string) => void;
  completeTaskItem: (id: string) => void;
  setTaskAnalysisOpen: (v: boolean) => void;
  setDailyBriefingOpen: (v: boolean) => void;
  setTomorrowPlanOpen: (v: boolean) => void;
  setAddTaskModalOpen: (v: boolean) => void;
  setEditingTask: (task: Task | null) => void;
}

const defaultMemory: UserMemory = {
  name: process.env.NEXT_PUBLIC_USER_NAME ?? "Hubaib",
  country: process.env.NEXT_PUBLIC_USER_COUNTRY ?? "Sri Lanka",
  interests: ["construction", "QS", "Sri Lanka impact"],
  briefingStyle: "short",
  lastSession: new Date().toISOString(),
};

function persistOnline(value: boolean) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("suzie-online", String(value));
}

export function hydrateOnlineState() {
  if (typeof window === "undefined") return;
  const online = sessionStorage.getItem("suzie-online") === "true";
  useSuzieStore.setState({ isOnline: online });
}

export const useSuzieStore = create<SuzieStore>((set, get) => ({
  isOnline: false,
  isBooting: false,
  isListening: false,
  silentWatch: false,
  missionControl: false,
  events: mockGlobalEvents,
  riskScores: mockRiskScores,
  selectedEvent: mockGlobalEvents[0],
  briefing: "",
  logs: ["[SYS] SUZIE AI v1.0 — Global Intelligence Command Center"],
  reports: [],
  userMemory: defaultMemory,
  activeFilter: "all",
  commandHistory: [],
  currentModule: "command",
  aiCoreState: "idle",
  wakeState: "idle",

  analysis: null,
  analysisOpen: false,
  analysisStage: "idle",
  foresightSignals: [],
  scenarios: [],
  executiveBriefing: null,
  intelligenceMemory: {
    profile: defaultMemory,
    behavior: {
      topicsViewed: {},
      countriesMonitored: {},
      risksChecked: {},
      reportsGenerated: 0,
      sessionsByDay: {},
      sessionsByHour: {},
    },
    timeline: [],
  },
  returningBriefing: "",

  // Task state
  tasks: [],
  taskAnalysisOpen: false,
  dailyBriefingOpen: false,
  tomorrowPlanOpen: false,
  addTaskModalOpen: false,
  editingTask: null,

  setOnline: (v) => {
    persistOnline(v);
    set({ isOnline: v });
  },
  setBooting: (v) => set({ isBooting: v }),
  setListening: (v) => set({ isListening: v }),
  setSilentWatch: (v) => set({ silentWatch: v }),
  setMissionControl: (v) => set({ missionControl: v }),
  setEvents: (events) => set({ events }),
  setRiskScores: (scores) => set({ riskScores: scores }),
  selectEvent: (event) => set({ selectedEvent: event }),
  setBriefing: (text) => set({ briefing: text }),
  addLog: (msg) =>
    set((s) => ({
      logs: [
        ...s.logs.slice(-99),
        `[${new Date().toLocaleTimeString()}] ${msg}`,
      ],
    })),
  addReport: (report) => set((s) => ({ reports: [report, ...s.reports] })),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  updateMemory: (partial) =>
    set((s) => ({ userMemory: { ...s.userMemory, ...partial } })),
  addCommand: (cmd) =>
    set((s) => ({ commandHistory: [...s.commandHistory.slice(-30), cmd] })),
  setAnalysisStage: (stage) => set({ analysisStage: stage }),
  setAnalysis: (analysis) => set({ analysis }),
  openAnalysis: () => set({ analysisOpen: true }),
  closeAnalysis: () => set({ analysisOpen: false, analysisStage: "idle" }),
  setCurrentModule: (module) => set({ currentModule: module }),
  setAICoreState: (state) => set({ aiCoreState: state }),
  setWakeState: (state) => set({ wakeState: state }),
  setForesight: (signals, scenarios) => set({ foresightSignals: signals, scenarios }),
  setExecutiveBriefing: (briefing) => set({ executiveBriefing: briefing }),
  hydrateMemory: () => {
    const mem = loadIntelligenceMemory();
    set({
      intelligenceMemory: mem,
      userMemory: mem.profile,
      returningBriefing: buildReturningBrief(mem),
    });
  },
  trackIntelligenceSession: (record) => {
    const { intelligenceMemory } = get();
    const next = trackSession(intelligenceMemory, record);
    saveIntelligenceMemory(next);
    set({
      intelligenceMemory: next,
      userMemory: next.profile,
      returningBriefing: buildReturningBrief(next),
    });
  },
  wakeUp: () => {
    const { addLog } = get();
    set({ isBooting: true, isListening: false });
    addLog("Wake signal detected — initializing SUZIE...");
    setTimeout(() => {
      persistOnline(true);
      set({ isBooting: false, isOnline: true, wakeState: "online" });
      addLog("SUZIE ONLINE — All systems nominal");
    }, 2500);
  },

  // Task actions
  hydrateTasks: () => {
    const tasks = loadStoredTasks();
    set({ tasks });
  },
  addTaskItem: (task) => {
    const newTask = persistAddTask(task);
    set((s) => ({ tasks: [...s.tasks, newTask] }));
    return newTask;
  },
  updateTaskItem: (id, updates) => {
    persistUpdateTask(id, updates);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? { ...t, ...updates, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
  },
  removeTaskItem: (id) => {
    persistDeleteTask(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },
  completeTaskItem: (id) => {
    persistCompleteTask(id);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? { ...t, status: "completed" as const, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
  },
  setTaskAnalysisOpen: (v) => set({ taskAnalysisOpen: v }),
  setDailyBriefingOpen: (v) => set({ dailyBriefingOpen: v }),
  setTomorrowPlanOpen: (v) => set({ tomorrowPlanOpen: v }),
  setAddTaskModalOpen: (v) => set({ addTaskModalOpen: v }),
  setEditingTask: (task) => set({ editingTask: task }),
}));
