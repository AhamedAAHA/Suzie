"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Loader2 } from "lucide-react";
import { IntelligenceReport } from "@/types";

interface ReportGeneratorProps {
  onGenerate: () => Promise<IntelligenceReport>;
  reports: IntelligenceReport[];
}

export default function ReportGenerator({ onGenerate, reports }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate();
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (report: IntelligenceReport) => {
    const content = `
SUZIE AI — GLOBAL INTELLIGENCE REPORT
Generated: ${new Date(report.generatedAt).toLocaleString()}
${"=".repeat(50)}

EVENT SUMMARY:
${report.eventSummary}

AFFECTED COUNTRIES: ${report.affectedCountries.join(", ")}
RISK SCORE: ${report.riskScore}/100

RIPPLE CHAIN:
${report.rippleChain.map((r, i) => `${i + 1}. ${r}`).join("\n")}

PREDICTIONS:
- 24 Hours: ${report.prediction.hours24}
- 7 Days: ${report.prediction.days7}
- 30 Days: ${report.prediction.days30}
- 6 Months: ${report.prediction.months6}

RECOMMENDATIONS:
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

BRIEFING:
${report.briefing}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suzie-report-${report.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <motion.button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 transition-all disabled:opacity-50"
        whileTap={{ scale: 0.98 }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        {loading ? "Generating Report..." : "Generate Intelligence Report"}
      </motion.button>

      {reports.map((report) => (
        <motion.div
          key={report.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-cyan-400">{report.title}</h3>
            <button
              onClick={() => downloadReport(report)}
              className="p-1.5 rounded border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/30"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-gray-400 line-clamp-2">{report.eventSummary}</p>
          <div className="flex gap-2 text-[10px]">
            <span className="text-red-400 font-mono">Risk: {report.riskScore}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">{report.affectedCountries.join(", ")}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
