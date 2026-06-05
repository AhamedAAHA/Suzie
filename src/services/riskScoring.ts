import { GlobalEvent, RiskCategory, RiskLevel, RiskScores } from "@/types";

const RISK_WEIGHTS: Record<RiskLevel, number> = {
  critical: 25,
  high: 18,
  medium: 10,
  low: 5,
  monitoring: 2,
};

export function calculateRiskScores(events: GlobalEvent[]): RiskScores {
  const categories: RiskCategory[] = [
    "supply_chain", "conflict", "climate", "cyber", "construction", "food", "fuel",
  ];

  const scores: Partial<RiskScores> = {};

  for (const cat of categories) {
    const relevant = events.filter((e) => e.categories.includes(cat));
    const score = Math.min(
      100,
      relevant.reduce((sum, e) => sum + RISK_WEIGHTS[e.riskLevel], 0)
    );
    const key = cat === "supply_chain" ? "supplyChain" : cat;
    (scores as Record<string, number>)[key] = Math.max(score, 20 + Math.random() * 15);
  }

  const overall = Math.min(
    100,
    Math.round(
      Object.values(scores).reduce((a, b) => (a as number) + (b as number), 0 as number) /
        categories.length
    )
  );

  return {
    overall,
    supplyChain: Math.round(scores.supplyChain ?? 50),
    conflict: Math.round(scores.conflict ?? 50),
    climate: Math.round(scores.climate ?? 50),
    cyber: Math.round(scores.cyber ?? 50),
    construction: Math.round(scores.construction ?? 50),
    food: Math.round(scores.food ?? 50),
    fuel: Math.round(scores.fuel ?? 50),
  };
}

export function getRiskColor(score: number): string {
  if (score >= 80) return "#ff2d55";
  if (score >= 60) return "#ff9500";
  if (score >= 40) return "#ffd60a";
  return "#00f0ff";
}

export function getRiskLabel(score: number): string {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MODERATE";
  return "LOW";
}
