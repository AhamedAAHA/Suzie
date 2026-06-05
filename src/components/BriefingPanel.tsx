"use client";

import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, AlertTriangle } from "lucide-react";
import { GlobalEvent } from "@/types";

interface BriefingPanelProps {
  briefing: string;
  selectedEvent: GlobalEvent | null;
}

const RISK_DOT: Record<string, string> = {
  critical: "bg-red-400",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-cyan-400",
  monitoring: "bg-blue-400",
};

const RISK_TEXT: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-cyan-400",
  monitoring: "text-blue-400",
};

// Highlight risk-severity keywords with the SUZIE color scale.
const HIGHLIGHTS: { re: RegExp; cls: string }[] = [
  { re: /\b(critical|severe|emergency|crisis)\b/gi, cls: "text-red-400 font-semibold" },
  { re: /\b(high|elevated|surge|spike|disruption)\b/gi, cls: "text-orange-400 font-semibold" },
  { re: /\b(moderate|watch|monitor(?:ing)?)\b/gi, cls: "text-cyan-400 font-semibold" },
  { re: /\b(stable|low|nominal|calm)\b/gi, cls: "text-green-400 font-semibold" },
];

function HighlightedText({ text }: { text: string }) {
  const matches: { start: number; end: number; cls: string }[] = [];
  for (const { re, cls } of HIGHLIGHTS) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, cls });
    }
  }
  matches.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((mt, i) => {
    if (mt.start < cursor) return;
    if (mt.start > cursor) parts.push(<Fragment key={`t${i}`}>{text.slice(cursor, mt.start)}</Fragment>);
    parts.push(<span key={`h${i}`} className={mt.cls}>{text.slice(mt.start, mt.end)}</span>);
    cursor = mt.end;
  });
  if (cursor < text.length) parts.push(<Fragment key="end">{text.slice(cursor)}</Fragment>);

  return <>{parts}</>;
}

export default function BriefingPanel({ briefing, selectedEvent }: BriefingPanelProps) {
  const [open, setOpen] = useState(true);
  const [eventOpen, setEventOpen] = useState(true);

  return (
    <div className="space-y-3">
      {/* Briefing section */}
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 group"
        >
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="font-display text-[11px] tracking-[0.15em] text-cyan-400 uppercase">SUZIE Briefing</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 ml-auto transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="max-h-44 overflow-y-auto scroll-cyber mt-2 pr-1">
                <p className="text-[13px] text-gray-300 leading-relaxed">
                  {briefing ? <HighlightedText text={briefing} /> : "Awaiting global intelligence scan..."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected event section */}
      {selectedEvent && (
        <div className="border-t border-cyan-400/10 pt-3">
          <button
            onClick={() => setEventOpen((o) => !o)}
            className="w-full flex items-center gap-2"
          >
            <span className={`w-2 h-2 rounded-full ${RISK_DOT[selectedEvent.riskLevel]} animate-pulse`} />
            <span className="font-display text-[10px] tracking-[0.12em] text-gray-300 uppercase truncate">
              Focus Event
            </span>
            <span className={`font-display text-[9px] tracking-wider uppercase ${RISK_TEXT[selectedEvent.riskLevel]}`}>
              {selectedEvent.riskLevel}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 ml-auto transition-transform ${eventOpen ? "" : "-rotate-90"}`} />
          </button>
          <AnimatePresence initial={false}>
            {eventOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2">
                  <p className="text-[13px] font-semibold text-gray-200">{selectedEvent.title}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{selectedEvent.description}</p>
                  <div className="space-y-1">
                    {selectedEvent.rippleEffects.map((r) => (
                      <p key={r} className="text-[11px] text-orange-400/80 flex gap-1.5">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {r}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
