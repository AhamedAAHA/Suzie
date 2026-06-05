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
  interests: string[];
  briefingStyle: "short" | "detailed";
  lastSession: string;
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
