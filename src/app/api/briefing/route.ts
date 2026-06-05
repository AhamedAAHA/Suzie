import { NextResponse } from "next/server";
import { generateBriefing } from "@/services/aimlService";
import { scanGlobalNews } from "@/services/globalNewsScanner";

export async function GET() {
  const events = await scanGlobalNews();
  const userName = process.env.NEXT_PUBLIC_USER_NAME ?? "Hubaib";
  const briefing = await generateBriefing(events, userName);
  return NextResponse.json({ briefing, events: events.slice(0, 5) });
}
