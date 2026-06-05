"use client";

import { motion } from "framer-motion";
import { AICoreState } from "@/store/suzieStore";

interface HolographicCoreProps {
  state: AICoreState;
  speaking?: boolean;
  size?: number;
  showLabel?: boolean;
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
  const coreBase = "#00d7ff";
  const danger = state === "warning";
  const success = state === "success";

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
              margin: -10 * (ring + 1),
              borderColor: `${color}40`,
            }}
            animate={{
              rotate: 360,
              opacity: danger ? [0.2, 0.7, 0.2] : [0.16, 0.45, 0.16],
            }}
            transition={{
              duration: 8 + ring * 2.5,
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
            background: `radial-gradient(circle at 35% 35%, ${coreBase}, #0a1c34 52%, #030712)`,
            boxShadow: `0 0 26px ${color}44, 0 0 56px ${color}22, inset 0 0 18px ${coreBase}50`,
          }}
          animate={
            danger
              ? { filter: ["brightness(1)", "brightness(1.25)", "brightness(1)"] }
              : success
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
              style={{ background: `linear-gradient(90deg, transparent, ${coreBase}, transparent)` }}
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute h-full w-[2px]"
              style={{ background: `linear-gradient(180deg, transparent, ${coreBase}, transparent)` }}
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
                style={{ borderColor: `${coreBase}45` }}
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
      <div className="mt-1 text-center">
        <p className="font-terminal text-[9px] px-2 py-0.5 rounded border border-cyan-400/20 bg-black/45 text-cyan-300/85 tracking-wider">
          {STATE_LABEL[state]}
        </p>
      </div>
    </div>
  );
}
