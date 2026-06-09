import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeechmatics } from "@/services/speechmaticsService";
import { synthesizeSpeech as synthesizeAiml } from "@/services/aimlService";

export async function POST(req: NextRequest) {
  let text: string;
  try {
    const body = await req.json();
    text = body?.text;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  text = text.trim();

  // Prefer Speechmatics (natural voice for SUZIE)
  const speechmaticsAudio = await synthesizeSpeechmatics(text);
  if (speechmaticsAudio) {
    return new NextResponse(speechmaticsAudio, {
      headers: {
        "Content-Type": "audio/wav",
        "X-TTS-Provider": "speechmatics",
        "Cache-Control": "no-store",
      },
    });
  }

  // Fallback to AIML TTS
  const aimlAudio = await synthesizeAiml(text);
  if (aimlAudio) {
    return new NextResponse(aimlAudio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-TTS-Provider": "aiml",
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({ error: "TTS unavailable — using browser speech" }, { status: 503 });
}
