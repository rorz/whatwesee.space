"use client";

import { Float, MeshDistortMaterial, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

declare global {
  interface Window {
    margin_tide_render_to_text?: () => string;
    margin_tide_advance?: (steps: number) => void;
  }
}

type Gate = {
  id: number;
  color: string;
  position: [number, number, number];
  scale: number;
  seed: number;
};

const gateColors = ["#00e5ff", "#ff304f", "#ffe600", "#25ff74", "#ff7a00"];

function gateAt(id: number, point: THREE.Vector3, seed = id * 29): Gate {
  return {
    id,
    color: gateColors[Math.abs(seed) % gateColors.length],
    position: [point.x, -0.78, point.z],
    scale: 0.82 + (Math.abs(seed) % 5) * 0.08,
    seed,
  };
}

function TideGate({ gate, surge }: { gate: Gate; surge: number }) {
  const groupRef = useRef<THREE.Group | null>(null);
  const armRef = useRef<THREE.Group | null>(null);
  const vaneRef = useRef<THREE.Mesh | null>(null);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime + surge * 0.035;
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.8 + gate.seed) * 0.12;
      groupRef.current.position.y = gate.position[1] + Math.sin(time * 1.4 + gate.seed) * 0.045;
    }
    if (armRef.current) {
      armRef.current.rotation.z = Math.sin(time * 1.9 + gate.seed) * 0.65;
    }
    if (vaneRef.current) {
      vaneRef.current.rotation.y = time * (1.4 + gate.scale * 0.4);
      vaneRef.current.rotation.x = Math.sin(time * 2.2) * 0.22;
    }
  });

  return (
    <Float speed={1.25 + gate.scale * 0.35} rotationIntensity={0.25} floatIntensity={0.18}>
      <group ref={groupRef} position={gate.position} scale={gate.scale}>
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[0.36, 1.78, 0.22]} />
          <meshStandardMaterial color="#191a22" metalness={0.72} roughness={0.22} emissive={gate.color} emissiveIntensity={0.14} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.28, 32, 16]} />
          <MeshDistortMaterial color={gate.color} emissive={gate.color} emissiveIntensity={1.1} roughness={0.16} metalness={0.28} distort={0.34} speed={2.4} />
        </mesh>
        <group ref={armRef} position={[0, 0.72, 0.03]}>
          <mesh position={[0.38, 0, 0]}>
            <boxGeometry args={[0.92, 0.08, 0.1]} />
            <meshStandardMaterial color="#f2f4ff" emissive={gate.color} emissiveIntensity={0.46} roughness={0.3} />
          </mesh>
          <mesh ref={vaneRef} position={[0.88, 0, 0]}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color={gate.color} emissive={gate.color} emissiveIntensity={0.9} roughness={0.2} metalness={0.4} />
          </mesh>
        </group>
        <mesh rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[0.68, 0.025, 12, 80]} />
          <meshStandardMaterial color={gate.color} emissive={gate.color} emissiveIntensity={0.95} roughness={0.26} />
        </mesh>
      </group>
    </Float>
  );
}

function FloodRoom({
  gates,
  surge,
  onPlant,
}: {
  gates: Gate[];
  surge: number;
  onPlant: (point: THREE.Vector3) => void;
}) {
  const waterRef = useRef<THREE.Mesh | null>(null);
  const frameRefs = useRef<Array<THREE.Mesh | null>>([]);

  const frames = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => ({
        x: -3.4 + index * 0.76,
        phase: index * 0.57,
        color: index % 2 === 0 ? "#00e5ff" : "#ff304f",
      })),
    [],
  );

  useFrame(({ clock }) => {
    const time = clock.elapsedTime + surge * 0.03;
    if (waterRef.current) {
      waterRef.current.position.y = -0.92 + Math.sin(time * 0.9) * 0.035 + Math.min(0.22, surge * 0.002);
      waterRef.current.rotation.z = Math.sin(time * 0.23) * 0.025;
    }
    frameRefs.current.forEach((frame, index) => {
      if (!frame) return;
      frame.position.y = -0.38 + Math.sin(time * 1.7 + frames[index].phase) * 0.18;
    });
  });

  const handlePlant = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onPlant(event.point);
  };

  return (
    <>
      <color attach="background" args={["#05050b"]} />
      <fog attach="fog" args={["#05050b", 4.2, 11]} />
      <ambientLight intensity={0.38} />
      <pointLight position={[0, 3.8, 2.8]} intensity={4.8} color="#ffe600" />
      <pointLight position={[-4, 1.5, 2.4]} intensity={3.2} color="#00e5ff" />
      <pointLight position={[4, 1.4, -2.2]} intensity={3.8} color="#ff304f" />

      <mesh ref={waterRef} rotation={[-Math.PI * 0.5, 0, 0]} position={[0, -0.92, 0]} onPointerDown={handlePlant}>
        <planeGeometry args={[8.6, 8.6, 42, 42]} />
        <MeshDistortMaterial color="#051f38" emissive="#006b8d" emissiveIntensity={0.48} roughness={0.08} metalness={0.18} distort={0.25} speed={1.4} />
      </mesh>

      <mesh rotation={[-Math.PI * 0.5, 0, 0]} position={[0, -0.88, 0]} onPointerDown={handlePlant}>
        <planeGeometry args={[8.8, 8.8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {frames.map((frame, index) => (
        <mesh
          key={frame.x}
          ref={(node) => {
            frameRefs.current[index] = node;
          }}
          position={[frame.x, -0.38, -2.7]}
        >
          <boxGeometry args={[0.08, 1.9, 0.18]} />
          <meshStandardMaterial color="#1d1f27" metalness={0.8} roughness={0.24} emissive={frame.color} emissiveIntensity={0.32} />
        </mesh>
      ))}

      <mesh position={[0, -0.96, -3.2]}>
        <boxGeometry args={[7.6, 0.18, 0.35]} />
        <meshStandardMaterial color="#2c2c34" metalness={0.86} roughness={0.18} emissive="#ff304f" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 1.85, -3.25]}>
        <boxGeometry args={[7.8, 0.22, 0.26]} />
        <meshStandardMaterial color="#2b2b34" metalness={0.82} roughness={0.2} emissive="#ffe600" emissiveIntensity={0.22} />
      </mesh>

      {gates.map((gate) => (
        <TideGate key={gate.id} gate={gate} surge={surge} />
      ))}

      <OrbitControls enablePan={false} enableZoom={false} rotateSpeed={0.48} minPolarAngle={Math.PI * 0.24} maxPolarAngle={Math.PI * 0.68} />
    </>
  );
}

export default function MarginTide() {
  const surgeRef = useRef(0);
  const gatesRef = useRef<Gate[]>([]);
  const [surge, setSurge] = useState(0);
  const [gates, setGates] = useState<Gate[]>(() => [
    gateAt(0, new THREE.Vector3(-1.9, -0.8, -0.5), 17),
    gateAt(1, new THREE.Vector3(0.2, -0.8, 0.4), 31),
    gateAt(2, new THREE.Vector3(1.9, -0.8, -0.8), 47),
  ]);

  useEffect(() => {
    gatesRef.current = gates;
  }, [gates]);

  useEffect(() => {
    surgeRef.current = surge;
  }, [surge]);

  useEffect(() => {
    window.margin_tide_render_to_text = () =>
      `Margin Tide | gates:${gatesRef.current.length} | surge:${surgeRef.current}`;

    window.margin_tide_advance = (steps: number) => {
      const next = surgeRef.current + Math.max(0, steps);
      surgeRef.current = next;
      setSurge(next);
    };

    return () => {
      delete window.margin_tide_render_to_text;
      delete window.margin_tide_advance;
    };
  }, []);

  const addGate = (point: THREE.Vector3) => {
    setGates((current) => {
      const nextIndex = current.length;
      const next = gateAt(nextIndex, point, Math.round((point.x * 83 + point.z * 151 + nextIndex * 43) * 10));
      return [...current.slice(-8), next];
    });
    setSurge((current) => current + 11);
  };

  return (
    <div className="h-full w-full overflow-hidden bg-[#05050b]">
      <Canvas camera={{ position: [0, 3.4, 6.2], fov: 47 }} dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
        <FloodRoom gates={gates} surge={surge} onPlant={addGate} />
      </Canvas>
    </div>
  );
}
