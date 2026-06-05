"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { useSuzieStore } from "@/store/suzieStore";

interface VoiceCommandProps {
  onCommand?: (transcript: string) => void;
  enabled?: boolean;
}

export default function VoiceCommand({ onCommand, enabled = true }: VoiceCommandProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const addLog = useSuzieStore((s) => s.addLog);

  const processCommand = useCallback(
    (text: string) => {
      const lower = text.toLowerCase();
      setTranscript(text);
      addLog(`VOICE: "${text}"`);
      onCommand?.(text);

      if (lower.includes("hey suzie") || lower.includes("hi suzie")) {
        useSuzieStore.getState().wakeUp();
      }
    },
    [onCommand, addLog]
  );

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        }
      }
      if (final) processCommand(final.trim());
    };

    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, [enabled, processCommand]);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      addLog("Voice recognition activated");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <motion.button
        onClick={toggle}
        className={`p-2 rounded-lg border transition-all ${
          isListening
            ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
            : "border-gray-700 text-gray-400 hover:border-cyan-400/50"
        }`}
        whileTap={{ scale: 0.95 }}
        animate={isListening ? { boxShadow: ["0 0 0px rgba(0,240,255,0)", "0 0 15px rgba(0,240,255,0.4)", "0 0 0px rgba(0,240,255,0)"] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
      </motion.button>

      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && transcript && processCommand(transcript)}
          placeholder='Say "Hey Suzie" or type a command...'
          className="w-full bg-transparent border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-400/50 font-mono"
        />
      </div>
    </div>
  );
}
