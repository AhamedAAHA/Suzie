import { mockBOQImpact, mockConstructionMaterials } from "@/data/mockConstructionMaterials";
import { ConstructionMaterial, GlobalEvent } from "@/types";

export function scanConstructionImpact(events: GlobalEvent[]): {
  materials: ConstructionMaterial[];
  boqImpact: typeof mockBOQImpact;
  overallRisk: number;
} {
  const constructionEvents = events.filter((e) =>
    e.categories.includes("construction")
  );

  const riskBoost = constructionEvents.length * 5;
  const materials = mockConstructionMaterials.map((m) => ({
    ...m,
    changePercent: m.changePercent + riskBoost * 0.3,
    currentPrice: m.basePrice * (1 + (m.changePercent + riskBoost * 0.3) / 100),
  }));

  const overallRisk = Math.min(
    100,
    Math.round(
      materials.reduce((sum, m) => {
        const weight = m.riskLevel === "high" ? 3 : m.riskLevel === "medium" ? 2 : 1;
        return sum + m.changePercent * weight;
      }, 0) / materials.length
    )
  );

  return {
    materials,
    boqImpact: {
      ...mockBOQImpact,
      projectedOverrun: mockBOQImpact.projectedOverrun + riskBoost * 50_000,
      overrunPercent: mockBOQImpact.overrunPercent + riskBoost * 0.2,
      delayProbability: Math.min(95, mockBOQImpact.delayProbability + riskBoost),
    },
    overallRisk,
  };
}

export function predictMaterialImpact(
  materialName: string,
  events: GlobalEvent[]
): { impact: string; delayDays: number; priceChange: number } {
  const material = mockConstructionMaterials.find(
    (m) => m.name.toLowerCase().includes(materialName.toLowerCase())
  );
  const relevantEvents = events.filter(
    (e) => e.categories.includes("construction") || e.categories.includes("supply_chain")
  );

  return {
    impact: relevantEvents.map((e) => e.title).join("; ") || "No major impact detected",
    delayDays: material?.delayDays ?? 0,
    priceChange: material?.changePercent ?? 0,
  };
}
