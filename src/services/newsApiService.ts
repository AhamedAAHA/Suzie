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
    const q = query ?? "global crisis OR shipping OR conflict OR climate";
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", q);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "15");
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

    return data.articles.map((a) => ({
      title: a.title,
      url: a.url,
      source: a.source?.name ?? "NewsAPI",
      publishedAt: a.publishedAt,
      snippet: a.description ?? a.title,
    }));
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
