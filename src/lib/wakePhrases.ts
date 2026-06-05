export function isWakePhrase(text: string): boolean {
  const t = text.toLowerCase().trim();
  const name = "(suzie|suzi|suzy|suzey|susie|susi|susee|susy)";
  return new RegExp(`\\b(hey\\s+)?${name}\\b`, "i").test(t);
}
