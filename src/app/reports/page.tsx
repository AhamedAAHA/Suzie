"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import ReportGenerator from "@/components/ReportGenerator";
import { useSuzieStore } from "@/store/suzieStore";
import { generateReport } from "@/services/aimlService";

export default function ReportsPage() {
  const events = useSuzieStore((s) => s.events);
  const reports = useSuzieStore((s) => s.reports);
  const userMemory = useSuzieStore((s) => s.userMemory);
  const addReport = useSuzieStore((s) => s.addReport);
  const addLog = useSuzieStore((s) => s.addLog);

  const handleGenerate = async () => {
    try {
      const res = await fetch("/api/reports", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        addReport(data.report);
        addLog(`Intelligence report generated: ${data.report.title}`);
        return data.report;
      }
    } catch {
      // fall through
    }
    const report = await generateReport(events, userMemory.name);
    addReport(report);
    addLog(`Intelligence report generated: ${report.title}`);
    return report;
  };

  return (
    <div className="min-h-screen pt-16 px-6 pb-8 grid-bg">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold neon-text-cyan tracking-wider">INTELLIGENCE REPORTS</h1>
          </div>
          <p className="text-sm text-gray-500">AI-generated global intelligence briefings and risk assessments</p>
        </motion.div>

        <ReportGenerator onGenerate={handleGenerate} reports={reports} />

        {reports.length === 0 && (
          <div className="glass-panel p-8 text-center">
            <p className="text-sm text-gray-500">No reports generated yet. Click above to create your first intelligence report.</p>
          </div>
        )}

        {reports.map((report) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel p-6 space-y-4"
          >
            <h2 className="text-sm font-bold text-cyan-400">{report.title}</h2>
            <div className="space-y-3 text-xs text-gray-400">
              <div>
                <p className="text-[10px] text-gray-600 uppercase mb-1">Event Summary</p>
                <p>{report.eventSummary}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase mb-1">Ripple Chain</p>
                {report.rippleChain.map((r, i) => (
                  <p key={r} className="text-orange-400/80">{i + 1}. {r}</p>
                ))}
              </div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase mb-1">Recommendations</p>
                {report.recommendations.map((r, i) => (
                  <p key={r}>{i + 1}. {r}</p>
                ))}
              </div>
              <div className="border-t border-gray-800 pt-3">
                <p className="text-[10px] text-cyan-400 uppercase mb-1">SUZIE Briefing</p>
                <p className="text-gray-300">{report.briefing}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
