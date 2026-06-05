import { create } from "zustand";
import { mockGlobalEvents, mockRiskScores } from "@/data/mockGlobalEvents";
import { GlobalEvent, IntelligenceReport, RiskScores, UserMemory } from "@/types";

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
  wakeUp: () => void;
}

const defaultMemory: UserMemory = {
  name: process.env.NEXT_PUBLIC_USER_NAME ?? "Hubaib",
  country: process.env.NEXT_PUBLIC_USER_COUNTRY ?? "Sri Lanka",
  interests: ["construction", "QS", "Sri Lanka impact"],
  briefingStyle: "short",
  lastSession: new Date().toISOString(),
};

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

  setOnline: (v) => set({ isOnline: v }),
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
        ...s.logs.slice(-50),
        `[${new Date().toLocaleTimeString()}] ${msg}`,
      ],
    })),
  addReport: (report) => set((s) => ({ reports: [report, ...s.reports] })),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  updateMemory: (partial) =>
    set((s) => ({ userMemory: { ...s.userMemory, ...partial } })),
  wakeUp: () => {
    const { addLog } = get();
    set({ isBooting: true, isListening: false });
    addLog("Wake signal detected — initializing SUZIE...");
    setTimeout(() => {
      set({ isBooting: false, isOnline: true });
      addLog("SUZIE ONLINE — All systems nominal");
    }, 2500);
  },
}));
