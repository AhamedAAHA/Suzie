"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { WakeState } from "./SuzieStatusOrb";
import { AICoreState } from "@/store/suzieStore";

// ─── Types & state config ─────────────────────────────────────────────────────
type StateRef = React.MutableRefObject<WakeState>;

interface StateCfg {
  r: number; g: number; b: number;
  intensity: number;
  speed: number;
}

// speed = wireframe/orbit rotation only — kept slow but visibly moving
const CFG: Record<WakeState, StateCfg> = {
  idle:     { r:0.04, g:0.52, b:1.00, intensity:0.48, speed:0.18 },
  listening:{ r:0.00, g:0.94, b:1.00, intensity:0.88, speed:0.32 },
  online:   { r:0.00, g:0.77, b:1.00, intensity:0.72, speed:0.24 },
  thinking: { r:0.25, g:0.50, b:1.00, intensity:1.00, speed:0.48 },
  speaking: { r:0.00, g:0.67, b:1.00, intensity:1.00, speed:0.58 },
};

const STATUS_HEX: Record<WakeState, string> = {
  idle:     "#0a84ff",
  listening:"#00f0ff",
  online:   "#00c4ff",
  thinking: "#4080ff",
  speaking: "#00aeff",
};

const STATUS_LABEL: Record<WakeState, string> = {
  idle:     "STANDBY",
  listening:"LISTENING",
  online:   "ONLINE",
  thinking: "PROCESSING",
  speaking: "TRANSMIT",
};

const AI_STATUS_TEXT: Partial<Record<AICoreState, string>> = {
  analyzing: "SCANNING GLOBAL EVENTS",
  warning:   "ANOMALY DETECTED",
  success:   "BRIEFING COMPLETE",
};

// ─── Wireframe Geometric Core ─────────────────────────────────────────────────
// Three nested polyhedra rotating at different speeds — hacker wireframe feel
function WireframeCore({ sr }: { sr: StateRef }) {
  const r1 = useRef<THREE.Mesh>(null);  // icosahedron  (outer)
  const r2 = useRef<THREE.Mesh>(null);  // octahedron   (middle)
  const r3 = useRef<THREE.Mesh>(null);  // dodecahedron (inner)
  const col    = useRef(new THREE.Color(0.04, 0.52, 1.00));
  const tmpCol = useMemo(() => new THREE.Color(), []);
  const inten  = useRef(0.48);

  useFrame((_, dt) => {
    const c = CFG[sr.current];
    tmpCol.setRGB(c.r, c.g, c.b);
    col.current.lerp(tmpCol, dt * 2.5);
    inten.current = THREE.MathUtils.lerp(inten.current, c.intensity, dt * 2);
    const s = c.speed;

    // Random glitch kick on high-intensity states
    const glitch = c.intensity > 0.95 && Math.random() < 0.02;

    if (r1.current) {
      r1.current.rotation.x += dt * s * 0.055 + (glitch ? (Math.random() - 0.5) * 0.12 : 0);
      r1.current.rotation.y += dt * s * 0.085;
      r1.current.rotation.z += dt * s * 0.032;
      const m = r1.current.material as THREE.MeshBasicMaterial;
      m.color.copy(col.current);
      m.opacity = 0.13 + inten.current * 0.17;
    }
    if (r2.current) {
      r2.current.rotation.x -= dt * s * 0.105;
      r2.current.rotation.y -= dt * s * 0.068;
      r2.current.rotation.z += dt * s * 0.048;
      const m = r2.current.material as THREE.MeshBasicMaterial;
      m.color.copy(col.current);
      m.opacity = 0.24 + inten.current * 0.26;
    }
    if (r3.current) {
      r3.current.rotation.x += dt * s * 0.165 + (glitch ? (Math.random() - 0.5) * 0.18 : 0);
      r3.current.rotation.y -= dt * s * 0.130;
      r3.current.rotation.z -= dt * s * 0.078;
      const m = r3.current.material as THREE.MeshBasicMaterial;
      m.color.copy(col.current);
      m.opacity = 0.42 + inten.current * 0.36;
    }
  });

  return (
    <>
      {/* Outer — icosahedron */}
      <mesh ref={r1}>
        <icosahedronGeometry args={[1.50, 1]} />
        <meshBasicMaterial wireframe color="#0a84ff" transparent opacity={0.16}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Middle — octahedron */}
      <mesh ref={r2}>
        <octahedronGeometry args={[1.07, 2]} />
        <meshBasicMaterial wireframe color="#0a84ff" transparent opacity={0.26}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Inner — dodecahedron */}
      <mesh ref={r3}>
        <dodecahedronGeometry args={[0.63, 0]} />
        <meshBasicMaterial wireframe color="#0a84ff" transparent opacity={0.45}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  );
}

// ─── Matrix Data Rain — falling particles in vertical columns ─────────────────
const N_RAIN = 1200;
function DataRain({ sr }: { sr: StateRef }) {
  const ref    = useRef<THREE.Points>(null);
  const col    = useRef(new THREE.Color(0.04, 0.52, 1.00));
  const tmpCol = useMemo(() => new THREE.Color(), []);

  const { geo, velArr } = useMemo(() => {
    const pos = new Float32Array(N_RAIN * 3);
    const vel = new Float32Array(N_RAIN);
    for (let i = 0; i < N_RAIN; i++) {
      const colIdx = (i % 26) - 13;
      pos[i * 3]     = colIdx * 0.20 + (Math.random() - 0.5) * 0.04;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * 2.8;
      pos[i * 3 + 2] = -2.0 + Math.random() * 1.0;
      vel[i] = 0.4 + Math.random() * 1.6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo: g, velArr: vel };
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const c = CFG[sr.current];
    tmpCol.setRGB(c.r, c.g, c.b);
    col.current.lerp(tmpCol, dt * 2);
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.color.copy(col.current);
    mat.opacity = 0.20 + c.intensity * 0.22;
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr  = attr.array as Float32Array;
    for (let i = 0; i < N_RAIN; i++) {
      // Rain fall speed is independent of rotation speed so the HUD never looks frozen
      arr[i * 3 + 1] -= dt * velArr[i] * 0.22;
      if (arr[i * 3 + 1] < -2.8) arr[i * 3 + 1] = 2.8;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.020} transparent opacity={0.28}
        blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

// ─── Scan Pulse — expanding concentric rings ──────────────────────────────────
function ScanPulse({ offset, sr }: { offset: number; sr: StateRef }) {
  const ref    = useRef<THREE.Mesh>(null);
  const col    = useRef(new THREE.Color(0.04, 0.52, 1.00));
  const tmpCol = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    const c = CFG[sr.current];
    tmpCol.setRGB(c.r, c.g, c.b);
    col.current.lerp(tmpCol, dt * 2);
    const t = ((clock.elapsedTime * 0.20 + offset) % 3.0) / 3.0;
    ref.current.scale.setScalar(0.35 + t * 2.4);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.color.copy(col.current);
    mat.opacity = (1 - t) * c.intensity * 0.30;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[1.0, 0.005, 4, 72]} />
      <meshBasicMaterial transparent opacity={0}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

// ─── Orbital Data — ring of bright particles orbiting the core ───────────────
const N_ORBS = 140;
function OrbitalData({ sr }: { sr: StateRef }) {
  const ref    = useRef<THREE.Points>(null);
  const col    = useRef(new THREE.Color(0.00, 0.94, 1.00));
  const tmpCol = useMemo(() => new THREE.Color(), []);

  const { geo, phaseArr, radiArr, spdArr } = useMemo(() => {
    const pos   = new Float32Array(N_ORBS * 3);
    const phase = new Float32Array(N_ORBS);
    const radi  = new Float32Array(N_ORBS);
    const spd   = new Float32Array(N_ORBS);
    for (let i = 0; i < N_ORBS; i++) {
      phase[i] = (i / N_ORBS) * Math.PI * 2;
      radi[i]  = 1.58 + Math.random() * 0.42;
      spd[i]   = 0.35 + Math.random() * 1.10;
      pos[i * 3]     = Math.cos(phase[i]) * radi[i];
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.90;
      pos[i * 3 + 2] = Math.sin(phase[i]) * radi[i];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo: g, phaseArr: phase, radiArr: radi, spdArr: spd };
  }, []);

  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    const c = CFG[sr.current];
    tmpCol.setRGB(c.r, c.g, c.b);
    col.current.lerp(tmpCol, dt * 3);
    const t = clock.elapsedTime;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.color.copy(col.current);
    mat.opacity = 0.45 + c.intensity * 0.45;
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr  = attr.array as Float32Array;
    for (let i = 0; i < N_ORBS; i++) {
      const a = phaseArr[i] + t * spdArr[i] * 0.09;
      const r = radiArr[i];
      const tilt = (i % 4) * Math.PI * 0.22;
      arr[i * 3]     = Math.cos(a) * r;
      arr[i * 3 + 1] = Math.sin(a * 0.7) * Math.sin(tilt) * r * 0.30;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.048} transparent opacity={0.65}
        blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

// ─── Grid Floor — receding perspective wireframe plane ───────────────────────
function GridFloor({ sr }: { sr: StateRef }) {
  const ref    = useRef<THREE.Mesh>(null);
  const col    = useRef(new THREE.Color(0.04, 0.52, 1.00));
  const tmpCol = useMemo(() => new THREE.Color(), []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const c = CFG[sr.current];
    tmpCol.setRGB(c.r, c.g, c.b);
    col.current.lerp(tmpCol, dt * 1.5);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.color.copy(col.current);
    mat.opacity = 0.05 + c.intensity * 0.06;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2.1, 0, 0]} position={[0, -1.75, -0.4]}>
      <planeGeometry args={[10, 10, 22, 22]} />
      <meshBasicMaterial wireframe transparent opacity={0.06}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

// ─── Scene — composes all 3D elements ────────────────────────────────────────
function Scene({ state }: { state: WakeState }) {
  const sr = useRef<WakeState>(state);
  sr.current = state;

  return (
    <>
      <GridFloor sr={sr} />
      <DataRain sr={sr} />
      <WireframeCore sr={sr} />
      <OrbitalData sr={sr} />
      <ScanPulse offset={0.00} sr={sr} />
      <ScanPulse offset={1.00} sr={sr} />
      <ScanPulse offset={2.00} sr={sr} />
    </>
  );
}

// ─── Matrix Rain Canvas Overlay ───────────────────────────────────────────────
const RAIN_CHARS = "01アイウエオABCDEF0123456789∑∆ΩΨ∇";

function MatrixRainCanvas({ hexRef }: { hexRef: React.MutableRefObject<string> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const parent = el.parentElement;
    el.width  = parent?.clientWidth  ?? 400;
    el.height = parent?.clientHeight ?? 300;

    const W = el.width;
    const H = el.height;
    const COLS = Math.floor(W / 13);
    const drops = Array.from({ length: COLS }, () => Math.floor(Math.random() * (-H)));

    const tick = () => {
      ctx.fillStyle = "rgba(0,0,0,0.045)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = "10px monospace";
      // hexRef.current is a 7-char hex like "#0a84ff"; appending "44" gives 8-digit hex with ~27% alpha
      ctx.fillStyle = hexRef.current + "44";
      for (let i = 0; i < COLS; i++) {
        const ch = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
        ctx.fillText(ch, i * 13, drops[i]);
        if (drops[i] > H && Math.random() > 0.974) drops[i] = 0;
        drops[i] += 13;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.32, mixBlendMode: "screen" }}
    />
  );
}

// ─── HUD cycling readouts ─────────────────────────────────────────────────────
const SYS_LINES: [string, string][] = [
  ["NET_IO",  "↑1.4MB ↓6.2MB"],
  ["CIPHER",  "AES-256-GCM:OK"],
  ["PROCESS", "SUZIE_CORE.SYS"],
  ["THREAD",  "0xA4F2-ACTIVE"],
  ["HEAP",    "2.4GB / 8.0GB"],
  ["API_KEY", "VALID:EXP+90d"],
];

// ─── Corner bracket decoration ────────────────────────────────────────────────
function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute w-3 h-3 pointer-events-none";
  const border = "border-blue-500/40";
  const styles: Record<string, string> = {
    tl: `${base} top-0 left-0 border-t border-l ${border}`,
    tr: `${base} top-0 right-0 border-t border-r ${border}`,
    bl: `${base} bottom-0 left-0 border-b border-l ${border}`,
    br: `${base} bottom-0 right-0 border-b border-r ${border}`,
  };
  return <div className={styles[pos]} />;
}

// ─── Main HoloCore export ─────────────────────────────────────────────────────
interface HoloCoreProps {
  wakeState: WakeState;
  aiCoreState?: AICoreState;
  className?: string;
}

export default function HoloCore({ wakeState, aiCoreState, className = "" }: HoloCoreProps) {
  const hex    = STATUS_HEX[wakeState];
  const label  = (aiCoreState && AI_STATUS_TEXT[aiCoreState]) ?? STATUS_LABEL[wakeState];
  const hexRef = useRef(hex);
  useEffect(() => { hexRef.current = hex; }, [hex]);

  const [hudIdx, setHudIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setHudIdx(i => (i + 1) % SYS_LINES.length), 1600);
    return () => clearInterval(id);
  }, []);

  const load = wakeState === "thinking" ? 97 : wakeState === "speaking" ? 84 : wakeState === "listening" ? 71 : 48;

  return (
    <div className={`relative flex flex-col h-full select-none overflow-hidden ${className}`}>

      {/* Matrix rain canvas — behind everything */}
      <MatrixRainCanvas hexRef={hexRef} />

      {/* Scanline sweep */}
      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none z-10"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${hex}55 50%, transparent 100%)` }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
      />

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="relative z-20 flex items-center justify-between px-3 pt-2 pb-1 shrink-0">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: hex, boxShadow: `0 0 8px ${hex}` }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.85, repeat: Infinity }}
          />
          <span className="font-terminal text-[9px] tracking-[0.22em] uppercase" style={{ color: hex }}>
            SUZIE // NEURAL CORE v4.7.1
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.span
            className="font-terminal text-[8px] px-1.5 py-0.5 rounded border shrink-0"
            style={{ color: hex, borderColor: hex + "50", background: hex + "12" }}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.3, repeat: Infinity }}
          >
            {label}
          </motion.span>
          {["TLS", "SYN", "ACK"].map(t => (
            <span key={t} className="font-terminal text-[6px] text-gray-700 border border-gray-800 px-1 py-0.5 rounded hidden sm:inline">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── Three.js Canvas ─────────────────────────────────────── */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 0.25, 3.8], fov: 50 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ background: "transparent", position: "absolute", inset: 0 }}
          dpr={[1, 1.5]}
        >
          <Scene state={wakeState} />
        </Canvas>

        {/* Corner brackets */}
        <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

        {/* Top-right HUD cycling readout */}
        <div className="absolute top-1.5 right-2 z-20 pointer-events-none text-right">
          <AnimatePresence mode="wait">
            <motion.div
              key={hudIdx}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22 }}
              className="font-terminal text-[7px] leading-[1.5]"
              style={{ color: hex + "95" }}
            >
              <span className="text-gray-600">{SYS_LINES[hudIdx][0]}:</span> {SYS_LINES[hudIdx][1]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom-left frequency readout */}
        <div className="absolute bottom-1.5 left-2 z-20 pointer-events-none">
          <div className="font-terminal text-[7px]" style={{ color: hex + "70" }}>
            {wakeState === "speaking"
              ? "FREQ: 440Hz | TX: ACTIVE"
              : wakeState === "listening"
              ? "FREQ: 22kHz | RX: ACTIVE"
              : "FREQ: -- | IDLE"}
          </div>
        </div>

        {/* Center state watermark */}
        <motion.div
          key={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.06 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
        >
          <span
            className="font-display text-[11px] tracking-[0.6em] uppercase"
            style={{ color: hex }}
          >
            {label}
          </span>
        </motion.div>
      </div>

      {/* ── Footer status bars ─────────────────────────────────── */}
      <div className="relative z-20 px-3 pb-2 pt-1 shrink-0 space-y-1.5">
        {/* Neural load bar */}
        <div className="flex items-center gap-2">
          <span className="font-terminal text-[6px] text-gray-600 w-11 shrink-0 tracking-wider">NEURAL</span>
          <div className="flex-1 h-px bg-gray-800 relative overflow-hidden rounded-full">
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${hex}70, ${hex})` }}
              animate={{
                width: wakeState === "thinking"  ? ["12%", "96%", "12%"] :
                       wakeState === "speaking"  ? ["38%", "82%", "38%"] :
                       wakeState === "listening" ? ["52%", "86%", "52%"] :
                                                   ["22%", "52%", "22%"],
              }}
              transition={{ duration: wakeState === "thinking" ? 0.7 : 1.6, repeat: Infinity }}
            />
          </div>
          <span className="font-terminal text-[6px] w-7 text-right shrink-0" style={{ color: hex }}>
            {load}%
          </span>
        </div>

        {/* Mini status bars */}
        <div className="flex gap-2">
          {(["SYS", "NET", "AI", "MEM"] as const).map((lbl, i) => {
            const vals = [72, 88, load, 61];
            return (
              <div key={lbl} className="flex-1">
                <div className="flex justify-between mb-0.5">
                  <span className="font-terminal text-[5px] text-gray-700 tracking-widest">{lbl}</span>
                  <span className="font-terminal text-[5px]" style={{ color: hex + "65" }}>{vals[i]}%</span>
                </div>
                <div className="h-px bg-gray-800 relative overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full"
                    style={{ background: hex + "90", width: `${vals[i]}%` }}
                    animate={{ opacity: [0.45, 1, 0.45] }}
                    transition={{ duration: 1.6 + i * 0.35, repeat: Infinity }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
