"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    no_spines_render_to_text?: () => string;
    no_spines_advance?: (steps: number) => void;
  }
}

type SimulationState = {
  spines: number;
  held: boolean;
  boil: number;
  holdFrames: number;
  totalFrames: number;
};

const BASE_THORNS = 18;
const EXTRA_THORNS = 72;
const INITIAL_SIM: SimulationState = {
  spines: 0.62,
  held: false,
  boil: 0,
  holdFrames: 0,
  totalFrames: 0,
};

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export default function NoSpines() {
  const simRef = useRef<SimulationState>({ ...INITIAL_SIM });
  const [sim, setSim] = useState<SimulationState>({ ...INITIAL_SIM });
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const step = (dt: number) => {
      const scale = Math.min(dt / 16.67, 3);
      const sim = simRef.current;
      sim.boil += 0.04 * scale;
      sim.totalFrames += scale;
      if (sim.held) {
        sim.spines = clamp01(sim.spines - 0.018 * scale);
        sim.holdFrames += scale;
      } else {
        sim.spines = clamp01(sim.spines + 0.014 * scale);
      }
    };

    const loop = (now: number) => {
      const prev = lastRef.current || now;
      const dt = Math.max(8, Math.min(40, now - prev));
      lastRef.current = now;
      step(dt);
      setSim({ ...simRef.current });
      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);

    window.no_spines_render_to_text = () => {
      const sim = simRef.current;
      const thorns = Math.round(BASE_THORNS + sim.spines * EXTRA_THORNS);
      return `held:${sim.held ? "yes" : "no"} spines:${sim.spines.toFixed(2)} thorns:${thorns} holdFrames:${Math.floor(sim.holdFrames)}`;
    };

    window.no_spines_advance = (steps: number) => {
      if (!Number.isFinite(steps) || steps <= 0) return;
      for (let i = 0; i < steps; i += 1) {
        step(16.67);
      }
      setSim({ ...simRef.current });
    };

    return () => {
      window.cancelAnimationFrame(rafRef.current);
      delete window.no_spines_render_to_text;
      delete window.no_spines_advance;
    };
  }, []);

  const thornCount = Math.round(BASE_THORNS + sim.spines * EXTRA_THORNS);
  const thorns = Array.from({ length: thornCount }, (_, index) => {
    const angle = (index / thornCount) * Math.PI * 2 + Math.sin(sim.boil * 0.16 + index * 0.53) * 0.06;
    const inner = 19 + Math.sin(sim.boil * 0.9 + index * 1.9) * 1.8;
    const outer = inner + 5 + sim.spines * 9 + Math.sin(sim.boil * 1.3 + index * 0.27);
    const x1 = 50 + Math.cos(angle) * inner;
    const y1 = 50 + Math.sin(angle) * inner;
    const x2 = 50 + Math.cos(angle) * outer;
    const y2 = 50 + Math.sin(angle) * outer;
    return `${x1.toFixed(2)},${y1.toFixed(2)},${x2.toFixed(2)},${y2.toFixed(2)}`;
  });

  const centerShift = Math.sin(sim.boil * 0.45) * (1 + sim.spines * 3);
  const coconaSpacing = 1 + sim.spines * 7;
  const ringOpacity = 0.22 + sim.spines * 0.68;
  const coconaFill = sim.held ? "#f2fdd8" : "#f0d8ab";
  const coconaStroke = sim.held ? "#8ccf68" : "#c77f43";
  const statusText = sim.held ? "held // spineless" : "released // hybrid thorns";
  const counterText = `THORNS ${thornCount.toString().padStart(2, "0")} // FRAME ${Math.floor(sim.totalFrames)}`;

  const setHeld = (held: boolean) => {
    simRef.current.held = held;
    setSim({ ...simRef.current });
  };

  return (
    <div
      className="relative h-full w-full select-none touch-none"
      onPointerDown={() => setHeld(true)}
      onPointerUp={() => setHeld(false)}
      onPointerCancel={() => setHeld(false)}
      onPointerLeave={() => setHeld(false)}
      aria-label="A typographic ritual around cocona and its relatives. Hold to keep the central COCONA word spineless while surrounding hybrid names boil into thorn lines."
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <rect x="0" y="0" width="100" height="100" fill="#050706" />

        <text
          x="50"
          y="11"
          textAnchor="middle"
          fontSize="4.3"
          fill="#9ed282"
          letterSpacing="0.8"
          fontFamily="var(--font-geist-mono), monospace"
        >
          SOLANUM SESSILIFLORUM // DISTINGUISHED BY LACK OF SPINES
        </text>

        <text
          x="50"
          y="21"
          textAnchor="middle"
          fontSize="5"
          fill="#f4b965"
          letterSpacing="1.25"
          fontFamily="var(--font-geist-mono), monospace"
          opacity={ringOpacity}
        >
          NARANJILLA PSEUDOLULO NARANJILLA PSEUDOLULO
        </text>

        <g stroke="#d37a45" strokeWidth={0.55 + sim.spines * 0.52} strokeLinecap="round" opacity={0.32 + sim.spines * 0.62}>
          {thorns.map((line) => {
            const [x1, y1, x2, y2] = line.split(",");
            return <line key={line} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>

        <text
          x={50 + centerShift}
          y="57"
          textAnchor="middle"
          fontSize="17"
          fill={coconaFill}
          stroke={coconaStroke}
          strokeWidth={0.34 + sim.spines * 0.28}
          letterSpacing={coconaSpacing}
          fontFamily="var(--font-geist-mono), monospace"
          fontWeight={700}
        >
          COCONA
        </text>

        <text
          x="50"
          y="74"
          textAnchor="middle"
          fontSize="3.9"
          fill="#cdd4be"
          letterSpacing="0.6"
          fontFamily="var(--font-geist-mono), monospace"
          opacity={0.7}
        >
          HOLD TO KEEP IT SPINELESS
        </text>

        <text
          x="50"
          y="84"
          textAnchor="middle"
          fontSize="4.6"
          fill={sim.held ? "#9ef08a" : "#f48f62"}
          letterSpacing="0.72"
          fontFamily="var(--font-geist-mono), monospace"
        >
          {statusText}
        </text>

        <text
          x="50"
          y="94"
          textAnchor="middle"
          fontSize="3.5"
          fill="#a7b19e"
          letterSpacing="0.5"
          fontFamily="var(--font-geist-mono), monospace"
        >
          {counterText}
        </text>
      </svg>
    </div>
  );
}
