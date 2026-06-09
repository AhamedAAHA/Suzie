"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { useSuzieStore } from "@/store/suzieStore";
import { isWakePhrase } from "@/lib/wakePhrases";
import { speakGreeting } from "@/lib/speech";

// ─── Public handle (used by dashboard to trigger wake from clap) ──────────────
export interface VoiceCommandHandle {
  /** Unlock the voice gate externally (e.g. from clap detector). */
  wake: () => void;
}

interface VoiceCommandProps {
  onCommand?: (transcript: string) => void;
  onWake?: () => void;
  enabled?: boolean;
  autoStart?: boolean;
  compact?: boolean;
  /**
   * When true, all speech is silently dropped until a wake phrase or
   * an external wake() call unlocks the gate.
   * Auto-locks again after `awakeTimeoutMs` ms of no commands (default 30 s).
   */
  requireWake?: boolean;
  awakeTimeoutMs?: number;
  /** Called whenever the locked/awake state changes. */
  onGateChange?: (awake: boolean) => void;
}

const VoiceCommand = forwardRef<VoiceCommandHandle, VoiceCommandProps>(
  function VoiceCommand(
    {
      onCommand,
      onWake,
      enabled = true,
      autoStart = false,
      compact = false,
      requireWake = false,
      awakeTimeoutMs = 30_000,
      onGateChange,
    },
    ref
  ) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [supported, setSupported] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef   = useRef<SpeechRecognition | null>(null);
    const shouldListenRef  = useRef(false);
    const speechPausedRef  = useRef(false);
    const lastCommandRef   = useRef<{ text: string; at: number } | null>(null);
    const wakeTriggeredRef = useRef(false);

    // ── Voice gate state ────────────────────────────────────────────────────
    const isAwakeRef    = useRef(false);
    const awakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const addLog       = useSuzieStore((s) => s.addLog);
    const onCommandRef = useRef(onCommand);
    const onWakeRef    = useRef(onWake);
    const onGateRef    = useRef(onGateChange);

    useEffect(() => {
      onCommandRef.current = onCommand;
      onWakeRef.current    = onWake;
      onGateRef.current    = onGateChange;
    }, [onCommand, onWake, onGateChange]);

    // ── wakeUp — unlock gate and (re-)start the auto-lock timer ────────────
    const wakeUp = useCallback(() => {
      if (!isAwakeRef.current) {
        isAwakeRef.current = true;
        onGateRef.current?.(true);
        addLog("[VOICE GATE] Neural link active. Accepting directives.");
      }
      if (awakeTimerRef.current) clearTimeout(awakeTimerRef.current);
      awakeTimerRef.current = setTimeout(() => {
        isAwakeRef.current = false;
        onGateRef.current?.(false);
        addLog("[VOICE GATE] Neural link idle. Auto-locked. Say 'Hey SUZIE' to re-establish.");
        void speakGreeting("Neural link secured. Voice gate locked.");
      }, awakeTimeoutMs);
    }, [addLog, awakeTimeoutMs]);

    // Expose wake() for external callers (clap, button, etc.)
    useImperativeHandle(ref, () => ({ wake: wakeUp }), [wakeUp]);

    // ── processCommand ──────────────────────────────────────────────────────
    const processCommand = useCallback(
      (text: string, isFinal = true) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        if (speechPausedRef.current) return;

        const isWake = isWakePhrase(trimmed);

        // ── Boot-page wake flow (onWake prop is set) ────────────────────
        if (onWakeRef.current && isWake) {
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

        // Wake phrases bypass the final-only guard (immediate response).
        // All other commands require a final result.
        if (!isFinal && !isWake) return;

        // ── Voice gate ───────────────────────────────────────────────────
        if (requireWake) {
          if (isWake) {
            // Wake phrase: unlock gate, then fall through to forward the command
            wakeUp();
          } else if (!isAwakeRef.current) {
            // Locked — silently drop this command
            return;
          } else {
            // Already awake — reset the auto-lock timer
            wakeUp();
          }
        }

        // ── Deduplication ────────────────────────────────────────────────
        const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");
        const now = Date.now();
        const dedupMs = isWake ? 4000 : 2500;
        if (
          lastCommandRef.current &&
          lastCommandRef.current.text === normalized &&
          now - lastCommandRef.current.at < dedupMs
        ) {
          return;
        }
        lastCommandRef.current = { text: normalized, at: now };

        setTranscript(trimmed);
        addLog(`VOICE: "${trimmed}"`);
        onCommandRef.current?.(trimmed);
      },
      [addLog, requireWake, wakeUp]
    );

    const hasLoggedActiveRef = useRef(false);
    const startListening = useCallback(() => {
      const recognition = recognitionRef.current;
      if (!recognition || !enabled) return;
      shouldListenRef.current = true;
      try {
        recognition.start();
        setIsListening(true);
        setError(null);
        // Only log once per session, not on every restart
        if (!hasLoggedActiveRef.current) {
          hasLoggedActiveRef.current = true;
          addLog("[VOICE] Mic channel open — neural interface online.");
        }
      } catch {
        setIsListening(true);
      }
    }, [enabled, addLog]);

    const stopListening = useCallback(() => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
    }, []);

    // ── Speech Recognition setup ────────────────────────────────────────────
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
      recognition.continuous     = true;
      recognition.interimResults = true;
      recognition.lang           = "en-US";
      recognition.maxAlternatives = 3;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];

          // Check all alternatives for wake phrase first
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

    // ── Pause/resume around SUZIE speech ────────────────────────────────────
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
            placeholder={
              requireWake && !isAwakeRef.current
                ? "Say 'Hey SUZIE' or double-clap to activate..."
                : isListening
                ? "Listening for directive..."
                : "Type a directive..."
            }
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
);

export default VoiceCommand;
