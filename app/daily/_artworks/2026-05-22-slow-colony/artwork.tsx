"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

declare global {
  interface Window {
    slow_colony_render_to_text?: () => string;
    slow_colony_advance?: (steps: number) => void;
  }
}

type Colony = {
  id: number;
  color: string;
  position: [number, number, number];
  scale: number;
  seed: number;
};

const colors = ["#00f0ff", "#ff2bd6", "#f4e600", "#66ff00", "#ff4f00"];

function colonyAt(index: number, x: number, y: number, seed = index * 17): Colony {
  return {
    id: index,
    color: colors[Math.abs(seed) % colors.length],
    position: [x, y, -0.45 + ((seed % 5) - 2) * 0.08],
    scale: 0.72 + (Math.abs(seed) % 7) * 0.07,
    seed,
  };
}

function SporeColony({ colony, pulse }: { colony: Colony; pulse: number }) {
  const groupRef = useRef<THREE.Group | null>(null);
  const ringRefs = useRef<Array<THREE.Mesh | null>>([]);
  const tendrilRefs = useRef<Array<THREE.Mesh | null>>([]);

  const tendrils = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        angle: (index / 8) * Math.PI * 2 + colony.seed * 0.13,
        length: 0.8 + ((colony.seed + index * 5) % 9) * 0.06,
        tilt: ((colony.seed + index * 3) % 6) * 0.08,
      })),
    [colony.seed],
  );

  useFrame(({ clock }) => {
    const time = clock.elapsedTime + pulse * 0.04;
    if (groupRef.current) {
      groupRef.current.rotation.y = time * (0.18 + colony.seed * 0.001);
      groupRef.current.rotation.x = Math.sin(time * 0.7 + colony.seed) * 0.18;
    }
    ringRefs.current.forEach((ring, index) => {
      if (!ring) return;
      const beat = 1 + Math.sin(time * 1.3 + index + colony.seed) * 0.035;
      ring.scale.setScalar(beat * (1 + index * 0.34));
      ring.rotation.z = time * (0.25 + index * 0.08);
    });
    tendrilRefs.current.forEach((tendril, index) => {
      if (!tendril) return;
      tendril.rotation.z = tendrils[index].angle + Math.sin(time * 1.5 + index) * 0.18;
      tendril.scale.y = tendrils[index].length + Math.sin(time * 2 + index) * 0.08;
    });
  });

  return (
    <Float speed={1.4 + colony.scale * 0.5} rotationIntensity={0.55} floatIntensity={0.45}>
      <group ref={groupRef} position={colony.position} scale={colony.scale}>
        <mesh>
          <icosahedronGeometry args={[0.42, 4]} />
          <MeshDistortMaterial color={colony.color} emissive={colony.color} emissiveIntensity={0.8} roughness={0.12} metalness={0.18} distort={0.42} speed={2.1} />
        </mesh>

        {[0.48, 0.74, 1.0].map((radius, index) => (
          <mesh
            key={`ring-${radius}`}
            ref={(node) => {
              ringRefs.current[index] = node;
            }}
            rotation={[Math.PI * 0.5 + index * 0.28, index * 0.6, 0]}
          >
            <torusGeometry args={[radius, 0.018 + index * 0.006, 10, 96]} />
            <meshStandardMaterial color={index === 1 ? "#ffffff" : colony.color} emissive={colony.color} emissiveIntensity={0.9 - index * 0.18} roughness={0.2} />
          </mesh>
        ))}

        {tendrils.map((tendril, index) => (
          <mesh
            key={`tendril-${index}`}
            ref={(node) => {
              tendrilRefs.current[index] = node;
            }}
            position={[Math.cos(tendril.angle) * 0.44, Math.sin(tendril.angle) * 0.44, -0.08 + tendril.tilt]}
            rotation={[Math.PI * 0.5, 0, tendril.angle]}
          >
            <boxGeometry args={[0.032, tendril.length, 0.032]} />
            <meshStandardMaterial color={colony.color} emissive={colony.color} emissiveIntensity={0.72} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function ColonyScene({
  colonies,
  pulse,
  onPlant,
}: {
  colonies: Colony[];
  pulse: number;
  onPlant: (point: THREE.Vector3) => void;
}) {
  const floorRef = useRef<THREE.Mesh | null>(null);

  useFrame(({ clock }) => {
    if (floorRef.current) {
      floorRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.16) * 0.025;
    }
  });

  const handlePlant = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onPlant(event.point);
  };

  return (
    <>
      <color attach="background" args={["#03010f"]} />
      <fog attach="fog" args={["#03010f", 4.5, 10]} />
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 0, 3.2]} intensity={4.2} color="#ff2bd6" />
      <pointLight position={[-3.5, 2.8, 2.2]} intensity={2.5} color="#00f0ff" />
      <pointLight position={[3.2, -2.6, 2.6]} intensity={2.2} color="#f4e600" />

      <mesh ref={floorRef} position={[0, 0, -1.05]} onPointerDown={handlePlant}>
        <planeGeometry args={[7.8, 7.8, 24, 24]} />
        <meshStandardMaterial color="#130623" emissive="#070013" roughness={0.8} metalness={0.1} wireframe />
      </mesh>

      <mesh position={[0, 0, -1.1]} onPointerDown={handlePlant}>
        <planeGeometry args={[8.2, 8.2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {colonies.map((colony) => (
        <SporeColony key={colony.id} colony={colony} pulse={pulse} />
      ))}

      <OrbitControls enablePan={false} enableZoom={false} rotateSpeed={0.45} minPolarAngle={Math.PI * 0.25} maxPolarAngle={Math.PI * 0.72} />
    </>
  );
}

export default function SlowColony() {
  const pulseRef = useRef(0);
  const coloniesRef = useRef<Colony[]>([]);
  const [pulse, setPulse] = useState(0);
  const [colonies, setColonies] = useState<Colony[]>(() => [
    colonyAt(0, -1.7, 0.9, 11),
    colonyAt(1, 1.25, 0.38, 23),
    colonyAt(2, -0.28, -1.32, 37),
    colonyAt(3, 1.9, -1.22, 49),
  ]);

  useEffect(() => {
    coloniesRef.current = colonies;
  }, [colonies]);

  useEffect(() => {
    pulseRef.current = pulse;
  }, [pulse]);

  useEffect(() => {
    window.slow_colony_render_to_text = () =>
      `Slow Colony | colonies:${coloniesRef.current.length} | pulse:${pulseRef.current}`;

    window.slow_colony_advance = (steps: number) => {
      const nextPulse = pulseRef.current + Math.max(0, steps);
      pulseRef.current = nextPulse;
      setPulse(nextPulse);
    };

    return () => {
      delete window.slow_colony_render_to_text;
      delete window.slow_colony_advance;
    };
  }, []);

  const addColony = (point: THREE.Vector3) => {
    setColonies((current) => {
      const nextIndex = current.length;
      const next = colonyAt(nextIndex, point.x, point.y, Math.round((point.x * 91 + point.y * 137 + nextIndex * 41) * 10));
      return [...current.slice(-10), next];
    });
    setPulse((current) => current + 8);
  };

  return (
    <div className="h-full w-full overflow-hidden bg-[#03010f]">
      <Canvas camera={{ position: [0, -0.2, 5.2], fov: 48 }} dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
        <ColonyScene colonies={colonies} pulse={pulse} onPlant={addColony} />
      </Canvas>
    </div>
  );
}
