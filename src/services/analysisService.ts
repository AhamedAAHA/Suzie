import { GlobalEvent, IntelAnalysis, RiskScores } from "@/types";
import { answerVoiceQuery, generatePrediction } from "./aimlService";
import { generateCrisisDNA } from "./crisisDetector";
import { scanConstructionImpact } from "./constructionImpactScanner";
import { getRiskLabel } from "./riskScoring";
import { env } from "@/lib/env";

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (l) => l.toUpperCase());
}

function pickFocusEvent(query: string, events: GlobalEvent[]): GlobalEvent | null {
  if (events.length === 0) return null;
  const q = query.toLowerCase();

  const scored = events
    .map((e) => {
      let score = 0;
      const hay = `${e.country} ${e.region} ${e.title} ${e.type} ${e.categories.join(" ")}`.toLowerCase();
      for (const word of q.split(/\s+/).filter((w) => w.length > 3)) {
        if (hay.includes(word)) score += 2;
      }
      if (q.includes(e.country.toLowerCase())) score += 5;
      if (e.riskLevel === "critical") score += 2;
      if (e.riskLevel === "high") score += 1;
      return { e, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.e ?? events[0];
}

function detectFocusCountry(query: string, focus: GlobalEvent | null): string {
  const q = query.toLowerCase();
  const known = [
    "sri lanka", "india", "china", "pakistan", "bangladesh", "ukraine", "russia",
    "united states", "usa", "yemen", "iran", "israel", "panama", "netherlands",
    "singapore", "lebanon", "saudi", "red sea", "strait of hormuz",
  ];
  const hit = known.find((c) => q.includes(c));
  if (hit) return titleCase(hit);
  return focus?.country ?? "Global";
}

function buildImpactPoints(focus: GlobalEvent | null, scores: RiskScores): string[] {
  if (!focus) {
    return [
      "Global supply chains remain under moderate stress.",
      "No single critical event is currently dominating risk levels.",
      "Construction material costs are stable with localized volatility.",
    ];
  }
  const points = [
    `${focus.title} originates in ${focus.country} and is classified ${focus.riskLevel.toUpperCase()}.`,
    ...focus.rippleEffects.slice(0, 4),
  ];
  if (scores.supplyChain >= 60) points.push("Supply chain risk is elevated — expect freight and lead-time pressure.");
  if (scores.fuel >= 60) points.push("Fuel risk is elevated — transport and machinery operating costs rising.");
  return points;
}

function buildRecommendations(focus: GlobalEvent | null, scores: RiskScores): string[] {
  const recs: string[] = [];
  if (scores.fuel >= 55) recs.push("Lock in diesel and fuel surcharges where possible to protect transport budgets.");
  if (scores.supplyChain >= 55) recs.push("Diversify shipping routes and pre-position critical-path materials.");
  if (scores.construction >= 50) recs.push("Review BOQ contingency allowances for steel and cement (target 5-7%).");
  if (focus?.country) recs.push(`Increase monitoring cadence for ${focus.country}-linked suppliers and corridors.`);
  recs.push("Brief project stakeholders and update risk register within 24 hours.");
  return recs.slice(0, 5);
}

function buildSources(focus: GlobalEvent | null, events: GlobalEvent[]) {
  const sources = events.slice(0, 4).map((e) => ({
    label: e.source || "Global Feed",
    detail: `${e.title} — ${e.country}`,
  }));
  if (focus) {
    sources.unshift({ label: focus.source || "Primary Source", detail: `${focus.title} (${new Date(focus.timestamp).toLocaleString()})` });
  }
  const seen = new Set<string>();
  return sources.filter((s) => {
    const k = `${s.label}|${s.detail}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 5);
}

export async function buildAnalysis(
  query: string,
  events: GlobalEvent[],
  scores: RiskScores
): Promise<IntelAnalysis> {
  const focus = pickFocusEvent(query, events);
  const focusCountry = detectFocusCountry(query, focus);

  const summary = await answerVoiceQuery(query, events);

  const dna = focus ? generateCrisisDNA(focus) : null;
  const prediction = generatePrediction(focus?.title ?? query);
  const construction = scanConstructionImpact(events);

  const related = events
    .filter((e) => !focus || e.id !== focus.id)
    .filter((e) =>
      !focus ? true : e.categories.some((c) => focus.categories.includes(c)) || e.country === focusCountry
    )
    .slice(0, 5)
    .map((e) => ({ id: e.id, title: e.title, country: e.country, riskLevel: e.riskLevel }));

  const riskScore = dna?.riskScore ?? scores.overall;

  return {
    query,
    title: `Intelligence Analysis — ${focusCountry}`,
    focusCountry,
    generatedAt: new Date().toISOString(),
    summary: summary || `Analysis for ${env.user.name}: monitoring ${focusCountry} conditions.`,
    impact: buildImpactPoints(focus, scores),
    riskScore,
    riskLabel: getRiskLabel(riskScore),
    riskScores: scores,
    dna,
    prediction,
    recommendations: buildRecommendations(focus, scores),
    sources: buildSources(focus, events),
    relatedEvents: related,
    construction: {
      overallRisk: construction.overallRisk,
      materials: construction.materials.slice(0, 6).map((m) => ({
        name: m.name,
        unit: m.unit,
        currentPrice: m.currentPrice,
        changePercent: m.changePercent,
        riskLevel: m.riskLevel,
        delayDays: m.delayDays,
      })),
      boq: {
        projectName: construction.boqImpact.projectName,
        overrunPercent: construction.boqImpact.overrunPercent,
        delayProbability: construction.boqImpact.delayProbability,
        projectedOverrun: construction.boqImpact.projectedOverrun,
      },
    },
  };
}
