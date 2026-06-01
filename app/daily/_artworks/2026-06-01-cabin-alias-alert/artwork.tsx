"use client";

import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

declare global {
  interface Window {
    cabin_alias_alert_render_to_text?: () => string;
    cabin_alias_alert_advance?: (steps: number) => void;
  }
}

type AliasNode = {
  id: number;
  x: number;
  y: number;
  z: number;
  cooldown: number;
};

const aliasLabels = ["AisleEcho", "Seat29C", "BlueTooth77", "CarryOn", "SnackCart", "GateB12", "HeadsetPing", "CabinNet"];

function makeAliases(): AliasNode[] {
  return aliasLabels.map((_, id) => {
    const angle = (id / aliasLabels.length) * Math.PI * 2;
    return {
      id,
      x: Math.cos(angle) * 1.72,
      y: Math.sin(angle) * 1.2,
      z: -0.04 + (id % 3) * 0.08,
      cooldown: 0,
    };
  });
}

function AliasField({
  aliases,
  collisions,
  dragging,
  jammer,
  onDecay,
}: {
  aliases: AliasNode[];
  collisions: number;
  dragging: boolean;
  jammer: { x: number; y: number };
  onDecay: (delta: number) => void;
}) {
  const ringRef = useRef<THREE.Mesh | null>(null);

  useFrame(({ clock }, delta) => {
    onDecay(delta);
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.elapsedTime * 0.5;
    }
  });

  return (
    <>
      <color attach="background" args={["#f7ea00"]} />
      <ambientLight intensity={0.95} />
      <directionalLight position={[2.5, 1.8, 3]} intensity={1.4} color="#ffffff" />
      <pointLight position={[-2.4, -1.5, 2.2]} intensity={1.1} color="#ff4a1f" />

      <mesh position={[0, 0, -0.4]}>
        <planeGeometry args={[7.2, 6.4]} />
        <meshStandardMaterial color="#f7ea00" roughness={0.92} metalness={0.06} />
      </mesh>

      <mesh ref={ringRef} position={[0, 0, -0.08]}>
        <torusGeometry args={[1.95, 0.17, 24, 96]} />
        <meshStandardMaterial color="#ff2b1a" emissive="#e5341d" emissiveIntensity={0.25 + Math.min(collisions, 16) * 0.05} roughness={0.35} metalness={0.55} />
      </mesh>

      {aliases.map((alias) => {
        const active = alias.cooldown > 0;
        const wobble = active ? Math.sin(alias.cooldown * 14 + alias.id) * 0.05 : 0;
        return (
          <group key={alias.id} position={[alias.x + wobble, alias.y - wobble, alias.z]}>
            <mesh>
              <boxGeometry args={[0.82, 0.3, 0.22]} />
              <meshStandardMaterial color={active ? "#ff1f00" : "#2d7cff"} emissive={active ? "#ff3b17" : "#1f4ed1"} emissiveIntensity={active ? 0.55 : 0.18} roughness={0.28} metalness={0.48} />
            </mesh>
            <mesh position={[0, 0, 0.14]}>
              <planeGeometry args={[0.6, 0.08]} />
              <meshBasicMaterial color="#fef9ed" />
            </mesh>
          </group>
        );
      })}

      {dragging ? (
        <mesh position={[jammer.x, jammer.y, 0.2]}>
          <sphereGeometry args={[0.24, 20, 20]} />
          <meshStandardMaterial color="#d40f00" emissive="#ff250d" emissiveIntensity={0.62} roughness={0.18} metalness={0.35} />
        </mesh>
      ) : null}

      <mesh position={[0, 2.65, 0.2]}>
        <boxGeometry args={[1.8, 0.25, 0.12]} />
        <meshStandardMaterial color="#1a1a1a" emissive="#1a1a1a" emissiveIntensity={Math.min(collisions, 20) * 0.03} roughness={0.4} metalness={0.1} />
      </mesh>
    </>
  );
}

export default function CabinAliasAlert() {
  const [aliases, setAliases] = useState<AliasNode[]>(() => makeAliases());
  const [collisions, setCollisions] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [jammer, setJammer] = useState({ x: 0, y: 0 });

  const decay = (delta: number) => {
    setAliases((current) => {
      let changed = false;
      const next = current.map((alias) => {
        if (alias.cooldown <= 0) return alias;
        changed = true;
        return {
          ...alias,
          cooldown: Math.max(0, alias.cooldown - Math.min(delta, 1 / 20)),
        };
      });
      return changed ? next : current;
    });
  };

  const collideAt = (point: THREE.Vector3) => {
    setJammer({ x: point.x, y: point.y });
    setAliases((current) => {
      let hits = 0;
      const next = current.map((alias) => {
        if (alias.cooldown > 0) return alias;
        const distance = Math.hypot(alias.x - point.x, alias.y - point.y);
        if (distance >= 0.45) return alias;
        hits += 1;
        return {
          ...alias,
          cooldown: 0.9,
        };
      });
      if (hits > 0) {
        setCollisions((value) => value + hits);
      }
      return next;
    });
  };

  useEffect(() => {
    window.cabin_alias_alert_render_to_text = () => {
      const hot = aliases.filter((alias) => alias.cooldown > 0).length;
      return `Cabin Alias Alert | collisions:${collisions} | active-jams:${hot}`;
    };

    window.cabin_alias_alert_advance = (steps: number) => {
      const count = Math.max(0, Math.floor(steps));
      if (count === 0) return;
      const dt = count / 60;
      setAliases((current) =>
        current.map((alias) => ({
          ...alias,
          cooldown: Math.max(0, alias.cooldown - dt),
        })),
      );
    };

    return () => {
      delete window.cabin_alias_alert_render_to_text;
      delete window.cabin_alias_alert_advance;
    };
  }, [aliases, collisions]);

  const handleDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setDragging(true);
    collideAt(event.point);
  };

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    event.stopPropagation();
    collideAt(event.point);
  };

  const handleUp = () => {
    setDragging(false);
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <Canvas camera={{ position: [0, 0, 4.8], fov: 43 }} dpr={[1, 2]} gl={{ antialias: true, alpha: false }} onPointerUp={handleUp} onPointerLeave={handleUp}>
        <mesh position={[0, 0, 0.25]} onPointerDown={handleDown} onPointerMove={handleMove}>
          <planeGeometry args={[7.2, 6.4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <AliasField aliases={aliases} collisions={collisions} dragging={dragging} jammer={jammer} onDecay={decay} />
      </Canvas>
    </div>
  );
}
