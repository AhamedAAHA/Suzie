"use client";

import { motion } from "framer-motion";

export type WakeState = "idle" | "listening" | "online" | "thinking" | "speaking";

const STATE_CONFIG: Record<
  WakeState,
  { label: string; color: string; glow: string; ring: string }
> = {
  idle: {
    label: "IDLE",
    color: "rgba(0,240,255,0.4)",
    glow: "rgba(0,240,255,0.1)",
    ring: "rgba(0,240,255,0.15)",
  },
  listening: {
    label: "LISTENING",
    color: "rgba(0,240,255,1)",
    glow: "rgba(0,240,255,0.5)",
    ring: "rgba(0,240,255,0.4)",
  },
  online: {
    label: "ONLINE",
    color: "rgba(48,209,88,0.95)",
    glow: "rgba(48,209,88,0.45)",
    ring: "rgba(48,209,88,0.3)",
  },
  thinking: {
    label: "THINKING",
    color: "rgba(255,149,0,0.95)",
    glow: "rgba(255,149,0,0.4)",
    ring: "rgba(255,149,0,0.3)",
  },
  speaking: {
    label: "SPEAKING",
    color: "rgba(10,132,255,0.95)",
    glow: "rgba(10,132,255,0.45)",
    ring: "rgba(10,132,255,0.3)",
  },
};

interface SuzieStatusOrbProps {
  state: WakeState;
  className?: string;
  showLabel?: boolean;
}

export default function SuzieStatusOrb({
  state,
  className = "",
  showLabel = true,
}: SuzieStatusOrbProps) {
  const cfg = STATE_CONFIG[state];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center w-8 h-8">
        {/* Outer pulse ring — active states only */}
        {(state === "listening" || state === "speaking" || state === "online") && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `1px solid ${cfg.ring}` }}
            animate={{ scale: [1, 1.9, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        )}

        {/* Second ring for listening */}
        {state === "listening" && (
          <motion.div
            className="absolute inset-1 rounded-full"
            style={{ border: `1px solid ${cfg.ring}` }}
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: 0.4 }}
          />
        )}

        {/* Core orb */}
        <motion.div
          className="w-3 h-3 rounded-full relative z-10"
          style={{
            background: cfg.color,
            boxShadow: `0 0 16px ${cfg.glow}, 0 0 6px ${cfg.color}`,
          }}
          animate={
            state === "idle"
              ? { scale: [1, 1.06, 1], opacity: [0.45, 0.75, 0.45] }
              : state === "thinking"
              ? { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }
              : { scale: 1, opacity: 1 }
          }
          transition={{
            duration: state === "idle" ? 3.2 : 0.75,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {showLabel && (
        <span
          className="font-display text-[9px] tracking-[0.22em] uppercase"
          style={{ color: cfg.color }}
        >
          {cfg.label}
        </span>
      )}
    </div>
  );
}
