import { env } from "@/lib/env";
import { BehavioralMemory, IntelligenceMemory, SessionRecord, UserMemory } from "@/types";

const STORAGE_KEY = "suzie-intel-memory-v1";

const defaultProfile: UserMemory = {
  name: env.user.name,
  country: env.user.country,
  profession: "Quantity Surveyor",
  interests: ["Construction", "Quantity Surveying", "Supply Chain", "Global Risks", "Fuel Prices"],
  frequentlyMonitoredTopics: ["construction", "supply chain", "fuel", "sri lanka"],
  briefingStyle: "short",
  lastSession: new Date().toISOString(),
};

const emptyBehavior: BehavioralMemory = {
  topicsViewed: {},
  countriesMonitored: {},
  risksChecked: {},
  reportsGenerated: 0,
  sessionsByDay: {},
  sessionsByHour: {},
  lastSeenAt: undefined,
};

function safeParse(raw: string | null): IntelligenceMemory | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IntelligenceMemory;
  } catch {
    return null;
  }
}

export function loadIntelligenceMemory(): IntelligenceMemory {
  if (typeof window === "undefined") {
    return { profile: defaultProfile, behavior: emptyBehavior, timeline: [] };
  }
  const stored = safeParse(localStorage.getItem(STORAGE_KEY));
  if (!stored) return { profile: defaultProfile, behavior: emptyBehavior, timeline: [] };
  return {
    profile: { ...defaultProfile, ...stored.profile },
    behavior: { ...emptyBehavior, ...stored.behavior },
    timeline: Array.isArray(stored.timeline) ? stored.timeline.slice(-120) : [],
  };
}

export function saveIntelligenceMemory(memory: IntelligenceMemory) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

function bump(map: Record<string, number>, key: string | undefined, by = 1) {
  if (!key) return;
  const k = key.toLowerCase().trim();
  if (!k) return;
  map[k] = (map[k] ?? 0) + by;
}

export function trackSession(memory: IntelligenceMemory, record: SessionRecord): IntelligenceMemory {
  const at = new Date(record.at);
  const dayKey = at.toISOString().slice(0, 10);
  const hourKey = String(at.getHours()).padStart(2, "0");

  const next: IntelligenceMemory = {
    ...memory,
    profile: {
      ...memory.profile,
      lastSession: record.at,
    },
    behavior: {
      ...memory.behavior,
      topicsViewed: { ...memory.behavior.topicsViewed },
      countriesMonitored: { ...memory.behavior.countriesMonitored },
      risksChecked: { ...memory.behavior.risksChecked },
      sessionsByDay: { ...memory.behavior.sessionsByDay },
      sessionsByHour: { ...memory.behavior.sessionsByHour },
      reportsGenerated: memory.behavior.reportsGenerated + (record.generatedReport ? 1 : 0),
      lastSeenAt: record.at,
    },
    timeline: [...memory.timeline.slice(-119), record],
  };

  bump(next.behavior.topicsViewed, record.module);
  bump(next.behavior.countriesMonitored, record.focusCountry);
  bump(next.behavior.risksChecked, record.focusRisk);
  bump(next.behavior.sessionsByDay, dayKey);
  bump(next.behavior.sessionsByHour, hourKey);

  const topTopics = Object.entries(next.behavior.topicsViewed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([topic]) => topic);
  next.profile.frequentlyMonitoredTopics = topTopics;

  return next;
}

export function buildReturningBrief(memory: IntelligenceMemory): string {
  const timeline = memory.timeline;
  const last = timeline[timeline.length - 1];
  const topics = memory.profile.frequentlyMonitoredTopics?.slice(0, 3) ?? [];
  const topicText = topics.length ? topics.join(", ") : "global risk topics";
  const lastFocus = last?.focusCountry ? ` on ${last.focusCountry}` : "";
  const lastQuery = last?.query ? `During your last session you focused${lastFocus}: "${last.query}".` : "I have reviewed your prior intelligence activity.";
  return `Welcome back ${memory.profile.name}. ${lastQuery} Since then, I have updated your monitored domains (${topicText}) and prepared a strategic briefing.`;
}
