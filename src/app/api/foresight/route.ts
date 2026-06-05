import { NextRequest, NextResponse } from "next/server";
import { scanGlobalNews } from "@/services/globalNewsScanner";
import { buildForesightSignals, simulateScenario } from "@/services/foresightEngine";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query = typeof body?.query === "string" ? body.query : "";
  const events = await scanGlobalNews();
  const signals = buildForesightSignals(events);
  const scenarios = simulateScenario(query, events);
  return NextResponse.json({
    signals,
    scenarios,
    generatedAt: new Date().toISOString(),
  });
}
