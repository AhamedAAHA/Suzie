"use client";

import { useEffect } from "react";
import { useSuzieStore } from "@/store/suzieStore";
import { detectNewCrises } from "@/services/crisisDetector";
import { speakAlert } from "@/lib/speech";

export default function SuzieProvider({ children }: { children: React.ReactNode }) {
  const silentWatch = useSuzieStore((s) => s.silentWatch);
  const events = useSuzieStore((s) => s.events);
  const addLog = useSuzieStore((s) => s.addLog);
  const userName = useSuzieStore((s) => s.userMemory.name);

  useEffect(() => {
    if (!silentWatch) return;

    const interval = setInterval(() => {
      const newCrises = detectNewCrises(events, events);
      if (newCrises.length > 0) {
        const msg = `Alert ${userName}. A new global event may affect your construction material prices.`;
        addLog(`ALERT: ${newCrises[0].title}`);
        speakAlert(msg);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [silentWatch, events, addLog, userName]);

  return <>{children}</>;
}
