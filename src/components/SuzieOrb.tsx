"use client";

import { motion } from "framer-motion";

interface SuzieOrbProps {
  size?: number;
  active?: boolean;
  pulsing?: boolean;
  onClick?: () => void;
}

export default function SuzieOrb({ size = 120, active = false, pulsing = false, onClick }: SuzieOrbProps) {
  return (
    <motion.div
      className="relative cursor-pointer"
      style={{ width: size, height: size }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute inset-0 rounded-full border border-cyan-400/20"
          style={{ margin: -ring * 12 }}
          animate={active ? { rotate: 360, opacity: [0.3, 0.6, 0.3] } : {}}
          transition={{ duration: 4 + ring * 2, repeat: Infinity, ease: "linear" }}
        />
      ))}

      {/* Core orb */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: active
            ? "radial-gradient(circle at 35% 35%, #00f0ff, #0066ff 50%, #001a33)"
            : "radial-gradient(circle at 35% 35%, #1a3a5c, #0a1628 60%, #030712)",
          boxShadow: active
            ? "0 0 40px rgba(0,240,255,0.6), 0 0 80px rgba(0,240,255,0.2), inset 0 0 20px rgba(0,240,255,0.3)"
            : "0 0 20px rgba(0,240,255,0.2)",
        }}
        animate={pulsing ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Inner highlight */}
      <div
        className="absolute rounded-full bg-white/20 blur-sm"
        style={{ width: size * 0.25, height: size * 0.15, top: "20%", left: "25%" }}
      />

      {/* Scan line */}
      {active && (
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ clipPath: "circle(50%)" }}
        >
          <motion.div
            className="absolute w-full h-0.5 bg-cyan-400/60"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      )}

      {/* Status dot */}
      <div
        className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-black ${
          active ? "bg-green-400 shadow-[0_0_8px_#30d158]" : "bg-gray-600"
        }`}
      />
    </motion.div>
  );
}
