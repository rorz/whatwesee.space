"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    held_line_render_to_text?: () => string;
    held_line_advance?: (steps: number) => void;
  }
}

const GRID_X = 24;
const GRID_Y = 18;
const CELL_COUNT = GRID_X * GRID_Y;
const HOLD_FRAMES = 96;
const DIFFUSION = 0.1;
const DECAY = 0.0048;
const DEPOSIT_RADIUS = 1.8;
const DEPOSIT_GAIN = 0.34;

function idx(x: number, y: number): number {
  return y * GRID_X + x;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function HeldLine() {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const valuesRef = useRef<Float32Array>(new Float32Array(CELL_COUNT));
  const baseRef = useRef<Float32Array>(new Float32Array(CELL_COUNT));
  const bufferRef = useRef<Float32Array>(new Float32Array(CELL_COUNT));
  const holdRef = useRef<Uint16Array>(new Uint16Array(CELL_COUNT));
  const pointerDownRef = useRef(false);
  const frameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [snapshot, setSnapshot] = useState<{
    values: Float32Array;
    holds: Uint16Array;
  }>({
    values: new Float32Array(CELL_COUNT),
    holds: new Uint16Array(CELL_COUNT),
  });

  const glyphWidths = useMemo(() => {
    const rand = mulberry32(0xd18573a2);
    return Array.from({ length: CELL_COUNT }, (_, i) => {
      const x = i % GRID_X;
      const rowBias = (Math.sin((Math.floor(i / GRID_X) + 1) * 0.84) + 1) * 0.11;
      return 0.4 + rowBias + rand() * (x % 5 === 0 ? 0.45 : 0.32);
    });
  }, []);

  useEffect(() => {
    const values = valuesRef.current;
    const base = baseRef.current;
    const buffer = bufferRef.current;
    const holds = holdRef.current;
    const syncSnapshot = () => {
      setSnapshot({
        values: values.slice(),
        holds: holds.slice(),
      });
    };

    for (let y = 0; y < GRID_Y; y += 1) {
      for (let x = 0; x < GRID_X; x += 1) {
        const i = idx(x, y);
        const baseValue = y % 3 === 0 ? 0.13 : y % 3 === 1 ? 0.08 : 0.045;
        const rhythm = ((x * 17 + y * 11) % 7) * 0.008;
        base[i] = baseValue;
        values[i] = baseValue + rhythm;
      }
    }

    const step = () => {
      for (let y = 0; y < GRID_Y; y += 1) {
        for (let x = 0; x < GRID_X; x += 1) {
          const i = idx(x, y);
          const current = values[i];
          const left = values[idx(x > 0 ? x - 1 : x, y)];
          const right = values[idx(x < GRID_X - 1 ? x + 1 : x, y)];
          const up = values[idx(x, y > 0 ? y - 1 : y)];
          const down = values[idx(x, y < GRID_Y - 1 ? y + 1 : y)];
          const neighborAverage = (left + right + up + down) * 0.25;
          const diffuse = current + (neighborAverage - current) * DIFFUSION;
          const heldFrames = holds[i];
          const holdFloor = heldFrames > 0 ? 0.3 + (heldFrames / HOLD_FRAMES) * 0.35 : 0;
          const floor = holdFloor > base[i] ? holdFloor : base[i];
          const faded = diffuse > DECAY ? diffuse - DECAY : 0;
          buffer[i] = clamp01(faded < floor ? floor : faded);
          if (heldFrames > 0) {
            holds[i] = heldFrames - 1;
          }
        }
      }
      values.set(buffer);
      frameRef.current += 1;
      if (frameRef.current % 2 === 0) {
        syncSnapshot();
      }
    };

    const loop = () => {
      step();
      rafRef.current = window.requestAnimationFrame(loop);
    };

    window.held_line_render_to_text = () => {
      let active = 0;
      let held = 0;
      let density = 0;
      for (let i = 0; i < CELL_COUNT; i += 1) {
        const value = values[i];
        density += value;
        if (value > 0.22) {
          active += 1;
        }
        if (holds[i] > 0) {
          held += 1;
        }
      }
      return `Held Line | active: ${active}/${CELL_COUNT} | held: ${held} | density: ${(density / CELL_COUNT).toFixed(3)}`;
    };

    window.held_line_advance = (steps: number) => {
      for (let i = 0; i < steps; i += 1) {
        step();
      }
      syncSnapshot();
    };

    syncSnapshot();
    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      delete window.held_line_render_to_text;
      delete window.held_line_advance;
    };
  }, []);

  const pressLine = (clientX: number, clientY: number) => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const gx = ((clientX - rect.left) / rect.width) * (GRID_X - 1);
    const gy = ((clientY - rect.top) / rect.height) * (GRID_Y - 1);
    const values = valuesRef.current;
    const holds = holdRef.current;
    const r2 = DEPOSIT_RADIUS * DEPOSIT_RADIUS;
    const x0 = Math.max(0, Math.floor(gx - DEPOSIT_RADIUS));
    const x1 = Math.min(GRID_X - 1, Math.ceil(gx + DEPOSIT_RADIUS));
    const y0 = Math.max(0, Math.floor(gy - DEPOSIT_RADIUS));
    const y1 = Math.min(GRID_Y - 1, Math.ceil(gy + DEPOSIT_RADIUS));

    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const dx = x - gx;
        const dy = y - gy;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const strength = 1 - d2 / r2;
        const i = idx(x, y);
        values[i] = clamp01(values[i] + DEPOSIT_GAIN * strength);
        const held = Math.round(HOLD_FRAMES * (0.35 + strength * 0.65));
        if (held > holds[i]) {
          holds[i] = held;
        }
      }
    }

    setSnapshot({
      values: values.slice(),
      holds: holds.slice(),
    });
  };

  return (
    <div
      ref={surfaceRef}
      className="h-full w-full touch-none select-none overflow-hidden rounded-[1.35rem] border border-[#5a4637]/25 bg-[#f1e4d0]"
      onPointerDown={(event) => {
        pointerDownRef.current = true;
        pressLine(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (!pointerDownRef.current) return;
        pressLine(event.clientX, event.clientY);
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
      aria-label="A field of fading lines. Drag across it to press certain lines into the board so they remain visible longer."
    >
      <div className="relative h-full w-full">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(94,61,39,0.08) 0%, rgba(94,61,39,0.02) 30%, rgba(94,61,39,0.08) 100%), repeating-linear-gradient(180deg, transparent 0, transparent 3.7%, rgba(121,88,64,0.06) 3.7%, rgba(121,88,64,0.06) 4.1%)",
          }}
        />
        {Array.from({ length: CELL_COUNT }, (_, i) => {
          const value = snapshot.values[i];
          const x = i % GRID_X;
          const y = Math.floor(i / GRID_X);
          const held = snapshot.holds[i] > 0;
          const lineWidth = ((100 / GRID_X) * glyphWidths[i]) * (held ? 1.08 : 1);
          const lineHeight = 100 / (GRID_Y * 3.4);
          const opacity = 0.06 + value * 0.9;
          const color = held ? `rgba(93,52,28,${0.35 + value * 0.55})` : `rgba(76,52,38,${0.18 + value * 0.58})`;
          return (
            <span
              key={i}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${((x + 0.5) / GRID_X) * 100}%`,
                top: `${((y + 0.5) / GRID_Y) * 100}%`,
                width: `${lineWidth}%`,
                height: `${lineHeight}%`,
                transform: "translate(-50%, -50%)",
                opacity,
                backgroundColor: color,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
