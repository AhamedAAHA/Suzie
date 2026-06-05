export function isWakePhrase(text: string): boolean {
  const t = text.toLowerCase().trim();
  return (
    t.includes("hey suzie") ||
    t.includes("hi suzie") ||
    t.includes("ok suzie") ||
    t.includes("wake up suzie") ||
    t.includes("activate suzie") ||
    /\bsuzie\b/.test(t) ||
    t.includes("activate")
  );
}
