import { env, hasBrightData } from "@/lib/env";
import { mockCommodityPrices, mockNewsHeadlines } from "@/data/mockShippingData";
import { fetchNewsApiHeadlines } from "@/services/newsApiService";

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  snippet: string;
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface SerpOrganicResult {
  title?: string;
  link?: string;
  snippet?: string;
  description?: string;
}

async function brightDataSerpRequest(searchUrl: string): Promise<unknown> {
  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.brightData.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      zone: env.brightData.serpZone,
      url: searchUrl,
      format: "json",
      data_format: "parsed_light",
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bright Data ${res.status}: ${err.slice(0, 150)}`);
  }

  return res.json();
}

function parseSerpResults(data: unknown): SearchResult[] {
  const results: SearchResult[] = [];
  const obj = data as Record<string, unknown>;

  const organic =
    (obj.organic as SerpOrganicResult[]) ??
    ((obj.body as Record<string, unknown>)?.organic as SerpOrganicResult[]) ??
    ((obj.results as Record<string, unknown>)?.organic as SerpOrganicResult[]) ??
    [];

  if (Array.isArray(organic)) {
    for (const item of organic.slice(0, 10)) {
      if (item.title) {
        results.push({
          title: item.title,
          url: item.link ?? "#",
          description: item.snippet ?? item.description ?? "",
        });
      }
    }
  }

  return results;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  if (!hasBrightData()) {
    return [{ title: `Intelligence scan: ${query}`, url: "#", description: "Bright Data not configured" }];
  }

  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=us&brd_json=1`;
    const data = await brightDataSerpRequest(searchUrl);
    const results = parseSerpResults(data);
    if (results.length > 0) return results;
    throw new Error("No SERP results parsed");
  } catch {
    return [{ title: query, url: "#", description: "Bright Data SERP fallback result" }];
  }
}

export async function fetchGlobalNews(query: string): Promise<NewsArticle[]> {
  // Primary: NewsAPI (faster, structured headlines)
  const newsApiArticles = await fetchNewsApiHeadlines(query);
  if (newsApiArticles[0]?.source !== "Mock Intelligence Feed" && newsApiArticles[0]?.source !== "NewsAPI Fallback") {
    return newsApiArticles;
  }

  // Secondary: Bright Data SERP news search
  if (hasBrightData()) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + " news")}&tbm=nws&hl=en&brd_json=1`;
      const data = await brightDataSerpRequest(searchUrl);
      const serpResults = parseSerpResults(data);
      if (serpResults.length > 0) {
        return serpResults.map((r) => ({
          title: r.title,
          url: r.url,
          source: "Bright Data SERP",
          publishedAt: new Date().toISOString(),
          snippet: r.description,
        }));
      }
    } catch {
      // fall through
    }
  }

  return mockNewsHeadlines.map((n, i) => ({
    title: n.headline,
    url: `#article-${i}`,
    source: "Mock Intelligence Feed",
    publishedAt: new Date(Date.now() - i * 600000).toISOString(),
    snippet: n.headline,
  }));
}

export async function fetchCommodityPrices() {
  if (!hasBrightData()) return mockCommodityPrices;

  try {
    const results = await searchWeb("oil price steel price cement price commodity today");
    if (results.length > 0) {
      return {
        ...mockCommodityPrices,
        _source: "bright_data_serp",
        _headlines: results.slice(0, 3).map((r) => r.title),
      };
    }
  } catch {
    // fall through
  }

  return mockCommodityPrices;
}
