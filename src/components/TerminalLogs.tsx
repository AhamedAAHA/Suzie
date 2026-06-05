"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TerminalLogsProps {
  logs: string[];
  maxHeight?: string;
}

export default function TerminalLogs({ logs, maxHeight = "120px" }: TerminalLogsProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div
      className="terminal-text bg-black/40 border border-gray-800/50 rounded-lg p-3 overflow-y-auto font-mono"
      style={{ maxHeight }}
    >
      <AnimatePresence>
        {logs.map((log, i) => (
          <motion.div
            key={`${log}-${i}`}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${
              log.includes("ALERT") || log.includes("CRITICAL")
                ? "text-red-400"
                : log.includes("SUZIE ONLINE")
                ? "text-green-400"
                : log.includes("VOICE")
                ? "text-cyan-400"
                : "text-gray-500"
            }`}
          >
            {log}
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
