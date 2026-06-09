import { NextRequest, NextResponse } from "next/server";
import { answerVoiceQuery } from "@/services/aimlService";
import { scanGlobalNews } from "@/services/globalNewsScanner";

export async function POST(req: NextRequest) {
  let query: string;
  try {
    const body = await req.json();
    query = body?.query;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!query || typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  try {
    const events = await scanGlobalNews();
    const response = await answerVoiceQuery(query.trim(), events);
    return NextResponse.json({ response });
  } catch (err) {
    console.error("[/api/voice] handler error:", err);
    return NextResponse.json(
      { response: "Neural link degraded. Signal lost. Try again." },
      { status: 200 }
    );
  }
}
