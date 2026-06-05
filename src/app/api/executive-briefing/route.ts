import { NextRequest, NextResponse } from "next/server";
import { scanGlobalNews } from "@/services/globalNewsScanner";
import { calculateRiskScores } from "@/services/riskScoring";
import { buildExecutiveBriefing } from "@/services/executiveBriefingService";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const mode = body?.mode === "30s" || body?.mode === "60s" || body?.mode === "full" ? body.mode : "60s";
  const events = await scanGlobalNews();
  const scores = calculateRiskScores(events);
  const briefing = buildExecutiveBriefing(events, scores, mode);
  return NextResponse.json({ briefing, events: events.slice(0, 12), scores });
}
