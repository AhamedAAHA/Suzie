import { env, hasSpeechmatics } from "@/lib/env";

const TTS_BASE = "https://preview.tts.speechmatics.com";

export async function synthesizeSpeechmatics(text: string): Promise<ArrayBuffer | null> {
  if (!hasSpeechmatics()) return null;

  const voice = env.speechmatics.voice;
  const url = `${TTS_BASE}/generate/${voice}?output_format=wav_16000`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.speechmatics.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text.slice(0, 1000) }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Speechmatics TTS error:", res.status, err.slice(0, 200));
      return null;
    }

    return res.arrayBuffer();
  } catch (err) {
    console.error("Speechmatics TTS failed:", err);
    return null;
  }
}
