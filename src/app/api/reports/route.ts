import { NextResponse } from "next/server";
import { generateReport } from "@/services/aimlService";
import { scanGlobalNews } from "@/services/globalNewsScanner";
import { saveReport, loadReports } from "@/services/supabaseService";
import { env } from "@/lib/env";

export async function GET() {
  const reports = await loadReports();
  return NextResponse.json({ reports });
}

export async function POST() {
  const events = await scanGlobalNews();
  const report = await generateReport(events, env.user.name);
  await saveReport(report);
  return NextResponse.json({ report });
}
