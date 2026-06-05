import { ForesightSignal, GlobalEvent, RiskLevel, ScenarioVariant } from "@/types";

function riskWeight(level: RiskLevel): number {
  if (level === "critical") return 1;
  if (level === "high") return 0.78;
  if (level === "medium") return 0.55;
  if (level === "low") return 0.35;
  return 0.2;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function buildForesightSignals(events: GlobalEvent[]): ForesightSignal[] {
  const hasShipping = events.some((e) => e.type === "shipping_disruption");
  const hasFuel = events.some((e) => e.type === "fuel_crisis");
  const hasClimate = events.some((e) => e.type === "climate_disaster");
  const highRisk = events.filter((e) => e.riskLevel === "high" || e.riskLevel === "critical");

  const pressure = events.reduce((sum, e) => sum + riskWeight(e.riskLevel), 0) / Math.max(1, events.length);
  const base = clamp(pressure * 90 + highRisk.length * 3);

  const mk = (
    name: string,
    offset: number,
    confidence: number,
    direction: "up" | "down" | "stable",
    explanation: string
  ): ForesightSignal => {
    const p = clamp(base + offset);
    return {
      name,
      probability: p,
      confidence,
      direction,
      explanation,
      timeline: {
        hours24: clamp(p - 10),
        days7: clamp(p - 2),
        days30: clamp(p + 4),
        days90: clamp(p + 7),
        months6: clamp(p + 10),
      },
    };
  };

  return [
    mk(
      "Fuel Prices",
      hasFuel ? 18 : 6,
      hasFuel ? 86 : 72,
      hasFuel ? "up" : "stable",
      "Based on supply corridor stress and freight pressure, fuel costs are likely to trend upward in the near term."
    ),
    mk(
      "Steel Availability",
      hasShipping ? 14 : 5,
      hasShipping ? 84 : 70,
      hasShipping ? "down" : "stable",
      "Shipping disruptions and export concentration suggest tightening steel availability within 2-4 weeks."
    ),
    mk(
      "Construction Delays",
      hasClimate ? 15 : 7,
      hasClimate ? 82 : 71,
      "up",
      "Weather volatility, logistics delays, and input cost uncertainty increase schedule risk for construction projects."
    ),
    mk(
      "Import Costs",
      hasShipping ? 16 : 8,
      81,
      "up",
      "Freight rerouting and insurance premiums indicate import costs are likely to stay elevated."
    ),
    mk(
      "Port Congestion",
      hasShipping ? 13 : 6,
      78,
      hasShipping ? "up" : "stable",
      "Maritime chokepoint pressure and rerouted vessel flows increase congestion probability at key ports."
    ),
    mk(
      "Food Inflation",
      hasClimate ? 11 : 6,
      74,
      "up",
      "Climate disruptions and transport constraints can elevate food inflation pressure over the next 30-90 days."
    ),
    mk(
      "Supply Chain Disruptions",
      highRisk.length > 3 ? 15 : 8,
      85,
      "up",
      "Multi-region risk concentration suggests higher probability of cascading supply chain disruption."
    ),
  ];
}

export function simulateScenario(query: string, events: GlobalEvent[]): ScenarioVariant[] {
  const q = query.toLowerCase();
  const top = events[0];
  if (q.includes("red sea")) {
    return [
      {
        id: "a",
        title: "Scenario A — Risk Stabilizes",
        riskLevel: "medium",
        summary: "Security escorts and route normalization reduce volatility by late quarter.",
        impacts: ["Freight premiums flatten", "Steel lead times normalize", "Construction delay risk remains moderate"],
      },
      {
        id: "b",
        title: "Scenario B — Freight Cost +25%",
        riskLevel: "high",
        summary: "Persistent disruption sustains elevated rerouting and insurance costs.",
        impacts: ["Import costs rise", "Fuel-linked transport costs increase", "BOQ contingency pressure grows"],
      },
      {
        id: "c",
        title: "Scenario C — Steel Shortage",
        riskLevel: "critical",
        summary: "Extended route uncertainty and export concentration create supply gaps.",
        impacts: ["Steel allocation constraints", "Tender repricing", "Project sequencing stress"],
      },
      {
        id: "d",
        title: "Scenario D — Construction Delays",
        riskLevel: "high",
        summary: "Material flow disruptions propagate into project schedule slippage.",
        impacts: ["Critical path slips 2-6 weeks", "Idle labor cost risk", "Contract variation claims increase"],
      },
    ];
  }

  return [
    {
      id: "baseline",
      title: "Baseline Scenario",
      riskLevel: top?.riskLevel ?? "medium",
      summary: "Current risk posture persists with localized escalation windows.",
      impacts: ["Monitor logistics corridors", "Maintain procurement buffer", "Refresh risk register weekly"],
    },
    {
      id: "stress",
      title: "Stress Scenario",
      riskLevel: "high",
      summary: "Compounded events trigger broader cost and schedule shocks.",
      impacts: ["Freight and fuel pressure", "Supply chain intermittency", "Construction re-baselining"],
    },
  ];
}
