import { NextRequest, NextResponse } from "next/server";
import { scanGlobalNews } from "@/services/globalNewsScanner";
import { calculateRiskScores } from "@/services/riskScoring";
import { buildAnalysis } from "@/services/analysisService";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const events = await scanGlobalNews();
  const riskScores = calculateRiskScores(events);
  const analysis = await buildAnalysis(query, events, riskScores);

  return NextResponse.json({ analysis });
}
