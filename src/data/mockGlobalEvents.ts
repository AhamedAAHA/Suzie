import { CrisisDNA, GlobalEvent, RiskScores, ShippingRoute } from "@/types";

export const mockRiskScores: RiskScores = {
  overall: 67,
  supplyChain: 72,
  conflict: 81,
  climate: 58,
  cyber: 45,
  construction: 63,
  food: 55,
  fuel: 74,
};

export const mockGlobalEvents: GlobalEvent[] = [
  {
    id: "evt-001",
    title: "Red Sea Shipping Disruption",
    description:
      "Multiple container vessels rerouted around Cape of Good Hope due to maritime security incidents in the Red Sea corridor.",
    type: "shipping_disruption",
    riskLevel: "critical",
    lat: 15.5,
    lng: 42.5,
    country: "Yemen",
    region: "Middle East",
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    source: "Maritime Intelligence",
    categories: ["supply_chain", "fuel", "construction"],
    rippleEffects: [
      "Freight costs up 35-45%",
      "Asia-Europe transit +12 days",
      "Steel import delays to South Asia",
      "Fuel surcharge increases",
    ],
  },
  {
    id: "evt-002",
    title: "China Steel Export Restrictions",
    description:
      "New export quotas on construction-grade steel announced, affecting global supply chains and BOQ pricing.",
    type: "economic_crisis",
    riskLevel: "high",
    lat: 31.2,
    lng: 121.5,
    country: "China",
    region: "East Asia",
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
    source: "Commodity Markets",
    categories: ["construction", "supply_chain"],
    rippleEffects: [
      "Steel prices +8-12% globally",
      "BOQ material cost overrun risk",
      "Project timeline extension 2-4 weeks",
    ],
  },
  {
    id: "evt-003",
    title: "Sri Lanka Monsoon Flooding Alert",
    description:
      "Heavy rainfall forecast for Western Province. Port operations and construction sites may face disruption.",
    type: "climate_disaster",
    riskLevel: "high",
    lat: 6.9,
    lng: 79.9,
    country: "Sri Lanka",
    region: "South Asia",
    timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
    source: "Meteorological Dept",
    categories: ["climate", "construction", "food"],
    rippleEffects: [
      "Colombo construction delays",
      "Sand/gravel supply disruption",
      "Transport route closures",
      "Food price volatility",
    ],
  },
  {
    id: "evt-004",
    title: "OPEC+ Production Cut Extension",
    description:
      "Oil production cuts extended through Q3, maintaining elevated crude prices and downstream fuel costs.",
    type: "fuel_crisis",
    riskLevel: "high",
    lat: 24.7,
    lng: 46.7,
    country: "Saudi Arabia",
    region: "Middle East",
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    source: "Energy Markets",
    categories: ["fuel", "construction", "supply_chain"],
    rippleEffects: [
      "Diesel +15% in South Asia",
      "Transport/logistics cost surge",
      "Machinery operating cost increase",
      "Cement production cost rise",
    ],
  },
  {
    id: "evt-005",
    title: "European Port Cyber Attack",
    description:
      "Major Rotterdam port logistics systems compromised. Container tracking and scheduling disrupted.",
    type: "cyber_attack",
    riskLevel: "medium",
    lat: 51.9,
    lng: 4.5,
    country: "Netherlands",
    region: "Europe",
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    source: "Cyber Threat Intel",
    categories: ["cyber", "supply_chain"],
    rippleEffects: [
      "EU import delays 3-7 days",
      "Supply chain visibility loss",
      "Insurance premium increases",
    ],
  },
  {
    id: "evt-006",
    title: "Ukraine Grain Corridor Tension",
    description:
      "Escalating tensions near Black Sea grain export routes threaten global food supply stability.",
    type: "war",
    riskLevel: "critical",
    lat: 46.5,
    lng: 32.0,
    country: "Ukraine",
    region: "Eastern Europe",
    timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
    source: "Global News Scanner",
    categories: ["conflict", "food", "supply_chain"],
    rippleEffects: [
      "Wheat futures +6%",
      "Food import costs rise in developing nations",
      "Sri Lanka food security pressure",
    ],
  },
  {
    id: "evt-007",
    title: "Panama Canal Draft Restrictions",
    description:
      "Low water levels force draft restrictions, reducing daily transit capacity by 30%.",
    type: "shipping_disruption",
    riskLevel: "medium",
    lat: 9.0,
    lng: -79.6,
    country: "Panama",
    region: "Central America",
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    source: "Port Authority",
    categories: ["supply_chain", "construction"],
    rippleEffects: [
      "Americas-Asia shipping delays",
      "Lumber and copper delays",
      "Construction material lead times extend",
    ],
  },
  {
    id: "evt-008",
    title: "India Cement Price Surge",
    description:
      "Domestic demand and fuel costs push cement prices to 18-month highs across South Asia.",
    type: "economic_crisis",
    riskLevel: "medium",
    lat: 28.6,
    lng: 77.2,
    country: "India",
    region: "South Asia",
    timestamp: new Date(Date.now() - 10 * 3600000).toISOString(),
    source: "Construction Index",
    categories: ["construction", "fuel"],
    rippleEffects: [
      "Sri Lanka cement import costs +10%",
      "BOQ revision required",
      "Project margin compression",
    ],
  },
];

export const mockCrisisDNA: CrisisDNA[] = mockGlobalEvents.map((evt) => ({
  id: `dna-${evt.id}`,
  eventId: evt.id,
  origin: evt.country,
  affectedSectors: evt.categories.map((c) =>
    c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  ),
  affectedCountries: getAffectedCountries(evt),
  spreadSpeed: evt.riskLevel === "critical" ? "critical" : evt.riskLevel === "high" ? "fast" : "moderate",
  riskScore: evt.riskLevel === "critical" ? 90 : evt.riskLevel === "high" ? 75 : evt.riskLevel === "medium" ? 55 : 30,
  confidence: 0.75 + Math.random() * 0.2,
}));

function getAffectedCountries(evt: GlobalEvent): string[] {
  const base = [evt.country];
  if (evt.region === "Middle East") base.push("Sri Lanka", "India", "UAE", "Egypt");
  if (evt.region === "East Asia") base.push("Sri Lanka", "Vietnam", "Indonesia");
  if (evt.region === "South Asia") base.push("Sri Lanka", "India", "Bangladesh");
  if (evt.region === "Europe") base.push("Germany", "UK", "Sri Lanka");
  return [...new Set(base)];
}

export const mockShippingRoutes: ShippingRoute[] = [
  {
    id: "route-1",
    from: { lat: 31.2, lng: 121.5, name: "Shanghai" },
    to: { lat: 6.9, lng: 79.9, name: "Colombo" },
    status: "delayed",
    delayHours: 168,
  },
  {
    id: "route-2",
    from: { lat: 25.2, lng: 55.3, name: "Dubai" },
    to: { lat: 6.9, lng: 79.9, name: "Colombo" },
    status: "active",
    delayHours: 0,
  },
  {
    id: "route-3",
    from: { lat: 51.9, lng: 4.5, name: "Rotterdam" },
    to: { lat: 31.2, lng: 121.5, name: "Shanghai" },
    status: "blocked",
    delayHours: 336,
  },
  {
    id: "route-4",
    from: { lat: 1.3, lng: 103.8, name: "Singapore" },
    to: { lat: 6.9, lng: 79.9, name: "Colombo" },
    status: "active",
    delayHours: 24,
  },
];
