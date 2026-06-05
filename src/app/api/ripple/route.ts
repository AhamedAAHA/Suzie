import { NextRequest, NextResponse } from "next/server";
import { analyzeRipple } from "@/services/rippleAnalyzer";

export async function POST(req: NextRequest) {
  const { scenario } = await req.json();
  if (!scenario) return NextResponse.json({ error: "scenario required" }, { status: 400 });
  const result = analyzeRipple(scenario);
  return NextResponse.json(result);
}
