import { NextResponse } from "next/server";
import { scanGlobalNews } from "@/services/globalNewsScanner";
import { calculateRiskScores } from "@/services/riskScoring";
import { generateBriefing } from "@/services/aimlService";
import { env } from "@/lib/env";

export async function GET() {
  const events = await scanGlobalNews();
  const riskScores = calculateRiskScores(events);
  const briefing = await generateBriefing(events, env.user.name);

  return NextResponse.json({ events, riskScores, briefing });
}
