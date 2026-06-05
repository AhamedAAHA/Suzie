export function speakGreeting(text: string): void {
  if (typeof window === "undefined") return;
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
