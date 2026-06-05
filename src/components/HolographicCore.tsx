"use client";

import { motion } from "framer-motion";
import { AICoreState } from "@/store/suzieStore";

interface HolographicCoreProps {
  state: AICoreState;
  speaking?: boolean;
  size?: number;
}

const STATE_COLOR: Record<AICoreState, string> = {
  idle: "#00f0ff",
  listening: "#0a84ff",
  thinking: "#00f0ff",
  analyzing: "#00f0ff",
  warning: "#ff2d55",
  success: "#30d158",
};

const STATE_LABEL: Record<AICoreState, string> = {
  idle: "IDLE",
  listening: "LISTENING",
  thinking: "THINKING",
  analyzing: "ANALYZING",
  warning: "WARNING",
  success: "SUCCESS",
};

export default function HolographicCore({ state, speaking = false, size = 190 }: HolographicCoreProps) {
  const color = STATE_COLOR[state];

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        className="relative rounded-full"
        style={{ width: size, height: size }}
        animate={speaking ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 0.9, repeat: speaking ? Infinity : 0 }}
      >
        {[0, 1, 2].map((ring) => (
          <motion.div
            key={ring}
            className="absolute inset-0 rounded-full border"
            style={{
              margin: -14 * (ring + 1),
              borderColor: `${color}55`,
            }}
            animate={{
              rotate: 360,
              opacity: state === "warning" ? [0.3, 0.85, 0.3] : [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 7 + ring * 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

        {/* Data streams while analyzing */}
        {state === "analyzing" && (
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className="data-stream-line"
                style={{
                  left: `${(i / 12) * 100}%`,
                  height: "140%",
                  animationDuration: `${2 + (i % 4) * 0.8}s`,
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Core sphere */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${color}, #0a1c34 52%, #030712)`,
            boxShadow: `0 0 40px ${color}66, 0 0 90px ${color}22, inset 0 0 30px ${color}44`,
          }}
          animate={
            state === "warning"
              ? { filter: ["brightness(1)", "brightness(1.25)", "brightness(1)"] }
              : state === "success"
              ? { filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"] }
              : { rotate: [0, 5, 0, -5, 0] }
          }
          transition={{
            duration: state === "warning" || state === "success" ? 0.8 : 6,
            repeat: Infinity,
          }}
        />

        {/* Scanning beams */}
        {(state === "listening" || state === "analyzing") && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <motion.div
              className="absolute w-full h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute h-full w-[2px]"
              style={{ background: `linear-gradient(180deg, transparent, ${color}, transparent)` }}
              animate={{ left: ["0%", "100%"] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}

        {/* Audio reactive arcs */}
        {speaking && (
          <div className="absolute -inset-8 pointer-events-none">
            {[0, 1, 2, 3].map((n) => (
              <motion.div
                key={n}
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: `${color}55` }}
                animate={{ scale: [0.8, 1.35], opacity: [0.9, 0] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: n * 0.25,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
      <div className="mt-3 text-center">
        <p className="font-display text-[10px] tracking-[0.25em]" style={{ color }}>
          SUZIE HOLOGRAPHIC CORE
        </p>
        <p className="font-terminal text-[10px] text-gray-500 mt-0.5">{STATE_LABEL[state]}</p>
      </div>
    </div>
  );
}
