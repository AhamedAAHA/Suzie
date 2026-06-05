"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ClapDetectorProps {
  onClap: () => void;
  enabled?: boolean;
}

export default function ClapDetector({ onClap, enabled = true }: ClapDetectorProps) {
  const [listening, setListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(Array(32).fill(0));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const triggeredRef = useRef(false);
  const animRef = useRef<number>(0);

  const detectClap = useCallback(
    (data: Uint8Array) => {
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length;
      setVolume(avg);

      const bars = Array.from({ length: 32 }, (_, i) => {
        const idx = Math.floor((i / 32) * data.length);
        return data[idx] / 255;
      });
      setWaveform(bars);

      // Clap detection: sharp spike above threshold
      if (avg > 180 && !triggeredRef.current) {
        triggeredRef.current = true;
        onClap();
        setTimeout(() => { triggeredRef.current = false; }, 2000);
      }
    },
    [onClap]
  );

  useEffect(() => {
    if (!enabled) return;

    let stream: MediaStream | null = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new AudioContext();
        ctxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);
        analyserRef.current = analyser;
        setListening(true);

        const data = new Uint8Array(analyser.frequencyBinCount);
        function tick() {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);
          detectClap(data);
          animRef.current = requestAnimationFrame(tick);
        }
        tick();
      } catch {
        setListening(false);
      }
    }

    start();

    return () => {
      cancelAnimationFrame(animRef.current);
      stream?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close();
    };
  }, [enabled, detectClap]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-end gap-1 h-16">
        {waveform.map((v, i) => (
          <motion.div
            key={i}
            className="w-1.5 rounded-full bg-cyan-400/80"
            animate={{ height: Math.max(4, v * 64) }}
            transition={{ duration: 0.05 }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-2 h-2 rounded-full ${listening ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
        />
        <span className="text-cyan-400/70 font-mono text-xs">
          {listening ? "LISTENING FOR CLAP..." : "MIC ACCESS REQUIRED"}
        </span>
      </div>

      <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
          style={{ width: `${(volume / 255) * 100}%` }}
        />
      </div>
    </div>
  );
}
