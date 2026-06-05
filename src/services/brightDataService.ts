import { mockCommodityPrices, mockNewsHeadlines } from "@/data/mockShippingData";

const BRIGHT_DATA_API_KEY = process.env.BRIGHT_DATA_API_KEY;

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

export async function fetchGlobalNews(query: string): Promise<NewsArticle[]> {
  if (!BRIGHT_DATA_API_KEY) {
    return mockNewsHeadlines.map((n, i) => ({
      title: n.headline,
      url: `#article-${i}`,
      source: "Mock Intelligence Feed",
      publishedAt: new Date(Date.now() - i * 600000).toISOString(),
      snippet: n.headline,
    }));
  }

  try {
    const res = await fetch("https://api.brightdata.com/datasets/v3/trigger", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BRIGHT_DATA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, type: "news" }),
    });
    if (!res.ok) throw new Error("Bright Data API error");
    return await res.json();
  } catch {
    return mockNewsHeadlines.map((n, i) => ({
      title: n.headline,
      url: `#article-${i}`,
      source: "Fallback Feed",
      publishedAt: new Date().toISOString(),
      snippet: n.headline,
    }));
  }
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  if (!BRIGHT_DATA_API_KEY) {
    return [
      { title: `Intelligence scan: ${query}`, url: "#", description: "Mock search result from SUZIE intelligence network" },
    ];
  }

  try {
    const res = await fetch(`https://api.brightdata.com/request?query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${BRIGHT_DATA_API_KEY}` },
    });
    if (!res.ok) throw new Error("Search failed");
    return await res.json();
  } catch {
    return [{ title: query, url: "#", description: "Fallback search result" }];
  }
}

export async function fetchCommodityPrices() {
  if (!BRIGHT_DATA_API_KEY) return mockCommodityPrices;

  try {
    const res = await fetch("https://api.brightdata.com/datasets/commodities", {
      headers: { Authorization: `Bearer ${BRIGHT_DATA_API_KEY}` },
    });
    if (!res.ok) throw new Error("Commodity fetch failed");
    return await res.json();
  } catch {
    return mockCommodityPrices;
  }
}
