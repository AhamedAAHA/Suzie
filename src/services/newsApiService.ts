import { env, hasNewsApi } from "@/lib/env";
import { mockNewsHeadlines } from "@/data/mockShippingData";
import { NewsArticle } from "@/services/brightDataService";

interface NewsApiArticle {
  title: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  description: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

export async function fetchNewsApiHeadlines(query?: string): Promise<NewsArticle[]> {
  if (!hasNewsApi()) {
    return mockNewsHeadlines.map((n, i) => ({
      title: n.headline,
      url: `#article-${i}`,
      source: "Mock Intelligence Feed",
      publishedAt: new Date(Date.now() - i * 600000).toISOString(),
      snippet: n.headline,
    }));
  }

  try {
    const q =
      query ??
      '("shipping disruption" OR "supply chain" OR war OR conflict OR flood OR earthquake OR drought OR oil OR diesel OR fuel OR construction OR port OR canal)';
    const from = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", q);
    url.searchParams.set("searchIn", "title,description");
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "15");
    url.searchParams.set("from", from);
    url.searchParams.set("excludeDomains", "news.ycombinator.com,github.com,medium.com");
    url.searchParams.set("apiKey", env.newsApi.apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`NewsAPI ${res.status}: ${err.slice(0, 120)}`);
    }

    const data: NewsApiResponse = await res.json();
    if (data.status !== "ok" || !data.articles?.length) {
      throw new Error("NewsAPI returned no articles");
    }

    const relevance = [
      "shipping", "supply chain", "conflict", "war", "strike", "missile", "flood",
      "earthquake", "drought", "oil", "fuel", "diesel", "construction", "port",
      "canal", "freight", "tariff", "sanctions", "commodity", "energy",
    ];

    const articles = data.articles
      .filter((a) => a.title && a.title !== "[Removed]")
      .filter((a) => {
        const text = `${a.title} ${a.description ?? ""}`.toLowerCase();
        return relevance.some((keyword) => text.includes(keyword));
      })
      .map((a) => ({
        title: a.title,
        url: a.url,
        source: a.source?.name ?? "NewsAPI",
        publishedAt: a.publishedAt,
        snippet: a.description ?? a.title,
      }));

    if (articles.length === 0) throw new Error("NewsAPI returned no relevant articles");
    return articles;
  } catch {
    return mockNewsHeadlines.map((n, i) => ({
      title: n.headline,
      url: `#article-${i}`,
      source: "NewsAPI Fallback",
      publishedAt: new Date(Date.now() - i * 600000).toISOString(),
      snippet: n.headline,
    }));
  }
}
