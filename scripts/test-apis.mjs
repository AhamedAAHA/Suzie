import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const results = {};

async function test(name, fn) {
  const start = Date.now();
  try {
    const message = await fn();
    results[name] = { ok: true, message, latencyMs: Date.now() - start };
  } catch (e) {
    results[name] = { ok: false, message: e.message, latencyMs: Date.now() - start };
  }
}

await test("aiml", async () => {
  const key = process.env.AIML_API_KEY;
  const model = process.env.AIML_MODEL_ANALYSIS || "gpt-4o-mini";
  const res = await fetch("https://api.aimlapi.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Reply: SUZIE OK" }],
      max_tokens: 10,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 100)}`);
  const data = await res.json();
  return `Model ${model}: "${data.choices?.[0]?.message?.content?.slice(0, 30)}"`;
});

await test("brightData", async () => {
  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BRIGHT_DATA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      zone: process.env.BRIGHT_DATA_SERP_ZONE,
      url: "https://www.google.com/search?q=global+news&hl=en&brd_json=1",
      format: "json",
      data_format: "parsed_light",
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 100)}`);
  return `Zone ${process.env.BRIGHT_DATA_SERP_ZONE} OK`;
});

await test("newsApi", async () => {
  const url = `https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${process.env.NEWS_API_KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const data = await res.json();
  if (!res.ok || data.status !== "ok") throw new Error(data.message ?? `HTTP ${res.status}`);
  return `${data.totalResults} articles`;
});

await test("openWeather", async () => {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=Colombo&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return `${data.name}: ${data.weather?.[0]?.main} ${Math.round(data.main?.temp)}°C`;
});

await test("supabase", async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const res = await fetch(`${url}/rest/v1/user_preferences?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 100)}`);
  return "Tables accessible";
});

console.log("\n=== SUZIE API Health Check ===\n");
for (const [name, r] of Object.entries(results)) {
  const icon = r.ok ? "✓" : "✗";
  console.log(`${icon} ${name}: ${r.message} (${r.latencyMs}ms)`);
}
const allOk = Object.values(results).every((r) => r.ok);
console.log(`\nOverall: ${allOk ? "ALL PASS" : "SOME FAILED"}\n`);
process.exit(allOk ? 0 : 1);
