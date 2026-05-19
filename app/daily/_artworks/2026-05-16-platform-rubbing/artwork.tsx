"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    platform_rubbing_render_to_text?: () => string;
    platform_rubbing_advance?: (steps: number) => void;
  }
}

const GRID = 22;
const DIFFUSION = 0.14;
const DECAY = 0.006;
const RUB_RADIUS = 2.4;
const RUB_GAIN = 0.32;

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function idx(x: number, y: number): number {
  return y * GRID + x;
}

const ROW_LABELS = [
  "06:14 ilidza",
  "06:42 hrasnica",
  "07:08 dobrinja",
  "07:31 alipasino",
  "08:02 old town",
  "08:37 bistrik",
  "09:10 skenderija",
  "09:46 mejtas",
  "10:22 marijin",
  "11:05 gravica",
];

function toGrid(clientX: number, clientY: number, rect: DOMRect): { x: number; y: number } {
  const x = ((clientX - rect.left) / rect.width) * (GRID - 1);
  const y = ((clientY - rect.top) / rect.height) * (GRID - 1);
  return { x, y };
}

export default function PlatformRubbing() {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<Float32Array>(new Float32Array(GRID * GRID));
  const bufferRef = useRef<Float32Array>(new Float32Array(GRID * GRID));
  const pointerDownRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: GRID * GRID }, () => 0));

  const lineNodes = useMemo(
    () =>
      ROW_LABELS.map((label, index) => ({
        y: 11 + index * 8.6,
        text: label,
      })),
    [],
  );

  useEffect(() => {
    const field = fieldRef.current;
    const buffer = bufferRef.current;

    const rebuild = () => {
      setLevels(Array.from(field));
    };

    const step = () => {
      for (let y = 0; y < GRID; y += 1) {
        for (let x = 0; x < GRID; x += 1) {
          const i = idx(x, y);
          const current = field[i];
          const left = field[idx(x > 0 ? x - 1 : x, y)];
          const right = field[idx(x < GRID - 1 ? x + 1 : x, y)];
          const up = field[idx(x, y > 0 ? y - 1 : y)];
          const down = field[idx(x, y < GRID - 1 ? y + 1 : y)];
          const neighborAverage = (left + right + up + down) * 0.25;
          const diffuse = current + (neighborAverage - current) * DIFFUSION;
          buffer[i] = clamp01(diffuse > DECAY ? diffuse - DECAY : 0);
        }
      }
      field.set(buffer);
    };

    const loop = () => {
      step();
      frameRef.current += 1;
      if (frameRef.current % 2 === 0) {
        rebuild();
      }
      rafRef.current = window.requestAnimationFrame(loop);
    };

    window.platform_rubbing_render_to_text = () => {
      let openCells = 0;
      let sum = 0;
      for (let i = 0; i < field.length; i += 1) {
        const value = field[i];
        if (value > 0.12) openCells += 1;
        sum += value;
      }
      return `Platform Rubbing | revealed: ${openCells}/${GRID * GRID} | abrasion: ${(sum / (GRID * GRID)).toFixed(3)}`;
    };

    window.platform_rubbing_advance = (steps: number) => {
      for (let i = 0; i < steps; i += 1) {
        step();
      }
      rebuild();
    };

    rebuild();
    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      delete window.platform_rubbing_render_to_text;
      delete window.platform_rubbing_advance;
    };
  }, []);

  const applyRub = (clientX: number, clientY: number) => {
    const el = surfaceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const { x, y } = toGrid(clientX, clientY, rect);
    const field = fieldRef.current;
    const r2 = RUB_RADIUS * RUB_RADIUS;
    const x0 = Math.max(0, Math.floor(x - RUB_RADIUS));
    const x1 = Math.min(GRID - 1, Math.ceil(x + RUB_RADIUS));
    const y0 = Math.max(0, Math.floor(y - RUB_RADIUS));
    const y1 = Math.min(GRID - 1, Math.ceil(y + RUB_RADIUS));

    for (let gy = y0; gy <= y1; gy += 1) {
      for (let gx = x0; gx <= x1; gx += 1) {
        const dx = gx - x;
        const dy = gy - y;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const falloff = 1 - d2 / r2;
        const i = idx(gx, gy);
        field[i] = clamp01(field[i] + RUB_GAIN * falloff);
      }
    }
  };

  return (
    <div
      ref={surfaceRef}
      className="relative h-full w-full touch-none select-none overflow-hidden"
      onPointerDown={(event) => {
        pointerDownRef.current = true;
        applyRub(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (!pointerDownRef.current) return;
        applyRub(event.clientX, event.clientY);
      }}
      onPointerUp={() => {
        pointerDownRef.current = false;
      }}
      onPointerCancel={() => {
        pointerDownRef.current = false;
      }}
      onPointerLeave={() => {
        pointerDownRef.current = false;
      }}
      aria-label="A station board under paper dust. Drag to rub and reveal route names that commuters have worn into memory."
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="img" aria-hidden>
        <rect x="0" y="0" width="100" height="100" fill="#e8dcc8" />
        <rect x="6" y="6" width="88" height="88" fill="#1f2124" rx="1.4" />
        <rect x="9" y="9" width="82" height="82" fill="#272a2f" />
        {lineNodes.map((line, index) => (
          <g key={line.text}>
            <line x1="12" y1={line.y} x2="88" y2={line.y} stroke="#3c4048" strokeWidth="0.36" />
            <text
              x="14"
              y={line.y - 1.5}
              fill="#dbddd8"
              style={{
                fontSize: "3.2px",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              {line.text}
            </text>
            <text
              x="84"
              y={line.y - 1.5}
              fill="#f4bf4f"
              textAnchor="end"
              style={{
                fontSize: "3.2px",
                letterSpacing: "0.5px",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </text>
          </g>
        ))}
      </svg>

      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}>
        {levels.map((value, index) => {
          const opacity = 0.16 + (1 - value) * 0.84;
          return (
            <span
              key={`dust-${index}`}
              style={{
                opacity,
                background: "#d6c9b2",
                boxShadow: "inset 0 0 0 0.2px rgba(173, 155, 126, 0.45)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
