import { mockShippingRoutes } from "@/data/mockGlobalEvents";
import { fetchCommodityPrices } from "@/services/brightDataService";
import { ShippingRoute } from "@/types";

export async function scanSupplyChain() {
  const commodities = await fetchCommodityPrices();
  const routes = mockShippingRoutes;

  const blockedRoutes = routes.filter((r) => r.status === "blocked");
  const delayedRoutes = routes.filter((r) => r.status === "delayed");

  const riskScore = Math.min(
    100,
    40 + blockedRoutes.length * 15 + delayedRoutes.length * 8
  );

  return {
    riskScore,
    routes,
    commodities,
    alerts: [
      ...blockedRoutes.map((r) => `BLOCKED: ${r.from.name} → ${r.to.name}`),
      ...delayedRoutes.map((r) => `DELAYED +${r.delayHours}h: ${r.from.name} → ${r.to.name}`),
    ],
    summary: `${blockedRoutes.length} routes blocked, ${delayedRoutes.length} delayed. Container freight elevated.`,
  };
}

export function getRouteStatusColor(status: ShippingRoute["status"]): string {
  switch (status) {
    case "blocked": return "#ff2d55";
    case "delayed": return "#ff9500";
    case "active": return "#00f0ff";
  }
}
