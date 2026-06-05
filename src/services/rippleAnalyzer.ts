import { buildRippleChain, generatePrediction } from "@/services/aimlService";
import { GlobalEvent, RippleNode } from "@/types";

export function analyzeRipple(scenario: string): {
  chain: RippleNode[];
  prediction: ReturnType<typeof generatePrediction>;
  summary: string;
} {
  const chain = buildRippleChain(scenario);
  const prediction = generatePrediction(scenario);

  const summary = `Ripple analysis for "${scenario}": ${chain.length}-stage impact chain detected. Peak impact at "${chain[0]?.label}". Final downstream effect: "${chain[chain.length - 1]?.label}". Confidence: 82%.`;

  return { chain, prediction, summary };
}

export function analyzeEventRipple(event: GlobalEvent): RippleNode[] {
  return event.rippleEffects.map((effect, i) => ({
    id: `ripple-${event.id}-${i}`,
    label: effect,
    impact: 100 - i * 15,
    category: event.categories[i % event.categories.length] ?? "general",
  }));
}

export function simulateWhatIf(scenario: string): string[] {
  const { chain } = analyzeRipple(scenario);
  return chain.map((node, i) => `${i + 1}. ${node.label} (impact: ${node.impact}%)`);
}
