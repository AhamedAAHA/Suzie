import { createServerSupabase } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { GlobalEvent, IntelligenceReport, UserMemory } from "@/types";

export async function saveReport(report: IntelligenceReport): Promise<boolean> {
  const supabase = createServerSupabase();
  if (!supabase) return false;

  const { error } = await supabase.from("intelligence_reports").upsert({
    id: report.id,
    title: report.title,
    generated_at: report.generatedAt,
    event_summary: report.eventSummary,
    affected_countries: report.affectedCountries,
    risk_score: report.riskScore,
    ripple_chain: report.rippleChain,
    prediction: report.prediction,
    recommendations: report.recommendations,
    briefing: report.briefing,
  });

  return !error;
}

export async function loadReports(limit = 20): Promise<IntelligenceReport[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("intelligence_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    generatedAt: row.generated_at,
    eventSummary: row.event_summary ?? "",
    affectedCountries: row.affected_countries ?? [],
    riskScore: row.risk_score ?? 0,
    rippleChain: row.ripple_chain ?? [],
    prediction: row.prediction ?? {
      hours24: "", days7: "", days30: "", months6: "",
    },
    recommendations: row.recommendations ?? [],
    briefing: row.briefing ?? "",
  }));
}

export async function cacheGlobalEvents(events: GlobalEvent[]): Promise<boolean> {
  const supabase = createServerSupabase();
  if (!supabase) return false;

  const rows = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    event_type: e.type,
    risk_level: e.riskLevel,
    lat: e.lat,
    lng: e.lng,
    country: e.country,
    region: e.region,
    source: e.source,
    categories: e.categories,
    ripple_effects: e.rippleEffects,
    event_timestamp: e.timestamp,
    cached_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("global_events_cache").upsert(rows);
  return !error;
}

export async function loadCachedEvents(): Promise<GlobalEvent[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("global_events_cache")
    .select("*")
    .order("cached_at", { ascending: false })
    .limit(30);

  if (error || !data?.length) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    type: row.event_type as GlobalEvent["type"],
    riskLevel: row.risk_level as GlobalEvent["riskLevel"],
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    country: row.country ?? "Global",
    region: row.region ?? "Worldwide",
    timestamp: row.event_timestamp ?? new Date().toISOString(),
    source: row.source ?? "Cache",
    categories: (row.categories ?? []) as GlobalEvent["categories"],
    rippleEffects: row.ripple_effects ?? [],
  }));
}

export async function saveUserPreferences(memory: UserMemory): Promise<boolean> {
  const supabase = createServerSupabase();
  if (!supabase) return false;

  const { data: existing } = await supabase
    .from("user_preferences")
    .select("id")
    .eq("user_name", memory.name)
    .limit(1)
    .maybeSingle();

  const payload = {
    user_name: memory.name,
    country: memory.country,
    interests: memory.interests,
    briefing_style: memory.briefingStyle,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase.from("user_preferences").update(payload).eq("id", existing.id);
    return !error;
  }

  const { error } = await supabase.from("user_preferences").insert(payload);
  return !error;
}

export async function checkSupabaseHealth(): Promise<{ ok: boolean; message: string }> {
  if (!hasSupabase()) return { ok: false, message: "Not configured" };

  const supabase = createServerSupabase();
  if (!supabase) return { ok: false, message: "Client init failed" };

  const { error } = await supabase.from("user_preferences").select("id").limit(1);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Connected — tables accessible" };
}
