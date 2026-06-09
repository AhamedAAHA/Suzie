import { env } from "@/lib/env";
import { ExecutiveBriefing, GlobalEvent, RiskScores } from "@/types";

function constructionLevel(score: number): ExecutiveBriefing["constructionImpactLevel"] {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 40) return "Moderate";
  return "Low";
}

function joinPriority(events: GlobalEvent[]): string[] {
  return events
    .filter((e) => e.riskLevel === "critical" || e.riskLevel === "high")
    .slice(0, 4)
    .map((e, i) => `${["First", "Second", "Third", "Fourth"][i] ?? `Item ${i + 1}`}. ${e.title} in ${e.country}.`);
}

export function buildExecutiveBriefing(
  events: GlobalEvent[],
  scores: RiskScores,
  mode: ExecutiveBriefing["mode"] = "60s"
): ExecutiveBriefing {
  const priorities = joinPriority(events);
  const level = constructionLevel(scores.construction);
  const headline =
    mode === "30s"
      ? `Good day ${env.user.name}. Global monitoring complete.`
      : `Welcome back ${env.user.name}. Global monitoring completed.`;

  const bullets = priorities.length
    ? priorities
    : ["No critical incidents currently dominate global risk, but monitoring remains active."];

  const recommendedAction =
    scores.supplyChain >= 60 || scores.construction >= 60
      ? "Monitor material procurement windows and logistics exposure daily."
      : "Maintain routine monitoring cadence and keep contingency plans current.";

  const spokenParts = [
    headline,
    `I identified ${Math.min(4, bullets.length)} high-priority developments.`,
    ...bullets,
    `Overall world risk score: ${scores.overall}.`,
    `Construction impact level: ${level}.`,
    `Recommended action: ${recommendedAction}`,
  ];

  const spokenText =
    mode === "30s"
      ? spokenParts.slice(0, 4).join(" ")
      : mode === "60s"
      ? spokenParts.slice(0, 6).join(" ")
      : spokenParts.join(" ");

  return {
    mode,
    headline,
    bullets,
    worldRiskScore: scores.overall,
    constructionImpactLevel: level,
    recommendedAction,
    spokenText,
  };
}
