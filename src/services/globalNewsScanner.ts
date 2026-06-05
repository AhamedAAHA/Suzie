import { mockGlobalEvents } from "@/data/mockGlobalEvents";
import { classifyCrisis, assessRiskLevel } from "@/services/crisisDetector";
import { fetchGlobalNews } from "@/services/brightDataService";
import { fetchLocalWeatherEvents } from "@/services/openWeatherService";
import { cacheGlobalEvents, loadCachedEvents } from "@/services/supabaseService";
import { env } from "@/lib/env";
import { GlobalEvent } from "@/types";

const COUNTRY_COORDS: Record<string, { lat: number; lng: number; region: string }> = {
  china: { lat: 35.8, lng: 104.1, region: "East Asia" },
  india: { lat: 20.5, lng: 78.9, region: "South Asia" },
  "sri lanka": { lat: 7.8, lng: 80.7, region: "South Asia" },
  ukraine: { lat: 48.3, lng: 31.1, region: "Eastern Europe" },
  yemen: { lat: 15.5, lng: 48.5, region: "Middle East" },
  "saudi arabia": { lat: 24.7, lng: 46.7, region: "Middle East" },
  "united states": { lat: 39.8, lng: -98.5, region: "North America" },
  usa: { lat: 39.8, lng: -98.5, region: "North America" },
  panama: { lat: 9.0, lng: -79.6, region: "Central America" },
  netherlands: { lat: 52.1, lng: 5.3, region: "Europe" },
};

function inferLocation(text: string): { country: string; lat: number; lng: number; region: string } {
  const lower = text.toLowerCase();
  for (const [key, coords] of Object.entries(COUNTRY_COORDS)) {
    if (lower.includes(key)) {
      return { country: key.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "), ...coords };
    }
  }
  return { country: "Global", lat: 20, lng: 0, region: "Worldwide" };
}

function articleToEvent(article: { title: string; snippet: string; source: string; publishedAt: string }, i: number): GlobalEvent {
  const text = `${article.title} ${article.snippet}`;
  const type = classifyCrisis(text);
  const loc = inferLocation(text);
  const riskLevel = assessRiskLevel({ type, rippleEffects: [] });

  return {
    id: `live-${Date.now()}-${i}`,
    title: article.title,
    description: article.snippet,
    type,
    riskLevel,
    lat: loc.lat,
    lng: loc.lng,
    country: loc.country,
    region: loc.region,
    timestamp: article.publishedAt,
    source: article.source,
    categories: type === "shipping_disruption" ? ["supply_chain", "fuel"] :
      type === "climate_disaster" ? ["climate", "construction"] :
      type === "fuel_crisis" ? ["fuel", "construction"] :
      type === "war" ? ["conflict", "food"] : ["supply_chain"],
    rippleEffects: [],
  };
}

export async function scanGlobalNews(): Promise<GlobalEvent[]> {
  const query = "global crisis shipping conflict climate fuel construction";
  const news = await fetchGlobalNews(query);

  const isLive =
    news.length > 0 &&
    !["Mock Intelligence Feed", "NewsAPI Fallback"].includes(news[0].source);

  let events: GlobalEvent[] = [];

  if (isLive) {
    events = news.slice(0, 12).map(articleToEvent);
  }

  // Merge weather events for focus country
  const weatherEvents = await fetchLocalWeatherEvents(env.user.country);
  events = [...weatherEvents, ...events];

  // Deduplicate by title
  const seen = new Set<string>();
  events = events.filter((e) => {
    const key = e.title.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (events.length === 0) {
    const cached = await loadCachedEvents();
    if (cached.length > 0) return cached;
    return mockGlobalEvents;
  }

  // Enrich with mock ripple data where missing
  events = events.map((e) => ({
    ...e,
    rippleEffects: e.rippleEffects.length
      ? e.rippleEffects
      : [`${e.title} may affect regional supply chains`, "Monitor construction material prices"],
  }));

  await cacheGlobalEvents(events);
  return events;
}

export function getBreakingEvents(events: GlobalEvent[]): GlobalEvent[] {
  return events
    .filter((e) => e.riskLevel === "critical" || e.riskLevel === "high")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
}

export function filterEventsByCategory(events: GlobalEvent[], category: string): GlobalEvent[] {
  if (category === "all") return events;
  return events.filter((e) => e.categories.includes(category as GlobalEvent["categories"][number]));
}
