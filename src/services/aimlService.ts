import { env, hasAiml } from "@/lib/env";
import { GlobalEvent, IntelligenceReport, PredictionTimeline, RippleNode } from "@/types";

type AIMLRole = "system" | "user" | "assistant";

async function callAIML(
  messages: { role: AIMLRole; content: string }[],
  model?: string
): Promise<string> {
  if (!hasAiml()) return "";

  try {
    const res = await fetch(`${env.aiml.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.aiml.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model ?? env.aiml.models.analysis,
        messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("AIML error:", res.status, err.slice(0, 200));
      return "";
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    console.error("AIML call failed:", err);
    return "";
  }
}

export async function generateBriefing(
  events: GlobalEvent[],
  userName: string
): Promise<string> {
  const topEvents = events
    .filter((e) => e.riskLevel === "critical" || e.riskLevel === "high")
    .slice(0, 5);

  const context = topEvents.map((e) => ({
    title: e.title,
    country: e.country,
    risk: e.riskLevel,
    categories: e.categories,
    effects: e.rippleEffects,
  }));

  const aiBrief = await callAIML(
    [
      {
        role: "system",
        content:
          "You are SUZIE, a Jarvis-style global intelligence AI. Give a concise, professional spoken briefing (3-5 sentences). Focus on construction, supply chain, and Sri Lanka impacts when relevant.",
      },
      {
        role: "user",
        content: `Brief ${userName} on these live global events: ${JSON.stringify(context)}`,
      },
    ],
    env.aiml.models.world
  );

  if (aiBrief) return aiBrief;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Welcome back";

  if (topEvents.length === 0) {
    return `${greeting} ${userName}. SUZIE is online. Global risk levels are stable. No critical alerts at this time.`;
  }

  const primary = topEvents[0];
  return `${greeting} ${userName}. SUZIE is online. I scanned global signals. ${topEvents.length} major risks need your attention today. Highest priority: ${primary.title} in ${primary.country}. This may affect ${primary.categories.join(", ").replace(/_/g, " ")}. Shall I brief you?`;
}

export async function explainRippleEffect(event: GlobalEvent): Promise<string> {
  const ai = await callAIML(
    [
      { role: "system", content: "Explain global ripple effects concisely with construction/QS impact." },
      {
        role: "user",
        content: `Explain ripple effects of: ${event.title}. Chain: ${event.rippleEffects.join(" → ")}`,
      },
    ],
    env.aiml.models.analysis
  );
  if (ai) return ai;
  return `${event.title} creates a ripple chain: ${event.rippleEffects.join(" → ")}. Construction and supply chain sectors in South Asia face elevated risk.`;
}

export function buildRippleChain(scenario: string): RippleNode[] {
  const scenarios: Record<string, RippleNode[]> = {
    oil: [
      { id: "1", label: "Oil price rise +20%", impact: 100, category: "fuel" },
      { id: "2", label: "Transport cost +15%", impact: 85, category: "logistics" },
      { id: "3", label: "Material shipping +12%", impact: 72, category: "supply_chain" },
      { id: "4", label: "Cement/Steel cost +8%", impact: 65, category: "construction" },
      { id: "5", label: "BOQ budget overrun +5-7%", impact: 55, category: "finance" },
      { id: "6", label: "Project delay risk +3 weeks", impact: 45, category: "schedule" },
    ],
    china: [
      { id: "1", label: "China stops steel exports", impact: 100, category: "trade" },
      { id: "2", label: "Global steel shortage", impact: 90, category: "supply_chain" },
      { id: "3", label: "Steel prices +25%", impact: 80, category: "commodity" },
      { id: "4", label: "Construction projects delayed", impact: 70, category: "construction" },
      { id: "5", label: "Sri Lanka import costs surge", impact: 60, category: "local" },
    ],
    port: [
      { id: "1", label: "Major port closure", impact: 100, category: "shipping" },
      { id: "2", label: "Vessel rerouting +10 days", impact: 85, category: "logistics" },
      { id: "3", label: "Container rates +30%", impact: 75, category: "freight" },
      { id: "4", label: "Import delays cascade", impact: 65, category: "supply_chain" },
      { id: "5", label: "Material shortages on site", impact: 50, category: "construction" },
    ],
    rain: [
      { id: "1", label: "Heavy rain — Sri Lanka", impact: 100, category: "climate" },
      { id: "2", label: "Quarry & sand mining halt", impact: 80, category: "materials" },
      { id: "3", label: "Transport routes flooded", impact: 70, category: "logistics" },
      { id: "4", label: "Construction sites shut down", impact: 60, category: "construction" },
      { id: "5", label: "Project timeline +2-4 weeks", impact: 45, category: "schedule" },
    ],
  };

  const lower = scenario.toLowerCase();
  if (lower.includes("oil")) return scenarios.oil;
  if (lower.includes("china")) return scenarios.china;
  if (lower.includes("port")) return scenarios.port;
  if (lower.includes("rain") || lower.includes("sri lanka")) return scenarios.rain;
  return scenarios.oil;
}

export function generatePrediction(scenario = "stable"): PredictionTimeline {
  const lower = scenario.toLowerCase();
  if (lower.includes("rain") || lower.includes("flood") || lower.includes("weather")) {
    return {
      hours24: "Local site exposure rises. Outdoor work, delivery timing, and drainage risks need immediate review.",
      days7: "Transport delays and site productivity losses may appear if severe weather continues.",
      days30: "Material stock buffers and subcontractor schedules should be rebalanced around weather downtime.",
      months6: "Persistent climate disruption may increase contingency allowances and insurance scrutiny.",
    };
  }

  return {
    hours24: "Initial market reaction. Freight surcharges applied. Supply chain alerts issued.",
    days7: "Material price adjustments visible. Import lead times extend. BOQ reviews triggered.",
    days30: "Sustained cost pressure on construction sector. Project margins compress 3-7%.",
    months6: "Structural supply chain shifts. Long-term contract renegotiations. Regional diversification.",
  };
}

export async function generateReport(
  events: GlobalEvent[],
  userName: string
): Promise<IntelligenceReport> {
  const top = events[0];
  const briefing = await generateBriefing(events, userName);

  const aiRecs = await callAIML(
    [
      { role: "system", content: "Return exactly 5 actionable recommendations as a JSON array of strings." },
      {
        role: "user",
        content: `Recommendations for QS/construction given: ${events.slice(0, 3).map((e) => e.title).join(", ")}`,
      },
    ],
    env.aiml.models.analysis
  );

  let recommendations = [
    "Review BOQ material allowances for steel and cement",
    "Consider alternative shipping routes via Singapore hub",
    "Accelerate procurement for critical-path materials",
    "Monitor Red Sea corridor daily for route changes",
    "Activate contingency budget for 5-7% cost overrun",
  ];

  try {
    const parsed = JSON.parse(aiRecs);
    if (Array.isArray(parsed) && parsed.length > 0) recommendations = parsed.slice(0, 5).map(String);
  } catch {
    // keep defaults
  }

  return {
    id: `report-${Date.now()}`,
    title: `Global Intelligence Report — ${new Date().toLocaleDateString()}`,
    generatedAt: new Date().toISOString(),
    eventSummary: top
      ? `${top.title}: ${top.description}`
      : "Global conditions stable with moderate risk levels.",
    affectedCountries: top ? [top.country, "Sri Lanka", "India", "Global"] : ["Global"],
    riskScore: 67,
    rippleChain: top?.rippleEffects ?? ["No critical chain detected"],
    prediction: generatePrediction(top?.title ?? "stable"),
    recommendations,
    briefing,
  };
}

function isSmallTalk(query: string): boolean {
  const q = query.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  const patterns = [
    "can you hear me", "do you hear me", "are you there", "are you online",
    "you there", "hello", "hi", "hey", "good morning", "good afternoon",
    "good evening", "how are you", "what is your name", "who are you",
    "thank you", "thanks", "test", "testing", "are you awake", "wake up",
  ];
  return patterns.some((p) => q === p || q.startsWith(p + " ") || q.endsWith(" " + p) || q.includes(p));
}

function smallTalkReply(query: string): string {
  const q = query.toLowerCase();
  const name = env.user.name;
  if (q.includes("hear me") || q.includes("you there") || q.includes("are you online") || q.includes("are you awake")) {
    return `Signal confirmed, ${name}. Neural link stable. All channels open. Awaiting directive.`;
  }
  if (q.includes("your name") || q.includes("who are you")) {
    return `SUZIE — Strategic Unified Intelligence Engine. Global threat analyst, supply chain monitor, and mission control for ${name}. At your service.`;
  }
  if (q.includes("how are you")) {
    return `All subsystems nominal. Neural load at optimal capacity. Threat matrix clear. Ready for deployment, ${name}.`;
  }
  if (q.includes("thank")) {
    return `Acknowledged, ${name}. Neural link remains open. Standing by.`;
  }
  if (q.includes("test")) {
    return `Loud and clear, ${name}. Voice channel active. Transmission quality: optimal. Issue your directive.`;
  }
  if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
    return `SUZIE online, ${name}. Neural link established. Global threat matrix loaded. Ready for your directive.`;
  }
  if (q.includes("good morning") || q.includes("good afternoon") || q.includes("good evening")) {
    return `${name}. SUZIE online. Threat index compiled. Operations queue standing by. What's your first directive?`;
  }
  return `Neural link active, ${name}. SUZIE standing by. Issue a directive — global risks, supply chains, construction intel, or mission control.`;
}

export async function answerVoiceQuery(query: string, events: GlobalEvent[]): Promise<string> {
  if (isSmallTalk(query)) {
    return smallTalkReply(query);
  }

  const eventContext = events
    .slice(0, 8)
    .map((e) => `${e.title} (${e.country}, ${e.riskLevel})`)
    .join("; ");

  const ai = await callAIML(
    [
      {
        role: "system",
        content:
          `You are SUZIE (Strategic Unified Intelligence Engine), a tactical AI assistant for ${env.user.name}. ` +
          "Respond in 1-3 concise spoken sentences. Use a professional, hacker/military tone — direct, precise, no filler. " +
          "Say 'acknowledged', 'confirmed', 'directive received', 'threat detected', 'signal clear', 'neural link active' style phrases where natural. " +
          "Answer the user's ACTUAL question directly. Never recite news unless asked. " +
          "Only reference global risks, construction, supply chains, or Sri Lanka when explicitly asked.",
      },
      {
        role: "user",
        content:
          `User said: "${query}".` +
          (eventContext
            ? `\n\nBackground intel (reference ONLY if relevant to their question): ${eventContext}`
            : ""),
      },
    ],
    env.aiml.models.chat
  );
  if (ai) return ai;

  const lower = query.toLowerCase();
  if (lower.includes("risk") && lower.includes("sri lanka")) {
    return "Sri Lanka faces elevated risk from Red Sea shipping disruption affecting steel imports, monsoon flooding impacting construction schedules, and fuel price increases raising transport costs. Overall local construction risk: HIGH.";
  }
  if (lower.includes("oil")) {
    return "Oil price impact chain: OPEC+ cuts maintain elevated crude. This increases diesel costs ~15%, raising transport and machinery operating expenses. Construction material delivered costs rise 8-12%.";
  }
  if (lower.includes("supply chain")) {
    return "Supply chain risk elevated. Red Sea disruption forces Cape rerouting adding ~12 days. Container freight up. Steel and cement imports to Sri Lanka most affected.";
  }
  if (lower.includes("disaster")) {
    const disasters = events.filter((e) => e.type === "climate_disaster" || e.type === "war");
    return `Active disaster zones: ${disasters.map((d) => `${d.country} (${d.riskLevel})`).join(", ")}. Monitor for supply chain and construction impacts.`;
  }
  if (lower.includes("construction")) {
    return "Construction mode activated. Steel, cement, and diesel costs elevated. Review BOQ contingency and accelerate critical-path procurement.";
  }
  if (isSmallTalk(query)) return smallTalkReply(query);
  return `I heard you ${env.user.name}, but I'd need a bit more detail. Try asking about global risks, supply chains, fuel, or construction impacts.`;
}

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer | null> {
  if (!hasAiml()) return null;

  try {
    const res = await fetch(`${env.aiml.baseUrl}/tts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.aiml.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.aiml.tts.model,
        text: text.slice(0, 500),
        voice: env.aiml.tts.voice,
        speed: env.aiml.tts.speed,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}
