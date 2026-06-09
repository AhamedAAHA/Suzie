"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import SuzieStatusOrb, { WakeState } from "./SuzieStatusOrb";

interface WakeWordListenerProps {
  wakeState: WakeState;
  wakeLogs: string[];
  /** Whether the voice gate is currently locked (waiting for wake word / clap). */
  gateLocked?: boolean;
}

export default function WakeWordListener({
  wakeState,
  wakeLogs,
  gateLocked = false,
}: WakeWordListenerProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [wakeLogs]);

  return (
    <div className="space-y-2">
      {/* State row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-display text-[9px] text-gray-600 tracking-[0.18em] uppercase">
            Wake State
          </p>
          {/* Gate status pill */}
          <motion.span
            key={String(gateLocked)}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`font-terminal text-[7px] px-1.5 py-0.5 rounded border tracking-widest ${
              gateLocked
                ? "border-red-500/40 text-red-400/80"
                : "border-green-400/40 text-green-400/80"
            }`}
          >
            {gateLocked ? "LOCKED" : "ACTIVE"}
          </motion.span>
        </div>
        <SuzieStatusOrb state={wakeState} />
      </div>

      {/* Locked hint */}
      {gateLocked && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-terminal text-[8px] text-gray-600 text-center"
        >
          <span className="text-cyan-400/50">&ldquo;Hey SUZIE&rdquo;</span>
          {" "}or{" "}
          <span className="text-cyan-400/50">double-clap</span>
          {" "}to establish neural link
        </motion.p>
      )}

      {/* Waveform — shown when listening or speaking */}
      {(wakeState === "listening" || wakeState === "speaking") && (
        <div className="flex items-center justify-center gap-[3px] h-5">
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-[3px] rounded-full"
              style={{
                background:
                  wakeState === "speaking"
                    ? "rgba(10,132,255,0.85)"
                    : "rgba(0,240,255,0.85)",
              }}
              animate={{ height: ["3px", `${7 + Math.sin(i) * 8}px`, "3px"] }}
              transition={{
                duration: 0.25 + (i % 4) * 0.08,
                repeat: Infinity,
                delay: i * 0.04,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Wake log lines */}
      <div className="space-y-0.5 max-h-10 overflow-hidden">
        {wakeLogs.slice(-3).map((line, i) => (
          <p
            key={i}
            className="font-terminal text-[9px] text-green-400/65 truncate"
          >
            {line}
          </p>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
