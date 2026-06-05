export async function speakGreeting(text: string): Promise<void> {
  if (typeof window === "undefined") return;

  // Try AIML TTS first
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
      return;
    }
  } catch {
    // fall through to browser TTS
  }

  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 0.9;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.name.includes("Google") || v.name.includes("Microsoft") || v.lang.startsWith("en")
  );
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
}

export function speakAlert(text: string): void {
  speakGreeting(text);
}
