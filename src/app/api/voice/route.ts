import { NextRequest, NextResponse } from "next/server";
import { answerVoiceQuery } from "@/services/aimlService";
import { scanGlobalNews } from "@/services/globalNewsScanner";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });
  const events = await scanGlobalNews();
  const response = await answerVoiceQuery(query, events);
  return NextResponse.json({ response });
}
