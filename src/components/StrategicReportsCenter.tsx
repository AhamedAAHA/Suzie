"use client";

import { FileBarChart2 } from "lucide-react";
import { IntelligenceReport } from "@/types";

interface Props {
  reports: IntelligenceReport[];
}

export default function StrategicReportsCenter({ reports }: Props) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileBarChart2 className="w-4 h-4 text-cyan-400" />
        <h3 className="font-display text-[11px] tracking-[0.15em] text-cyan-400 uppercase">Strategic Reports Center</h3>
      </div>
      {reports.length === 0 ? (
        <p className="text-sm text-gray-500">No strategic reports generated yet.</p>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto scroll-cyber pr-1">
          {reports.map((r) => (
            <div key={r.id} className="rounded-lg border border-cyan-400/20 bg-black/20 p-3">
              <p className="text-sm text-gray-200">{r.title}</p>
              <p className="text-[11px] text-gray-500">{new Date(r.generatedAt).toLocaleString()}</p>
              <p className="text-sm text-gray-300 mt-1">{r.eventSummary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
