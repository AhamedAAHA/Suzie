export const mockCommodityPrices = {
  brent_crude: { price: 87.4, change: 2.3, unit: "USD/bbl" },
  wheat: { price: 612.5, change: -1.2, unit: "USD/MT" },
  steel_hrc: { price: 945, change: 4.8, unit: "USD/MT" },
  cement: { price: 14.8, change: 3.1, unit: "USD/bag" },
  container_freight: { price: 4200, change: 12.5, unit: "USD/FEU" },
  natural_gas: { price: 3.42, change: 0.8, unit: "USD/MMBtu" },
};

export const mockNewsHeadlines = [
  { time: "2m ago", headline: "Red Sea: 3 more vessels rerouted via Cape route", severity: "critical" },
  { time: "14m ago", headline: "China announces Q3 steel export quota reduction", severity: "high" },
  { time: "28m ago", headline: "Sri Lanka: Orange alert for Western Province flooding", severity: "high" },
  { time: "45m ago", headline: "OPEC+ confirms production cut extension", severity: "medium" },
  { time: "1h ago", headline: "Rotterdam port systems partially restored after cyber incident", severity: "medium" },
  { time: "2h ago", headline: "Wheat futures climb on Black Sea corridor tensions", severity: "high" },
  { time: "3h ago", headline: "Panama Canal: Draft restrictions extended 30 days", severity: "medium" },
  { time: "4h ago", headline: "India cement prices hit 18-month high", severity: "medium" },
];
