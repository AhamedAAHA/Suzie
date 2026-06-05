"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, Stars, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { GlobalEvent } from "@/types";
import { mockShippingRoutes } from "@/data/mockGlobalEvents";

const RISK_COLORS: Record<string, string> = {
  critical: "#ff2d55",
  high: "#ff9500",
  medium: "#ffd60a",
  low: "#0a84ff",
  monitoring: "#00f0ff",
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

function Globe({ events }: { events: GlobalEvent[] }) {
  const globeRef = useRef<THREE.Mesh>(null);
  const rippleRefs = useRef<THREE.Mesh[]>([]);

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

  const routes = mockShippingRoutes;

  return (
    <group>
      <Sphere ref={globeRef} args={[2, 64, 64]}>
        <meshPhongMaterial
          color="#0a1628"
          emissive="#001a33"
          emissiveIntensity={0.3}
          wireframe={false}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Wireframe overlay */}
      <Sphere args={[2.01, 32, 32]}>
        <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.08} />
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
          </group>
        );
      })}

      {/* Shipping routes */}
      {routes.map((route) => {
        const from = latLngToVec3(route.from.lat, route.from.lng, 2.05);
        const to = latLngToVec3(route.to.lat, route.to.lng, 2.05);
        const mid = from.clone().add(to).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(2.8);
        const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
        const points = curve.getPoints(50);
        const color = route.status === "blocked" ? "#ff2d55" : route.status === "delayed" ? "#ff9500" : "#00f0ff";
        return (
          <Line
            key={route.id}
            points={points}
            color={color}
            transparent
            opacity={0.5}
            lineWidth={1}
          />
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
