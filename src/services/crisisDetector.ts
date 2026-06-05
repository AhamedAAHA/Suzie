import { CrisisDNA, CrisisType, GlobalEvent, RiskLevel } from "@/types";

const CRISIS_KEYWORDS: Record<CrisisType, string[]> = {
  war: ["war", "conflict", "military", "invasion", "strike", "missile"],
  climate_disaster: ["flood", "hurricane", "earthquake", "drought", "monsoon", "wildfire", "tsunami"],
  cyber_attack: ["cyber", "hack", "ransomware", "breach", "malware"],
  economic_crisis: ["recession", "inflation", "default", "sanctions", "quota", "tariff"],
  shipping_disruption: ["port", "canal", "shipping", "vessel", "freight", "maritime", "cargo"],
  disease_outbreak: ["outbreak", "pandemic", "virus", "epidemic", "disease"],
  food_shortage: ["grain", "wheat", "food", "famine", "crop", "harvest"],
  fuel_crisis: ["oil", "opec", "crude", "fuel", "diesel", "gasoline", "energy"],
};

export function classifyCrisis(text: string): CrisisType {
  const lower = text.toLowerCase();
  let best: CrisisType = "economic_crisis";
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(CRISIS_KEYWORDS)) {
    const score = keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = type as CrisisType;
    }
  }
  return best;
}

export function assessRiskLevel(event: Partial<GlobalEvent>): RiskLevel {
  const criticalTypes: CrisisType[] = ["war", "shipping_disruption"];
  const highTypes: CrisisType[] = ["fuel_crisis", "climate_disaster", "food_shortage"];

  if (event.type && criticalTypes.includes(event.type)) return "critical";
  if (event.type && highTypes.includes(event.type)) return "high";
  if (event.rippleEffects && event.rippleEffects.length > 3) return "high";
  return "medium";
}

export function generateCrisisDNA(event: GlobalEvent): CrisisDNA {
  const spreadMap: Record<RiskLevel, CrisisDNA["spreadSpeed"]> = {
    critical: "critical",
    high: "fast",
    medium: "moderate",
    low: "slow",
    monitoring: "slow",
  };

  return {
    id: `dna-${event.id}`,
    eventId: event.id,
    origin: event.country,
    affectedSectors: event.categories.map((c) =>
      c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    ),
    affectedCountries: [...new Set([event.country, "Sri Lanka", "India", "Global"])],
    spreadSpeed: spreadMap[event.riskLevel],
    riskScore:
      event.riskLevel === "critical" ? 92 :
      event.riskLevel === "high" ? 78 :
      event.riskLevel === "medium" ? 55 : 30,
    confidence: 0.82,
  };
}

export function detectNewCrises(
  previous: GlobalEvent[],
  current: GlobalEvent[]
): GlobalEvent[] {
  const prevIds = new Set(previous.map((e) => e.id));
  return current.filter((e) => !prevIds.has(e.id) && (e.riskLevel === "critical" || e.riskLevel === "high"));
}
