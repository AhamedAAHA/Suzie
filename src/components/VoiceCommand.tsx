"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { useSuzieStore } from "@/store/suzieStore";
import { isWakePhrase } from "@/lib/wakePhrases";

interface VoiceCommandProps {
  onCommand?: (transcript: string) => void;
  onWake?: () => void;
  enabled?: boolean;
  autoStart?: boolean;
  compact?: boolean;
}

export default function VoiceCommand({
  onCommand,
  onWake,
  enabled = true,
  autoStart = false,
  compact = false,
}: VoiceCommandProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const speechPausedRef = useRef(false);
  const lastCommandRef = useRef<{ text: string; at: number } | null>(null);
  const wakeTriggeredRef = useRef(false);
  const addLog = useSuzieStore((s) => s.addLog);
  const onCommandRef = useRef(onCommand);
  const onWakeRef = useRef(onWake);

  useEffect(() => {
    onCommandRef.current = onCommand;
    onWakeRef.current = onWake;
  }, [onCommand, onWake]);

  const processCommand = useCallback(
    (text: string, isFinal = true) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (speechPausedRef.current) return;

      if (onWakeRef.current && isWakePhrase(trimmed)) {
        if (wakeTriggeredRef.current) return;
        wakeTriggeredRef.current = true;
        setTranscript(trimmed);
        addLog(`VOICE WAKE: "${trimmed}"`);
        shouldListenRef.current = false;
        recognitionRef.current?.stop();
        setIsListening(false);
        onWakeRef.current?.();
        onCommandRef.current?.(trimmed);
        return;
      }

      if (!isFinal) return;

      const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");
      const now = Date.now();
      if (
        lastCommandRef.current &&
        lastCommandRef.current.text === normalized &&
        now - lastCommandRef.current.at < 2500
      ) {
        return;
      }
      lastCommandRef.current = { text: normalized, at: now };

      setTranscript(trimmed);
      addLog(`VOICE: "${trimmed}"`);
      onCommandRef.current?.(trimmed);
    },
    [addLog]
  );

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !enabled) return;

    shouldListenRef.current = true;
    try {
      recognition.start();
      setIsListening(true);
      setError(null);
      addLog("Voice recognition active");
    } catch {
      // already started
      setIsListening(true);
    }
  }, [enabled, addLog]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      setError("Speech recognition not supported — use Chrome or Edge");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        for (let alt = 0; alt < result.length; alt++) {
          const text = result[alt]?.transcript ?? "";
          if (onWakeRef.current && isWakePhrase(text)) {
            processCommand(text, result.isFinal);
            return;
          }
        }

        const primaryText = result[0]?.transcript ?? "";
        processCommand(primaryText, result.isFinal);
      }
    };

    recognition.onerror = (event: Event & { error?: string }) => {
      const code = event.error;
      if (code === "not-allowed") {
        setError("Microphone permission denied for voice");
        shouldListenRef.current = false;
        setIsListening(false);
      } else if (code === "no-speech") {
        // normal — keep listening
      } else if (code !== "aborted") {
        setError(`Voice error: ${code}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (shouldListenRef.current && enabled) {
        setTimeout(() => {
          if (speechPausedRef.current) return;
          try {
            recognition.start();
            setIsListening(true);
          } catch {
            // ignore
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    if (autoStart) {
      const timer = setTimeout(() => startListening(), 500);
      return () => {
        clearTimeout(timer);
        shouldListenRef.current = false;
        recognition.stop();
      };
    }

    return () => {
      shouldListenRef.current = false;
      recognition.stop();
    };
  }, [enabled, autoStart, processCommand, startListening]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pauseForSpeech = () => {
      speechPausedRef.current = true;
      recognitionRef.current?.stop();
      setIsListening(false);
    };

    const resumeAfterSpeech = () => {
      speechPausedRef.current = false;
      if (enabled && autoStart) {
        setTimeout(() => startListening(), 350);
      }
    };

    window.addEventListener("suzie:speech-start", pauseForSpeech);
    window.addEventListener("suzie:speech-end", resumeAfterSpeech);
    return () => {
      window.removeEventListener("suzie:speech-start", pauseForSpeech);
      window.removeEventListener("suzie:speech-end", resumeAfterSpeech);
    };
  }, [enabled, autoStart, startListening]);

  const toggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  if (!supported) {
    return (
      <p className="text-xs text-orange-400 font-mono text-center">
        Voice wake requires Chrome or Edge
      </p>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "w-full max-w-md"}`}>
      <motion.button
        type="button"
        onClick={toggle}
        className={`p-2 rounded-lg border transition-all shrink-0 ${
          isListening
            ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
            : "border-gray-700 text-gray-400 hover:border-cyan-400/50"
        }`}
        whileTap={{ scale: 0.95 }}
        animate={
          isListening
            ? { boxShadow: ["0 0 0px rgba(0,240,255,0)", "0 0 15px rgba(0,240,255,0.4)", "0 0 0px rgba(0,240,255,0)"] }
            : {}
        }
        transition={{ duration: 1.5, repeat: Infinity }}
        title={isListening ? "Stop listening" : "Start listening"}
      >
        {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
      </motion.button>

      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && transcript) {
              processCommand(transcript, true);
            }
          }}
          placeholder={isListening ? "Listening..." : "Type a command..."}
          className="w-full bg-transparent border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-400/50"
        />
        {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
        {autoStart && isListening && !error && (
          <p className="text-[10px] text-green-400/70 mt-1">Voice wake active</p>
        )}
      </div>
    </div>
  );
}
