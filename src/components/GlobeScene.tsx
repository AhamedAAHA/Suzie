"use client";

import { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls, Stars, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countries110m from "world-atlas/countries-110m.json";
import { GlobalEvent } from "@/types";
import { mockShippingRoutes } from "@/data/mockGlobalEvents";

const RISK_COLORS: Record<string, string> = {
  critical: "#ff2d55",
  high: "#ff9500",
  medium: "#ffd60a",
  low: "#0a84ff",
  monitoring: "#00f0ff",
};

interface BoundaryMesh {
  type: "MultiLineString";
  coordinates: number[][][];
}

const COUNTRY_LABELS = [
  { name: "Sri Lanka", lat: 7.9, lng: 80.7 },
  { name: "India", lat: 22.8, lng: 79.2 },
  { name: "China", lat: 35.8, lng: 104.1 },
  { name: "Saudi Arabia", lat: 24.1, lng: 45.1 },
  { name: "Yemen", lat: 15.6, lng: 47.5 },
  { name: "Ukraine", lat: 49.0, lng: 31.3 },
  { name: "Netherlands", lat: 52.1, lng: 5.3 },
  { name: "Panama", lat: 8.5, lng: -80.0 },
  { name: "Singapore", lat: 1.3, lng: 103.8 },
  { name: "UAE", lat: 24.4, lng: 54.3 },
];

const ROUTE_COLORS: Record<string, string> = {
  blocked: "#ff2d55",
  delayed: "#ff9500",
  active: "#00f0ff",
};

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function CountryBorders() {
  const borderLines = useMemo(() => {
    const topology = countries110m as unknown as Topology<{
      countries: GeometryCollection;
    }>;
    const borders = mesh(
      topology,
      topology.objects.countries,
      (a, b) => a !== b
    ) as unknown as BoundaryMesh;

    return borders.coordinates
      .map((lineString) =>
        lineString.map(([lng, lat]) => latLngToVec3(lat, lng, 2.018))
      )
      .filter((points) => points.length > 1);
  }, []);

  return (
    <group>
      {borderLines.map((points, i) => (
        <Line
          key={`country-${i}`}
          points={points}
          color="#7df9ff"
          transparent
          opacity={0.42}
          lineWidth={0.65}
        />
      ))}
    </group>
  );
}

function GlobeRings() {
  const equator = useMemo(
    () => Array.from({ length: 145 }, (_, i) => latLngToVec3(0, -180 + i * 2.5, 2.035)),
    []
  );
  const tropicNorth = useMemo(
    () => Array.from({ length: 145 }, (_, i) => latLngToVec3(23.5, -180 + i * 2.5, 2.025)),
    []
  );
  const tropicSouth = useMemo(
    () => Array.from({ length: 145 }, (_, i) => latLngToVec3(-23.5, -180 + i * 2.5, 2.025)),
    []
  );

  return (
    <>
      <Line points={equator} color="#00f0ff" transparent opacity={0.32} lineWidth={1} />
      <Line points={tropicNorth} color="#0a84ff" transparent opacity={0.18} lineWidth={0.5} />
      <Line points={tropicSouth} color="#0a84ff" transparent opacity={0.18} lineWidth={0.5} />
    </>
  );
}

function RoutePulse({ curve, color, offset }: { curve: THREE.QuadraticBezierCurve3; color: string; offset: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 0.16 + offset) % 1;
    ref.current?.position.copy(curve.getPoint(t));
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.025, 10, 10]} />
      <meshBasicMaterial color={color} />
      <pointLight color={color} intensity={0.35} distance={0.55} />
    </mesh>
  );
}

function Globe({ events }: { events: GlobalEvent[] }) {
  const globeRef = useRef<THREE.Group>(null);
  const rippleRefs = useRef<THREE.Mesh[]>([]);
  const routes = mockShippingRoutes;

  useFrame((_, delta) => {
    if (globeRef.current) globeRef.current.rotation.y += delta * 0.08;
    rippleRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const scale = 1 + Math.sin(Date.now() * 0.003 + i) * 0.3;
        mesh.scale.setScalar(scale);
        (mesh.material as THREE.MeshBasicMaterial).opacity =
          0.4 + Math.sin(Date.now() * 0.004 + i) * 0.3;
      }
    });
  });

  const routeCurves = useMemo(
    () =>
      routes.map((route) => {
        const from = latLngToVec3(route.from.lat, route.from.lng, 2.06);
        const to = latLngToVec3(route.to.lat, route.to.lng, 2.06);
        const mid = from.clone().add(to).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(2.82);
        return {
          route,
          curve: new THREE.QuadraticBezierCurve3(from, mid, to),
          color: ROUTE_COLORS[route.status] ?? "#00f0ff",
        };
      }),
    [routes]
  );

  return (
    <group ref={globeRef}>
      <Sphere args={[2, 96, 96]}>
        <meshPhongMaterial
          color="#071426"
          emissive="#001a33"
          emissiveIntensity={0.38}
          wireframe={false}
          transparent
          opacity={0.94}
        />
      </Sphere>

      <CountryBorders />
      <GlobeRings />

      {/* Wireframe overlay */}
      <Sphere args={[2.01, 32, 32]}>
        <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.045} />
      </Sphere>

      {/* Atmosphere glow */}
      <Sphere args={[2.15, 32, 32]}>
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.04} side={THREE.BackSide} />
      </Sphere>

      {/* Event markers */}
      {events.map((evt, i) => {
        const pos = latLngToVec3(evt.lat, evt.lng, 2.05);
        const color = RISK_COLORS[evt.riskLevel] ?? "#00f0ff";
        return (
          <group key={evt.id} position={pos}>
            <mesh>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color={color} />
            </mesh>
            <mesh
              ref={(el) => { if (el) rippleRefs.current[i] = el; }}
            >
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>
            <pointLight color={color} intensity={0.5} distance={0.5} />
            <Html center distanceFactor={8} className="pointer-events-none">
              <div className="rounded border border-cyan-400/30 bg-[#030712]/80 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-cyan-100 shadow-[0_0_12px_rgba(0,240,255,0.18)]">
                {evt.country}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Country and port labels */}
      {COUNTRY_LABELS.map((label) => (
        <Html key={label.name} position={latLngToVec3(label.lat, label.lng, 2.08)} center distanceFactor={9} className="pointer-events-none">
          <div className="whitespace-nowrap text-[8px] font-mono uppercase tracking-wider text-cyan-300/75">
            {label.name}
          </div>
        </Html>
      ))}

      {/* Shipping routes */}
      {routeCurves.map(({ route, curve, color }, i) => {
        const points = curve.getPoints(50);
        return (
          <group key={route.id}>
            <Line
              points={points}
              color={color}
              transparent
              opacity={route.status === "active" ? 0.42 : 0.68}
              lineWidth={route.status === "blocked" ? 1.7 : 1.1}
            />
            <RoutePulse curve={curve} color={color} offset={i * 0.23} />
            <Html position={points[Math.floor(points.length / 2)]} center distanceFactor={8} className="pointer-events-none">
              <div className="rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-cyan-200/80">
                {route.status} {route.delayHours ? `${route.delayHours}h` : ""}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function Scene({ events }: { events: GlobalEvent[] }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00f0ff" />
      <pointLight position={[-10, -5, -10]} intensity={0.5} color="#ff2d55" />
      <Stars radius={100} depth={50} count={3000} factor={3} fade speed={0.5} />
      <Globe events={events} />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

interface GlobeSceneProps {
  events: GlobalEvent[];
  className?: string;
}

export default function GlobeScene({ events, className = "" }: GlobeSceneProps) {
  return (
    <div className={`relative ${className}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} style={{ background: "transparent" }}>
        <Suspense fallback={null}>
          <Scene events={events} />
        </Suspense>
      </Canvas>
      <div className="absolute inset-0 pointer-events-none scan-line" />
    </div>
  );
}
