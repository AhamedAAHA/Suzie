"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ClapDetectorProps {
  onClap: () => void;
  enabled?: boolean;
}

export default function ClapDetector({ onClap, enabled = true }: ClapDetectorProps) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(Array(32).fill(0));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const triggeredRef = useRef(false);
  const animRef = useRef<number>(0);
  const prevEnergyRef = useRef(0);
  const clapTimesRef = useRef<number[]>([]);
  const onClapRef = useRef(onClap);

  useEffect(() => {
    onClapRef.current = onClap;
  }, [onClap]);

  const detectClap = useCallback((timeData: Uint8Array) => {
    let sumSq = 0;
    let peak = 0;
    for (let i = 0; i < timeData.length; i++) {
      const amp = Math.abs(timeData[i] - 128);
      sumSq += amp * amp;
      if (amp > peak) peak = amp;
    }
    const rms = Math.sqrt(sumSq / timeData.length);
    setVolume(Math.min(100, rms * 2));

    const bars = Array.from({ length: 32 }, (_, i) => {
      const idx = Math.floor((i / 32) * timeData.length);
      return Math.abs(timeData[idx] - 128) / 128;
    });
    setWaveform(bars);

    const spike = rms - prevEnergyRef.current;
    prevEnergyRef.current = rms * 0.85;

    // Clap = sudden loud transient. Normal speech is usually sustained, so avoid peak-only triggers.
    const isClap =
      (peak > 72 && spike > 28 && rms > 18) ||
      (peak > 88 && spike > 20 && rms > 14);

    if (isClap && !triggeredRef.current) {
      const now = Date.now();
      clapTimesRef.current = [...clapTimesRef.current, now].filter((t) => now - t < 1200);

      if (clapTimesRef.current.length >= 2) {
        triggeredRef.current = true;
        clapTimesRef.current = [];
        onClapRef.current();
      }

      setTimeout(() => {
        triggeredRef.current = false;
      }, 900);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setListening(false);
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Microphone not supported in this browser");
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const ctx = new AudioContext();
        await ctx.resume();
        ctxRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.05;
        source.connect(analyser);
        analyserRef.current = analyser;
        setListening(true);
        setError(null);

        const data = new Uint8Array(analyser.fftSize);
        function tick() {
          if (!analyserRef.current || cancelled) return;
          analyserRef.current.getByteTimeDomainData(data);
          detectClap(data);
          animRef.current = requestAnimationFrame(tick);
        }
        tick();
      } catch (err) {
        setListening(false);
        setError(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Microphone permission denied — allow mic access in browser"
            : "Could not access microphone"
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animRef.current);
      stream?.getTracks().forEach((t) => t.stop());
      if (ctxRef.current?.state !== "closed") {
        ctxRef.current?.close();
      }
      ctxRef.current = null;
      analyserRef.current = null;
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
          {listening ? "LISTENING FOR CLAP..." : error ?? "WAITING FOR MIC..."}
        </span>
      </div>

      <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
          style={{ width: `${volume}%` }}
        />
      </div>
    </div>
  );
}
