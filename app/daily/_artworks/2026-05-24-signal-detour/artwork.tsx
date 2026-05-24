"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    signal_detour_render_to_text?: () => string;
    signal_detour_advance?: (steps: number) => void;
  }
}

type Junction = {
  id: string;
  label: string;
  x: number;
  y: number;
  routes: string[];
};

type Seal = {
  id: number;
  junctionId: string;
  route: string;
};

const junctions: Junction[] = [
  { id: "north-yard", label: "NORTH YARD", x: 18, y: 21, routes: ["R1", "R3"] },
  { id: "glass-loop", label: "GLASS LOOP", x: 41, y: 28, routes: ["R1", "R2"] },
  { id: "ferry-gate", label: "FERRY GATE", x: 74, y: 23, routes: ["R2", "R4"] },
  { id: "market-arch", label: "MARKET ARCH", x: 32, y: 58, routes: ["R3", "R4"] },
  { id: "depot-core", label: "DEPOT CORE", x: 58, y: 62, routes: ["R1", "R4"] },
  { id: "east-ramp", label: "EAST RAMP", x: 80, y: 74, routes: ["R2", "R3"] },
];

const routeLines: Array<{ id: string; points: string; color: string }> = [
  { id: "R1", points: "18,21 41,28 58,62", color: "#d2ad66" },
  { id: "R2", points: "41,28 74,23 80,74", color: "#cc7340" },
  { id: "R3", points: "18,21 32,58 80,74", color: "#7b9f64" },
  { id: "R4", points: "74,23 58,62 32,58", color: "#a98858" },
];

function nearestJunction(x: number, y: number): Junction {
  let nearest = junctions[0];
  let minDistance = Number.POSITIVE_INFINITY;

  for (const junction of junctions) {
    const dx = junction.x - x;
    const dy = junction.y - y;
    const distance = dx * dx + dy * dy;
    if (distance < minDistance) {
      minDistance = distance;
      nearest = junction;
    }
  }

  return nearest;
}

export default function SignalDetour() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(0);
  const beatRef = useRef(0);
  const activeRef = useRef<string | null>(null);
  const sealsRef = useRef<Seal[]>([]);

  const [beat, setBeat] = useState(0);
  const [activeJunctionId, setActiveJunctionId] = useState<string | null>(null);
  const [seals, setSeals] = useState<Seal[]>([{ id: 0, junctionId: "depot-core", route: "R4" }]);

  useEffect(() => {
    sealsRef.current = seals;
  }, [seals]);

  useEffect(() => {
    activeRef.current = activeJunctionId;
  }, [activeJunctionId]);

  useEffect(() => {
    beatRef.current = beat;
  }, [beat]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      node.style.setProperty("--signal-detour-size", `${Math.round(node.clientWidth)}`);
    });

    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const tick = () => {
      if (!mounted) {
        return;
      }
      setBeat((current) => (current + 1) % 240);
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      mounted = false;
      window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    window.signal_detour_render_to_text = () => {
      const active = junctions.find((junction) => junction.id === activeRef.current)?.label ?? "NONE";
      return `Signal Detour | seals:${sealsRef.current.length} | active:${active} | beat:${beatRef.current}`;
    };

    window.signal_detour_advance = (steps: number) => {
      const delta = Math.max(0, Math.floor(steps));
      setBeat((current) => {
        const next = (current + delta) % 240;
        beatRef.current = next;
        return next;
      });
    };

    return () => {
      delete window.signal_detour_render_to_text;
      delete window.signal_detour_advance;
    };
  }, []);

  const routeLoad = useMemo(() => {
    const counts = new Map<string, number>(routeLines.map((route) => [route.id, 0]));
    for (const seal of seals) {
      counts.set(seal.route, (counts.get(seal.route) ?? 0) + 1);
    }
    return counts;
  }, [seals]);

  const handlePress = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const target = nearestJunction(x, y);

    setActiveJunctionId(target.id);
    setSeals((current) => {
      const nextId = current.length > 0 ? current[current.length - 1].id + 1 : 1;
      const route = target.routes[nextId % target.routes.length];
      return [...current.slice(-13), { id: nextId, junctionId: target.id, route }];
    });
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#3f2a16] text-[#f6e6ca]">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        role="img"
        aria-label="A deadpan transit detour diagram where pressed junctions are stamped as route diversions"
        onPointerDown={handlePress}
      >
        <rect x="0" y="0" width="100" height="100" fill="#3f2a16" />
        <rect x="3" y="3" width="94" height="94" fill="#4f3520" stroke="#d6b27b" strokeWidth="0.8" />
        <text x="8" y="12" fill="#f9ecd4" fontSize="4.5" fontWeight="800" letterSpacing="0.7" fontFamily="var(--font-geist-mono), monospace">
          MUNICIPAL DETOUR AUTHORITY
        </text>
        <text x="8" y="17" fill="#d6b27b" fontSize="2.4" letterSpacing="0.35" fontFamily="var(--font-geist-mono), monospace">
          PRESS A NODE TO FILE AN INTERRUPTION
        </text>

        {routeLines.map((route, index) => {
          const load = routeLoad.get(route.id) ?? 0;
          const pulse = 1 + ((beat + index * 15) % 60) / 220;
          return (
            <g key={route.id}>
              <polyline
                points={route.points}
                fill="none"
                stroke={route.color}
                strokeWidth={0.8 + load * 0.22}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.62 + Math.min(load, 3) * 0.08}
                style={{ transformOrigin: "50px 50px", transform: `scale(${pulse})` }}
              />
              <text
                x={8}
                y={78 + index * 4.3}
                fill="#f6e6ca"
                fontSize="2.5"
                fontFamily="var(--font-geist-mono), monospace"
                letterSpacing="0.22"
              >
                {route.id} LOAD {String(load).padStart(2, "0")}
              </text>
            </g>
          );
        })}

        {junctions.map((junction) => {
          const isActive = junction.id === activeJunctionId;
          return (
            <g key={junction.id}>
              <circle cx={junction.x} cy={junction.y} r={isActive ? 2.4 : 1.8} fill={isActive ? "#ffd17e" : "#f5e2bf"} stroke="#2b1a0b" strokeWidth="0.5" />
              <text
                x={junction.x + 2.5}
                y={junction.y - 2.4}
                fill="#f6e6ca"
                fontSize="1.8"
                fontFamily="var(--font-geist-mono), monospace"
                letterSpacing="0.15"
              >
                {junction.label}
              </text>
            </g>
          );
        })}
      </svg>

      {seals.map((seal, index) => {
        const junction = junctions.find((item) => item.id === seal.junctionId);
        if (!junction) {
          return null;
        }

        return (
          <div
            key={seal.id}
            className="pointer-events-none absolute border border-[#f6e6ca] bg-[#2a160a]/85 px-1 py-[1px] font-mono text-[9px] font-semibold tracking-[0.1em] text-[#f6e6ca]"
            style={{
              left: `${junction.x}%`,
              top: `${junction.y}%`,
              transform: `translate(-50%, -50%) rotate(${((index % 5) - 2) * 4}deg)`,
            }}
          >
            DETOUR {seal.route}
          </div>
        );
      })}

      <div className="absolute right-2 top-2 border border-[#f6e6ca] bg-[#1f1005]/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#f6e6ca]">
        pending reroutes: {seals.length}
      </div>
    </div>
  );
}
