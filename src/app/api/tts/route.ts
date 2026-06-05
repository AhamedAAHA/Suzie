import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech } from "@/services/aimlService";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const audio = await synthesizeSpeech(text);
  if (!audio) {
    return NextResponse.json({ error: "TTS unavailable — using browser speech" }, { status: 503 });
  }

  return new NextResponse(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
