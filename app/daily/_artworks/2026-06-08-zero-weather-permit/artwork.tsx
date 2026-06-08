"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

declare global {
  interface Window {
    zero_weather_permit_render_to_text?: () => string;
    zero_weather_permit_advance?: (steps: number) => void;
  }
}

type PermitModel = {
  tick: number;
  recovery: number;
  storms: number;
  rebuilds: number;
};

type Tower = {
  id: number;
  x: number;
  z: number;
  height: number;
};

const initialModel = (): PermitModel => ({
  tick: 0,
  recovery: 22,
  storms: 4,
  rebuilds: 0,
});

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stepModel(model: PermitModel, holding: boolean) {
  model.tick += 1;

  if (holding && model.tick % 3 === 0) {
    model.recovery = clamp(model.recovery + 2, 0, 100);
    if (model.tick % 9 === 0) {
      model.rebuilds += 1;
    }
  }

  if (!holding && model.tick % 5 === 0) {
    model.recovery = clamp(model.recovery - 1, 0, 100);
  }

  if (model.tick % 14 === 0) {
    model.storms = clamp(model.storms + 1, 0, 9);
  }

  if (holding && model.tick % 11 === 0) {
    model.storms = clamp(model.storms - 1, 0, 9);
  }
}

function PermitRoom({ model, holding }: { model: PermitModel; holding: boolean }) {
  const beaconRef = useRef<THREE.Mesh | null>(null);
  const cloudsRef = useRef<THREE.Group | null>(null);
  const towers = useMemo<Array<Tower>>(() => {
    const base = 0.48 + (model.recovery / 100) * 2.3;
    return Array.from({ length: 6 }, (_, index) => {
      const sway = ((model.tick + index * 7) % 12) * 0.015;
      return {
        id: index,
        x: -2.2 + index * 0.88,
        z: -0.4 - (index % 2) * 0.42,
        height: clamp(base * (0.72 + (index % 3) * 0.18) - model.storms * 0.06 + sway, 0.35, 3.4),
      };
    });
  }, [model.recovery, model.storms, model.tick]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    if (beaconRef.current) {
      const pulse = 0.9 + Math.sin(time * 3.8 + model.tick * 0.04) * 0.13;
      beaconRef.current.scale.setScalar(pulse);
      beaconRef.current.rotation.y = time * 0.4;
    }
    if (cloudsRef.current) {
      cloudsRef.current.position.x = Math.sin(time * 0.18) * 0.22;
      cloudsRef.current.position.z = Math.cos(time * 0.16) * 0.16;
    }
  });

  return (
    <>
      <color attach="background" args={["#c7d2dd"]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 6, 3]} intensity={1.05} color="#f5f8fc" />
      <pointLight position={[-3.1, 3.2, 2.1]} intensity={0.9} color="#d66f5f" />

      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.8, 8.8]} />
        <meshStandardMaterial color="#94a2b1" roughness={0.93} metalness={0.08} />
      </mesh>

      <mesh position={[0, 0.8, -2.4]}>
        <boxGeometry args={[8.4, 4.4, 0.3]} />
        <meshStandardMaterial color="#d8dee6" roughness={0.88} metalness={0.06} />
      </mesh>

      <group ref={cloudsRef} position={[0, 2.45, -1.9]}>
        {[-2.5, -1.3, 0, 1.1, 2.2].map((x, index) => (
          <mesh key={x} position={[x, (index % 2) * 0.18, -0.25 * (index % 3)]}>
            <sphereGeometry args={[0.42 + (index % 3) * 0.08, 22, 14]} />
            <meshStandardMaterial color="#8ea3b9" roughness={0.95} metalness={0.04} />
          </mesh>
        ))}
      </group>

      {towers.map((tower) => (
        <mesh key={tower.id} position={[tower.x, -1.2 + tower.height * 0.5, tower.z]}>
          <boxGeometry args={[0.48, tower.height, 0.46]} />
          <meshStandardMaterial color="#ece7df" roughness={0.81} metalness={0.11} />
        </mesh>
      ))}

      <mesh ref={beaconRef} position={[-3, 2.7, -0.8]}>
        <sphereGeometry args={[0.95, 28, 18]} />
        <meshStandardMaterial color={holding ? "#e7583d" : "#c66f60"} roughness={0.35} metalness={0.22} />
      </mesh>

      <mesh position={[0, -0.65, 1.65]}>
        <boxGeometry args={[3.8, 0.42, 1.5]} />
        <meshStandardMaterial color="#707f8d" roughness={0.46} metalness={0.35} />
      </mesh>
      <mesh position={[0, -0.42, 1.2]}>
        <boxGeometry args={[2.8, 0.06, 0.78]} />
        <meshStandardMaterial color="#b9c4cf" roughness={0.62} metalness={0.15} />
      </mesh>
    </>
  );
}

export default function ZeroWeatherPermit() {
  const modelRef = useRef<PermitModel>(initialModel());
  const holdingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [modelView, setModelView] = useState<PermitModel>(() => initialModel());
  const [holding, setHolding] = useState(false);

  const syncModelView = () => {
    setModelView({ ...modelRef.current });
  };

  useEffect(() => {
    const frame = () => {
      stepModel(modelRef.current, holdingRef.current);
      if (modelRef.current.tick % 2 === 0) {
        syncModelView();
      }
      rafRef.current = window.requestAnimationFrame(frame);
    };

    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const release = () => {
      holdingRef.current = false;
      setHolding(false);
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  useEffect(() => {
    window.zero_weather_permit_render_to_text = () => {
      const { tick, recovery, storms, rebuilds } = modelRef.current;
      return `zero-weather-permit|tick:${tick}|recovery:${recovery}|storms:${storms}|rebuilds:${rebuilds}|holding:${holdingRef.current ? 1 : 0}`;
    };

    window.zero_weather_permit_advance = (steps: number) => {
      const safeSteps = Math.max(0, Math.floor(steps));
      for (let index = 0; index < safeSteps; index += 1) {
        stepModel(modelRef.current, holdingRef.current);
      }
      syncModelView();
    };

    return () => {
      delete window.zero_weather_permit_render_to_text;
      delete window.zero_weather_permit_advance;
    };
  }, []);

  const beginPress = () => {
    holdingRef.current = true;
    setHolding(true);
  };

  return (
    <div
      className="relative h-full w-full touch-none overflow-hidden"
      style={{ background: "linear-gradient(180deg, #d5dce4 0%, #bcc7d4 100%)" }}
      onPointerDown={beginPress}
      onPointerUp={() => {
        holdingRef.current = false;
        setHolding(false);
      }}
      onPointerCancel={() => {
        holdingRef.current = false;
        setHolding(false);
      }}
    >
      <Canvas camera={{ position: [0, 1.8, 6.7], fov: 44 }} dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
        <PermitRoom model={modelView} holding={holding} />
      </Canvas>

      <div className="pointer-events-none absolute left-3 top-3 bg-[#e6ebf1]/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#27313e]">
        weather permit os / district rebuild
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 bg-[#ecf1f6]/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.11em] text-[#1f2a35]">
        <span className="pointer-events-none">recovery {modelView.recovery}% · storm tier {modelView.storms}</span>
        <button
          type="button"
          aria-label="Press and hold to rebuild from zero"
          className="rounded-none border border-[#3a4652] bg-[#d6dee7] px-3 py-1 text-[10px] tracking-[0.14em] text-[#1f2a35] active:bg-[#c2ccd8]"
          onPointerDown={(event) => {
            event.stopPropagation();
            beginPress();
          }}
          onPointerUp={(event) => {
            event.stopPropagation();
            holdingRef.current = false;
            setHolding(false);
          }}
          onPointerCancel={(event) => {
            event.stopPropagation();
            holdingRef.current = false;
            setHolding(false);
          }}
        >
          HOLD TO REBUILD
        </button>
      </div>
    </div>
  );
}
