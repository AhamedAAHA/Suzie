export type RiskLevel = "critical" | "high" | "medium" | "low" | "monitoring";

export type CrisisType =
  | "war"
  | "climate_disaster"
  | "cyber_attack"
  | "economic_crisis"
  | "shipping_disruption"
  | "disease_outbreak"
  | "food_shortage"
  | "fuel_crisis";

export type RiskCategory =
  | "supply_chain"
  | "conflict"
  | "climate"
  | "cyber"
  | "construction"
  | "food"
  | "fuel";

export interface GlobalEvent {
  id: string;
  title: string;
  description: string;
  type: CrisisType;
  riskLevel: RiskLevel;
  lat: number;
  lng: number;
  country: string;
  region: string;
  timestamp: string;
  source: string;
  categories: RiskCategory[];
  rippleEffects: string[];
}

export interface RiskScores {
  overall: number;
  supplyChain: number;
  conflict: number;
  climate: number;
  cyber: number;
  construction: number;
  food: number;
  fuel: number;
}

export interface CrisisDNA {
  id: string;
  eventId: string;
  origin: string;
  affectedSectors: string[];
  affectedCountries: string[];
  spreadSpeed: "slow" | "moderate" | "fast" | "critical";
  riskScore: number;
  confidence: number;
}

export interface RippleNode {
  id: string;
  label: string;
  impact: number;
  category: string;
  children?: RippleNode[];
}

export interface PredictionTimeline {
  hours24: string;
  days7: string;
  days30: string;
  months6: string;
}

export interface ConstructionMaterial {
  name: string;
  unit: string;
  basePrice: number;
  currentPrice: number;
  riskLevel: RiskLevel;
  changePercent: number;
  delayDays: number;
  globalFactors: string[];
}

export interface IntelligenceReport {
  id: string;
  title: string;
  generatedAt: string;
  eventSummary: string;
  affectedCountries: string[];
  riskScore: number;
  rippleChain: string[];
  prediction: PredictionTimeline;
  recommendations: string[];
  briefing: string;
}

export interface AnalysisSource {
  label: string;
  detail: string;
}

export interface IntelAnalysis {
  query: string;
  title: string;
  focusCountry: string;
  generatedAt: string;
  summary: string;
  impact: string[];
  riskScore: number;
  riskLabel: string;
  riskScores: RiskScores;
  dna: CrisisDNA | null;
  prediction: PredictionTimeline;
  recommendations: string[];
  sources: AnalysisSource[];
  relatedEvents: {
    id: string;
    title: string;
    country: string;
    riskLevel: RiskLevel;
  }[];
  construction: {
    overallRisk: number;
    materials: {
      name: string;
      unit: string;
      currentPrice: number;
      changePercent: number;
      riskLevel: RiskLevel;
      delayDays: number;
    }[];
    boq: {
      projectName: string;
      overrunPercent: number;
      delayProbability: number;
      projectedOverrun: number;
    };
  };
}

export interface ShippingRoute {
  id: string;
  from: { lat: number; lng: number; name: string };
  to: { lat: number; lng: number; name: string };
  status: "active" | "delayed" | "blocked";
  delayHours: number;
}

export interface UserMemory {
  name: string;
  country: string;
  profession?: string;
  interests: string[];
  frequentlyMonitoredTopics?: string[];
  briefingStyle: "short" | "detailed";
  lastSession: string;
}

export interface SessionRecord {
  id: string;
  at: string;
  query: string;
  module: "memory" | "foresight" | "briefing" | "scenario" | "dna" | "reports" | "general";
  focusCountry?: string;
  focusRisk?: string;
  generatedReport?: boolean;
}

export interface BehavioralMemory {
  topicsViewed: Record<string, number>;
  countriesMonitored: Record<string, number>;
  risksChecked: Record<string, number>;
  reportsGenerated: number;
  sessionsByDay: Record<string, number>;
  sessionsByHour: Record<string, number>;
  lastSeenAt?: string;
}

export interface IntelligenceMemory {
  profile: UserMemory;
  behavior: BehavioralMemory;
  timeline: SessionRecord[];
}

export interface ForesightSignal {
  name: string;
  probability: number;
  confidence: number;
  direction: "up" | "down" | "stable";
  explanation: string;
  timeline: {
    hours24: number;
    days7: number;
    days30: number;
    days90: number;
    months6: number;
  };
}

export interface ScenarioVariant {
  id: string;
  title: string;
  riskLevel: RiskLevel;
  summary: string;
  impacts: string[];
}

export interface ExecutiveBriefing {
  mode: "30s" | "60s" | "full";
  headline: string;
  bullets: string[];
  worldRiskScore: number;
  constructionImpactLevel: "Low" | "Moderate" | "High" | "Critical";
  recommendedAction: string;
  spokenText: string;
}

export interface SuzieState {
  isOnline: boolean;
  isBooting: boolean;
  isListening: boolean;
  silentWatch: boolean;
  missionControl: boolean;
  currentView: string;
  riskScores: RiskScores;
  events: GlobalEvent[];
  selectedEvent: GlobalEvent | null;
  briefing: string;
  logs: string[];
  userMemory: UserMemory;
}
