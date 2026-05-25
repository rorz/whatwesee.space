"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

declare global {
  interface Window {
    rattle_alphabet_render_to_text?: () => string;
    rattle_alphabet_advance?: (steps: number) => void;
  }
}

type Strip = {
  id: number;
  lane: number;
  wobble: number;
  hue: number;
};

const signalWords = [
  "AALTO",
  "BUNKERI",
  "KIPPO",
  "LANKA",
  "MUISTI",
  "RUMPU",
  "SÄRÖ",
  "VIESTI",
  "YDIN",
  "ÖLJY",
];

function makeStrips(seed: number): Strip[] {
  return Array.from({ length: 7 }, (_, lane) => ({
    id: lane,
    lane,
    wobble: ((seed + lane * 17) % 23) / 23,
    hue: (seed * 11 + lane * 31) % 360,
  }));
}

function InstrumentScene({
  strips,
  chaos,
  phase,
}: {
  strips: Strip[];
  chaos: number;
  phase: number;
}) {
  const chassisRef = useRef<THREE.Mesh | null>(null);

  useFrame(({ clock }) => {
    if (!chassisRef.current) {
      return;
    }
    const pulse = Math.sin(clock.elapsedTime * 1.8 + phase * 0.06) * 0.02;
    const roll = (chaos / 100) * Math.sin(clock.elapsedTime * 4.1 + phase * 0.12) * 0.16;
    chassisRef.current.rotation.z = roll;
    chassisRef.current.rotation.x = -0.08 + pulse;
  });

  return (
    <>
      <color attach="background" args={["#05050a"]} />
      <fog attach="fog" args={["#05050a", 3.4, 7.8]} />
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 1.7, 2.7]} intensity={5.2} color="#f0e4c9" />
      <pointLight position={[-2, -1.2, 2.2]} intensity={2.1} color="#7aa0ff" />
      <pointLight position={[2.2, -1.3, 2.2]} intensity={2.4} color="#ff7a4e" />

      <mesh ref={chassisRef} position={[0, -0.02, -0.25]}>
        <boxGeometry args={[2.8, 2.25, 0.48]} />
        <meshStandardMaterial color="#171a20" roughness={0.46} metalness={0.42} />
      </mesh>

      <mesh position={[0, 0.03, 0.04]}>
        <boxGeometry args={[2.46, 1.84, 0.08]} />
        <meshStandardMaterial color="#101317" roughness={0.58} metalness={0.3} />
      </mesh>

      {strips.map((strip, index) => {
        const y = 0.74 - index * 0.24;
        const jitter = (chaos / 100) * (Math.sin(phase * 0.13 + strip.wobble * 8 + index) * 0.24);
        const tilt = (chaos / 100) * Math.sin(phase * 0.16 + strip.wobble * 11) * 0.24;
        return (
          <group key={strip.id} position={[jitter, y, 0.11]} rotation={[0, 0, tilt]}>
            <mesh>
              <boxGeometry args={[2.08, 0.17, 0.04]} />
              <meshStandardMaterial color="#efe0bf" roughness={0.92} metalness={0.03} />
            </mesh>
            <mesh position={[0.62, 0, 0.03]}>
              <boxGeometry args={[0.72, 0.06, 0.02]} />
              <meshStandardMaterial color={`hsl(${strip.hue} 74% 44%)`} roughness={0.32} metalness={0.08} emissive="#120907" emissiveIntensity={0.3} />
            </mesh>
          </group>
        );
      })}

      {[-0.9, 0.9].map((x, index) => (
        <mesh key={x} position={[x, -0.86, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.16, 36]} />
          <meshStandardMaterial color={index === 0 ? "#c45e3e" : "#4f77c4"} roughness={0.36} metalness={0.52} />
        </mesh>
      ))}
    </>
  );
}

export default function RattleAlphabet() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const chaosRef = useRef<number>(8);
  const phaseRef = useRef<number>(0);
  const shakesRef = useRef<number>(0);
  const headWordRef = useRef(signalWords[0]);

  const [chaos, setChaos] = useState(8);
  const [phase, setPhase] = useState(0);
  const [shakes, setShakes] = useState(0);
  const [wordOffset, setWordOffset] = useState(0);
  const [strips, setStrips] = useState<Strip[]>(() => makeStrips(5));
  const currentWord = signalWords[wordOffset % signalWords.length];

  useEffect(() => {
    chaosRef.current = chaos;
  }, [chaos]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    shakesRef.current = shakes;
  }, [shakes]);

  useEffect(() => {
    headWordRef.current = currentWord;
  }, [currentWord]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhase((value) => value + 1);
      setChaos((value) => Math.max(2, value - 0.26));
    }, 16);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const triggerShake = (energy: number) => {
    const nextShakes = shakesRef.current + 1;
    setShakes(nextShakes);
    setChaos((value) => Math.min(100, value + 16 + energy * 0.1));
    setWordOffset((value) => {
      const nextOffset = value + 1;
      setStrips(makeStrips(nextOffset * 13 + nextShakes * 7));
      return nextOffset;
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = containerRef.current;
    if (!node) {
      return;
    }
    node.setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      t: event.timeStamp,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previous = dragRef.current;
    if (!previous) {
      return;
    }

    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    const dt = Math.max(1, event.timeStamp - previous.t);
    const velocity = Math.hypot(dx, dy) / dt;

    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      t: event.timeStamp,
    };

    if (velocity > 1.25) {
      triggerShake(velocity * 20);
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = containerRef.current;
    if (node?.hasPointerCapture(event.pointerId)) {
      node.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  };

  useEffect(() => {
    window.rattle_alphabet_render_to_text = () =>
      `Rattle Alphabet | shakes:${shakesRef.current} | chaos:${Math.round(chaosRef.current)} | word:${headWordRef.current}`;

    window.rattle_alphabet_advance = (steps: number) => {
      const safeSteps = Math.max(0, Math.floor(steps));
      setPhase((value) => value + safeSteps);
      setChaos((value) => Math.max(2, value - safeSteps * 0.4));
    };

    return () => {
      delete window.rattle_alphabet_render_to_text;
      delete window.rattle_alphabet_advance;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-grab overflow-hidden bg-[#05050a] active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Canvas camera={{ position: [0, 0, 3.7], fov: 36 }} dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
        <InstrumentScene strips={strips} chaos={chaos} phase={phase} />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between border border-[#efe0bf]/70 bg-[#09090f]/86 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.17em] text-[#efe0bf]">
        <span>shake to test signal</span>
        <span>word {currentWord}</span>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 border border-[#efe0bf]/55 bg-[#0c0c12]/86 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.13em] text-[#efe0bf]">
        chaos {Math.round(chaos)} · strikes {shakes}
      </div>
    </div>
  );
}
