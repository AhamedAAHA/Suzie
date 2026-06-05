"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TerminalSquare, ChevronRight } from "lucide-react";

interface IntelTerminalProps {
  logs: string[];
  commandHistory: string[];
  onCommand: (cmd: string) => void;
}

const SUGGESTIONS = ["scan sri lanka", "analyze supply chain", "predict fuel impact"];

function parseLog(raw: string): { time: string | null; body: string } {
  const match = raw.match(/^\[(.*?)\]\s*([\s\S]*)$/);
  if (match) return { time: match[1], body: match[2] };
  return { time: null, body: raw };
}

function bodyColor(body: string): string {
  const b = body.toUpperCase();
  if (b.includes("ALERT") || b.includes("CRITICAL") || b.includes("FAIL")) return "text-red-400";
  if (b.includes("SUZIE ONLINE") || b.includes("COMPLETE") || b.includes("NOMINAL") || b.includes("GENERATED")) return "text-green-400";
  if (b.includes("VOICE") || b.includes("SUZIE:") || b.startsWith(">")) return "text-cyan-300";
  if (b.includes("SCAN") || b.includes("ANALYZ") || b.includes("DETECT")) return "text-yellow-300";
  return "text-gray-400";
}

function TypedLine({ text }: { text: string }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [text]);
  return <>{shown}</>;
}

export default function IntelTerminal({ logs, commandHistory, onCommand }: IntelTerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [histIndex, setHistIndex] = useState<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const lastIndex = logs.length - 1;
  const parsed = useMemo(() => logs.map(parseLog), [logs]);

  const submit = () => {
    const cmd = input.trim();
    if (!cmd) return;
    onCommand(cmd);
    setInput("");
    setHistIndex(null);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const next = histIndex === null ? commandHistory.length - 1 : Math.max(0, histIndex - 1);
      setHistIndex(next);
      setInput(commandHistory[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIndex === null) return;
      const next = histIndex + 1;
      if (next >= commandHistory.length) {
        setHistIndex(null);
        setInput("");
      } else {
        setHistIndex(next);
        setInput(commandHistory[next] ?? "");
      }
    }
  };

  return (
    <div className="glass-panel hover-glow flex flex-col h-full overflow-hidden relative scan-sweep">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-cyan-400/15 bg-black/30">
        <TerminalSquare className="w-4 h-4 text-cyan-400" />
        <span className="font-display text-[11px] tracking-[0.18em] text-cyan-400 uppercase">
          Global Intelligence Terminal
        </span>
        <span className="ml-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-terminal text-[10px] text-green-400/80">LIVE</span>
        </span>
        <span className="ml-auto font-terminal text-[10px] text-gray-500">{logs.length} entries</span>
      </div>

      {/* Log feed */}
      <div className="flex-1 overflow-y-auto scroll-cyber px-4 py-3 font-terminal text-xs leading-relaxed bg-black/20">
        {parsed.map(({ time, body }, i) => (
          <motion.div
            key={`${i}-${body.slice(0, 12)}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2 whitespace-pre-wrap break-words"
          >
            {time && <span className="text-cyan-500/60 shrink-0 tabular-nums">[{time}]</span>}
            <span className={bodyColor(body)}>
              {i === lastIndex ? <TypedLine text={body} /> : body}
            </span>
          </motion.div>
        ))}
        <div className="flex gap-2">
          <span className="text-cyan-400">{">"}</span>
          <span className="w-2 h-4 bg-cyan-400 cursor-blink inline-block" />
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Command input */}
      <div className="border-t border-cyan-400/15 bg-black/40 px-4 py-2.5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="font-terminal text-[10px] text-gray-600">QUICK:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onCommand(s)}
              className="font-terminal text-[10px] px-2 py-0.5 rounded border border-cyan-400/25 text-cyan-300/80 hover:bg-cyan-400/10 hover:text-cyan-300 transition-colors"
            >
              {"> "}{s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Enter command — e.g. scan sri lanka, analyze supply chain..."
            className="flex-1 bg-transparent border-none outline-none font-terminal text-xs text-cyan-100 placeholder-gray-600"
            spellCheck={false}
          />
          <button
            onClick={submit}
            className="font-display text-[10px] tracking-wider px-3 py-1 rounded border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 transition-colors"
          >
            RUN
          </button>
        </div>
      </div>
    </div>
  );
}
