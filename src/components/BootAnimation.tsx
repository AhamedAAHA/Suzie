"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import SuzieLogo from "./SuzieLogo";
import ClapDetector from "./ClapDetector";
import VoiceCommand from "./VoiceCommand";
import { useSuzieStore } from "@/store/suzieStore";
import { speakGreeting } from "@/lib/speech";

interface BootAnimationProps {
  onComplete: () => void;
}

export default function BootAnimation({ onComplete }: BootAnimationProps) {
  const [phase, setPhase] = useState<"listen" | "booting" | "online">("listen");
  const micEnabled = true;
  const wakingRef = useRef(false);
  const wakeUp = useSuzieStore((s) => s.wakeUp);
  const addLog = useSuzieStore((s) => s.addLog);
  const userName = useSuzieStore((s) => s.userMemory.name);
  const setOnline = useSuzieStore((s) => s.setOnline);

  const handleWake = useCallback(
    (source: "clap" | "voice") => {
      if (wakingRef.current || phase !== "listen") return;
      wakingRef.current = true;

      setPhase("booting");
      wakeUp();
      addLog(source === "clap" ? "Clap detected - SUZIE awakening..." : "Voice wake detected - SUZIE awakening...");

      setTimeout(() => {
        setPhase("online");
        setOnline(true);
        const hour = new Date().getHours();
        const greeting =
          hour < 12
            ? `Good morning ${userName}. SUZIE is online. I scanned global signals. Three major risks need your attention today. Shall I brief you?`
            : hour < 17
            ? `Good afternoon ${userName}. Global monitoring is active. Construction material risk is currently moderate.`
            : `Welcome back ${userName}. Since your last session, six new global events were detected.`;

        speakGreeting(greeting);
        addLog("Voice greeting delivered");

        setTimeout(onComplete, 2000);
      }, 2500);
    },
    [phase, wakeUp, addLog, userName, setOnline, onComplete]
  );

  useEffect(() => {
    addLog("Boot sequence initiated - listening for clap and voice");
  }, [addLog]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030712] grid-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px bg-cyan-400/10"
            style={{ left: `${(i / 20) * 100}%`, height: "100%" }}
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2 + i * 0.2, repeat: Infinity }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-8 z-10 px-4 max-w-lg w-full"
      >
        <Link href="/" aria-label="Go to main page">
          <motion.div
            animate={
              phase === "booting" || micEnabled
                ? { filter: ["drop-shadow(0 0 10px rgba(0,240,255,0.25))", "drop-shadow(0 0 28px rgba(0,240,255,0.5))", "drop-shadow(0 0 10px rgba(0,240,255,0.25))"] }
                : undefined
            }
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <SuzieLogo className="w-56 sm:w-64" />
          </motion.div>
        </Link>

        <AnimatePresence mode="wait">
          {phase === "listen" && (
            <motion.div
              key="listen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6 w-full"
            >
              <h2 className="sr-only">SUZIE AI</h2>
              <p className="text-gray-400 text-sm tracking-wide">
                Clap twice or say &quot;Hey Suzie&quot; to activate
              </p>

              <ClapDetector onClap={() => handleWake("clap")} enabled={micEnabled} />
              <VoiceCommand
                autoStart
                enabled={micEnabled}
                onWake={() => handleWake("voice")}
                onCommand={() => {}}
              />

              <p className="text-[10px] text-gray-600 font-mono">Allow microphone when prompted</p>
            </motion.div>
          )}

          {phase === "booting" && (
            <motion.div
              key="booting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="text-cyan-400 font-mono text-sm space-y-1">
                {[
                  "INITIALIZING NEURAL CORE...",
                  "SCANNING GLOBAL SIGNALS...",
                  "LOADING RISK MATRICES...",
                  "CONNECTING DATA FEEDS...",
                ].map((line, i) => (
                  <motion.p
                    key={line}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                    className="text-left"
                  >
                    <span className="text-green-400 mr-2">{">"}</span>
                    {line}
                  </motion.p>
                ))}
              </div>
              <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5 }}
                />
              </div>
            </motion.div>
          )}

          {phase === "online" && (
            <motion.div
              key="online"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.h1
                className="text-4xl font-black neon-text-cyan tracking-[0.3em]"
                animate={{
                  textShadow: [
                    "0 0 10px rgba(0,240,255,0.5)",
                    "0 0 30px rgba(0,240,255,0.8)",
                    "0 0 10px rgba(0,240,255,0.5)",
                  ],
                }}
                transition={{ duration: 1, repeat: 2 }}
              >
                SUZIE ONLINE
              </motion.h1>
              <p className="text-green-400 font-mono text-sm mt-2">ALL SYSTEMS NOMINAL</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
