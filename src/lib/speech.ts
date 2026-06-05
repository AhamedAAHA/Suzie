let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;
let speechRunId = 0;

function dispatchSpeechState(type: "start" | "end") {
  window.dispatchEvent(new CustomEvent(`suzie:speech-${type}`));
}

function stopCurrentSpeech() {
  window.speechSynthesis?.cancel();

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }

  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
}

export async function speakGreeting(text: string): Promise<void> {
  if (typeof window === "undefined") return;

  const runId = ++speechRunId;
  stopCurrentSpeech();
  dispatchSpeechState("start");

  try {
    const spokeWithServer = await speakServerAudio(text, runId);
    if (!spokeWithServer && speechRunId === runId) {
      await speakBrowser(text);
    }
  } finally {
    if (speechRunId === runId) {
      currentAudio = null;
      currentAudioUrl = null;
      dispatchSpeechState("end");
    }
  }
}

async function speakServerAudio(text: string, runId: number): Promise<boolean> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok || speechRunId !== runId) return false;

    const blob = await res.blob();
    if (speechRunId !== runId) return true;

    const url = URL.createObjectURL(blob);
    currentAudioUrl = url;
    const audio = new Audio(url);
    currentAudio = audio;

    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        if (currentAudio === audio) currentAudio = null;
        if (currentAudioUrl === url) currentAudioUrl = null;
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        if (currentAudioUrl === url) currentAudioUrl = null;
        URL.revokeObjectURL(url);
        reject(new Error("Audio playback failed"));
      };
      audio.play().catch(reject);
    });

    return true;
  } catch {
    return false;
  }
}

function speakBrowser(text: string): Promise<void> {
  if (!window.speechSynthesis) return Promise.resolve();

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

  return new Promise((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export function speakAlert(text: string): void {
  speakGreeting(text);
}
