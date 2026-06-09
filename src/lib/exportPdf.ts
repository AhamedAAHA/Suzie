import { IntelAnalysis } from "@/types";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function exportAnalysisPdf(analysis: IntelAnalysis): void {
  if (typeof window === "undefined") return;

  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return;

  const list = (items: string[]) =>
    items.map((i) => `<li>${esc(i)}</li>`).join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(analysis.title)}</title>
<style>
  @import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Rajdhani:wght@400;500;600&family=JetBrains+Mono&display=swap");
  * { box-sizing: border-box; }
  body { font-family: "Rajdhani", sans-serif; color: #0b1b2b; margin: 0; padding: 40px; background: #fff; }
  h1 { font-family: "Orbitron", sans-serif; font-size: 22px; letter-spacing: 2px; color: #006d7a; margin: 0 0 4px; }
  h2 { font-family: "Orbitron", sans-serif; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; color: #0a84ff; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin: 24px 0 8px; }
  .meta { font-family: "JetBrains Mono", monospace; font-size: 11px; color: #64748b; margin-bottom: 8px; }
  .badge { display: inline-block; font-family: "Orbitron"; font-size: 12px; padding: 3px 10px; border-radius: 6px; color: #fff; }
  ul, ol { margin: 4px 0; padding-left: 20px; } li { margin: 3px 0; font-size: 14px; }
  p { font-size: 14px; line-height: 1.5; }
  .grid { display: flex; gap: 24px; flex-wrap: wrap; }
  .pred { border-left: 3px solid #0a84ff; padding-left: 10px; margin: 6px 0; }
  .pred b { font-family: "Orbitron"; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td, th { text-align: left; padding: 4px 6px; border-bottom: 1px solid #e2e8f0; }
  .foot { margin-top: 30px; font-family: "JetBrains Mono"; font-size: 10px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <h1>${esc(analysis.title)}</h1>
  <div class="meta">SUZIE GLOBAL INTELLIGENCE · Generated ${new Date(analysis.generatedAt).toLocaleString()} · Query: "${esc(analysis.query)}"</div>
  <span class="badge" style="background:${analysis.riskScore >= 80 ? "#ff2d55" : analysis.riskScore >= 60 ? "#ff9500" : analysis.riskScore >= 40 ? "#d4a000" : "#0099a8"}">
    RISK ${analysis.riskScore}/100 — ${esc(analysis.riskLabel)}
  </span>

  <h2>AI Summary</h2>
  <p>${esc(analysis.summary)}</p>

  <h2>Impact Analysis</h2>
  <ul>${list(analysis.impact)}</ul>

  <h2>Predictions</h2>
  <div class="pred"><b>24 Hours</b><br/>${esc(analysis.prediction.hours24)}</div>
  <div class="pred"><b>7 Days</b><br/>${esc(analysis.prediction.days7)}</div>
  <div class="pred"><b>30 Days</b><br/>${esc(analysis.prediction.days30)}</div>
  <div class="pred"><b>6 Months</b><br/>${esc(analysis.prediction.months6)}</div>

  <h2>Recommendations</h2>
  <ol>${list(analysis.recommendations)}</ol>

  <h2>Construction Impact (Sector Risk ${analysis.construction.overallRisk}/100)</h2>
  <table>
    <tr><th>Material</th><th>Price</th><th>Change</th><th>Delay</th></tr>
    ${analysis.construction.materials
      .map((m) => `<tr><td>${esc(m.name)}</td><td>$${m.currentPrice.toFixed(0)}/${esc(m.unit)}</td><td>${m.changePercent > 0 ? "+" : ""}${m.changePercent.toFixed(1)}%</td><td>+${m.delayDays}d</td></tr>`)
      .join("")}
  </table>

  <h2>Sources</h2>
  <ul>${analysis.sources.map((s) => `<li><b>${esc(s.label)}</b> — ${esc(s.detail)}</li>`).join("")}</ul>

  <h2>Related Events</h2>
  <ul>${analysis.relatedEvents.map((e) => `<li>${esc(e.title)} (${esc(e.country)}, ${esc(e.riskLevel)})</li>`).join("")}</ul>

  <div class="foot">SUZIE AI v1.0 — GLOBAL INTELLIGENCE SYSTEM — CLASSIFIED</div>
  <script>window.onload = function() { setTimeout(function(){ window.print(); }, 400); };</script>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}
