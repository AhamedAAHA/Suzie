let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;
let speechRunId = 0;
let voicesPrimed = false;

/** Call from a user gesture (click / wake) so voices load reliably in Chrome. */
export function primeSpeech(): void {
  if (typeof window === "undefined" || voicesPrimed) return;
  voicesPrimed = true;
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.getVoices();
  synth.addEventListener(
    "voiceschanged",
    () => synth.getVoices(),
    { once: true }
  );
}

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

/**
 * Speak text using the browser's built-in speech synthesis.
 * Starts in <100 ms — no server roundtrip needed.
 */
export async function speakGreeting(text: string): Promise<void> {
  if (typeof window === "undefined") return;

  const runId = ++speechRunId;
  stopCurrentSpeech();
  dispatchSpeechState("start");

  try {
    // stopCurrentSpeech already cancelled — skip second cancel (Chrome drops utterances)
    await speakBrowser(text, runId, true);
  } finally {
    if (speechRunId === runId) {
      currentAudio = null;
      currentAudioUrl = null;
      dispatchSpeechState("end");
    }
  }
}

/**
 * High-quality server TTS — only use for long briefings / executive reports
 * where audio quality matters more than latency.
 */
export async function speakHQ(text: string): Promise<void> {
  if (typeof window === "undefined") return;

  const runId = ++speechRunId;
  stopCurrentSpeech();
  dispatchSpeechState("start");

  try {
    const spokeWithServer = await speakServerAudio(text, runId);
    if (!spokeWithServer && speechRunId === runId) {
      await speakBrowser(text, runId);
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

/** Priority list for voice selection — most natural-sounding first. */
const PREFERRED_VOICE_NAMES = [
  "Google UK English Female",
  "Google UK English Male",
  "Microsoft Zira - English (United States)",
  "Microsoft David - English (United States)",
  "Google US English",
  "Samantha",
  "Karen",
];

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Try exact preferred names first
  for (const name of PREFERRED_VOICE_NAMES) {
    const v = voices.find((v) => v.name === name);
    if (v) return v;
  }

  // Fallback: any Google or Microsoft English voice
  return (
    voices.find((v) => (v.name.includes("Google") || v.name.includes("Microsoft")) && v.lang.startsWith("en")) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

function speakBrowser(
  text: string,
  runId?: number,
  skipCancel = false
): Promise<void> {
  if (!window.speechSynthesis) return Promise.resolve();

  if (!skipCancel) window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate   = 0.95;
  utterance.pitch  = 0.9;
  utterance.volume = 1;

  // If runId is stale (a newer speakGreeting started), bail immediately
  if (runId !== undefined && speechRunId !== runId) return Promise.resolve();

  const doSpeak = () => {
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    return new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      // Safety cap — Chrome sometimes never fires onend, which would hang login
      const maxMs = Math.min(12000, Math.max(2500, text.length * 90));
      const safetyTimer = setTimeout(finish, maxMs);
      const done = () => {
        clearTimeout(safetyTimer);
        finish();
      };
      utterance.onend = done;
      utterance.onerror = done;
      // Defer speak() — Chrome silently drops utterances queued right after cancel()
      setTimeout(() => {
        if (runId !== undefined && speechRunId !== runId) {
          done();
          return;
        }
        const synth = window.speechSynthesis;
        if (synth.paused) synth.resume();
        synth.speak(utterance);
      }, 60);
    });
  };

  // If voices already loaded, speak immediately; otherwise wait for the event
  if (window.speechSynthesis.getVoices().length > 0) {
    return doSpeak();
  }

  return new Promise<void>((resolve) => {
    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      if (runId !== undefined && speechRunId !== runId) { resolve(); return; }
      doSpeak().then(resolve);
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    // Safety fallback: if voiceschanged never fires, speak anyway after 300ms
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      if (runId !== undefined && speechRunId !== runId) { resolve(); return; }
      doSpeak().then(resolve);
    }, 300);
  });
}

export function speakAlert(text: string): void {
  speakGreeting(text);
}
