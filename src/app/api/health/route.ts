import { NextResponse } from "next/server";
import { env, hasAiml, hasBrightData, hasNewsApi, hasOpenWeather, hasSupabase } from "@/lib/env";
import { checkSupabaseHealth } from "@/services/supabaseService";

async function testAiml(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  if (!hasAiml()) return { ok: false, message: "Not configured", latencyMs: 0 };
  const start = Date.now();
  try {
    const res = await fetch(`${env.aiml.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.aiml.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.aiml.models.analysis,
        messages: [{ role: "user", content: "Reply with exactly: SUZIE OK" }],
        max_tokens: 10,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, message: `HTTP ${res.status}: ${err.slice(0, 100)}`, latencyMs };
    }
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "";
    return { ok: true, message: `Model ${env.aiml.models.analysis} — "${reply.slice(0, 30)}"`, latencyMs };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Failed", latencyMs: Date.now() - start };
  }
}

async function testBrightData(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  if (!hasBrightData()) return { ok: false, message: "Not configured", latencyMs: 0 };
  const start = Date.now();
  try {
    const res = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.brightData.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        zone: env.brightData.serpZone,
        url: "https://www.google.com/search?q=global+news&hl=en&brd_json=1",
        format: "json",
        data_format: "parsed_light",
      }),
      signal: AbortSignal.timeout(30000),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, message: `HTTP ${res.status}: ${err.slice(0, 100)}`, latencyMs };
    }
    return { ok: true, message: `SERP zone "${env.brightData.serpZone}" responding`, latencyMs };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Failed", latencyMs: Date.now() - start };
  }
}

async function testNewsApi(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  if (!hasNewsApi()) return { ok: false, message: "Not configured", latencyMs: 0 };
  const start = Date.now();
  try {
    const url = `https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${env.newsApi.apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const latencyMs = Date.now() - start;
    const data = await res.json();
    if (!res.ok || data.status !== "ok") {
      return { ok: false, message: data.message ?? `HTTP ${res.status}`, latencyMs };
    }
    return { ok: true, message: `${data.totalResults ?? 0} articles available`, latencyMs };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Failed", latencyMs: Date.now() - start };
  }
}

async function testOpenWeather(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  if (!hasOpenWeather()) return { ok: false, message: "Not configured", latencyMs: 0 };
  const start = Date.now();
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Colombo&appid=${env.openWeather.apiKey}&units=metric`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}`, latencyMs };
    const data = await res.json();
    return {
      ok: true,
      message: `${data.name}: ${data.weather?.[0]?.main} ${Math.round(data.main?.temp)}°C`,
      latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Failed", latencyMs: Date.now() - start };
  }
}

export async function GET() {
  const [aiml, brightData, newsApi, openWeather, supabase] = await Promise.all([
    testAiml(),
    testBrightData(),
    testNewsApi(),
    testOpenWeather(),
    checkSupabaseHealth(),
  ]);

  const services = {
    aiml: { ...aiml, configured: hasAiml() },
    brightData: { ...brightData, configured: hasBrightData(), zone: env.brightData.serpZone },
    newsApi: { ...newsApi, configured: hasNewsApi() },
    openWeather: { ...openWeather, configured: hasOpenWeather() },
    supabase: { ok: supabase.ok, message: supabase.message, configured: hasSupabase(), url: env.supabase.url },
  };

  const allOk = Object.values(services).every((s) => s.ok);

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    services,
  });
}
