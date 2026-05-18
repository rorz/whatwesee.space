"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    borrowed_page_render_to_text?: () => string;
    borrowed_page_advance?: (steps: number) => void;
  }
}

const GRID = 26;
const DIFFUSION = 0.12;
const DECAY = 0.0028;
const DEPOSIT_RADIUS = 2.2;
const DEPOSIT_GAIN = 0.34;

type MarkLine = {
  d: string;
  width: number;
  opacity: number;
};

type CircleNode = {
  cx: number;
  cy: number;
  r: number;
};

function idx(x: number, y: number): number {
  return y * GRID + x;
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

function makeLines(seed: number, count: number, baseY: number, spread: number): MarkLine[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, lineIndex) => {
    const y = baseY + lineIndex * spread + (rand() - 0.5) * 2.4;
    const points = Array.from({ length: 11 }, (_, pointIndex) => {
      const x = 6 + pointIndex * 8.7 + (rand() - 0.5) * 1.5;
      const jitter = (rand() - 0.5) * 2.4 + Math.sin((lineIndex + pointIndex) * 0.7) * 0.45;
      return `${x.toFixed(2)},${(y + jitter).toFixed(2)}`;
    });
    return {
      d: `M ${points.join(" L ")}`,
      width: 0.65 + rand() * 0.75,
      opacity: 0.32 + rand() * 0.4,
    };
  });
}

export default function BorrowedPage() {
  const maskId = useId();
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const abrasionRef = useRef<Float32Array>(new Float32Array(GRID * GRID));
  const bufferRef = useRef<Float32Array>(new Float32Array(GRID * GRID));
  const pointerDownRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const [circles, setCircles] = useState<Array<CircleNode>>([]);

  const topLines = useMemo(() => makeLines(0x8a2f3d1c, 15, 12, 5.3), []);
  const underLines = useMemo(() => makeLines(0x15c3a27e, 14, 15, 5.1), []);

  useEffect(() => {
    const abrasion = abrasionRef.current;
    const buffer = bufferRef.current;
    const rebuildCircles = () => {
      const nodes: Array<CircleNode> = [];
      for (let y = 0; y < GRID; y += 1) {
        for (let x = 0; x < GRID; x += 1) {
          const value = abrasion[idx(x, y)];
          if (value < 0.075) continue;
          nodes.push({
            cx: ((x + 0.5) / GRID) * 100,
            cy: ((y + 0.5) / GRID) * 100,
            r: 0.2 + value * 2.8,
          });
        }
      }
      setCircles(nodes);
    };

    const step = () => {
      for (let y = 0; y < GRID; y += 1) {
        for (let x = 0; x < GRID; x += 1) {
          const i = idx(x, y);
          const current = abrasion[i];
          const left = abrasion[idx(x > 0 ? x - 1 : x, y)];
          const right = abrasion[idx(x < GRID - 1 ? x + 1 : x, y)];
          const up = abrasion[idx(x, y > 0 ? y - 1 : y)];
          const down = abrasion[idx(x, y < GRID - 1 ? y + 1 : y)];
          const neighborAverage = (left + right + up + down) * 0.25;
          const diffuse = current + (neighborAverage - current) * DIFFUSION;
          buffer[i] = clamp01(diffuse > DECAY ? diffuse - DECAY : 0);
        }
      }
      abrasion.set(buffer);
    };

    const loop = () => {
      step();
      frameRef.current += 1;
      if (frameRef.current % 2 === 0) {
        rebuildCircles();
      }
      rafRef.current = window.requestAnimationFrame(loop);
    };

    window.borrowed_page_render_to_text = () => {
      let activeCells = 0;
      let sum = 0;
      for (let i = 0; i < abrasion.length; i += 1) {
        const value = abrasion[i];
        if (value > 0.08) activeCells += 1;
        sum += value;
      }
      return `Borrowed Page | active: ${activeCells}/${GRID * GRID} | abrasion: ${(sum / (GRID * GRID)).toFixed(3)}`;
    };

    window.borrowed_page_advance = (steps: number) => {
      for (let i = 0; i < steps; i += 1) {
        step();
      }
      rebuildCircles();
    };

    rebuildCircles();
    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      delete window.borrowed_page_render_to_text;
      delete window.borrowed_page_advance;
    };
  }, []);

  const applyAbrasion = (clientX: number, clientY: number) => {
    const el = surfaceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * (GRID - 1);
    const y = ((clientY - rect.top) / rect.height) * (GRID - 1);
    const abrasion = abrasionRef.current;
    const r2 = DEPOSIT_RADIUS * DEPOSIT_RADIUS;
    const x0 = Math.max(0, Math.floor(x - DEPOSIT_RADIUS));
    const x1 = Math.min(GRID - 1, Math.ceil(x + DEPOSIT_RADIUS));
    const y0 = Math.max(0, Math.floor(y - DEPOSIT_RADIUS));
    const y1 = Math.min(GRID - 1, Math.ceil(y + DEPOSIT_RADIUS));
    for (let gy = y0; gy <= y1; gy += 1) {
      for (let gx = x0; gx <= x1; gx += 1) {
        const dx = gx - x;
        const dy = gy - y;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const falloff = 1 - d2 / r2;
        const i = idx(gx, gy);
        abrasion[i] = clamp01(abrasion[i] + DEPOSIT_GAIN * falloff);
      }
    }
  };

  return (
    <div
      ref={surfaceRef}
      className="h-full w-full touch-none select-none"
      onPointerDown={(event) => {
        pointerDownRef.current = true;
        applyAbrasion(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (!pointerDownRef.current) return;
        applyAbrasion(event.clientX, event.clientY);
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
      aria-label="A layered manuscript square. Drag to lift the top writing and reveal older lines beneath."
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-hidden>
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100" height="100" fill="white" />
            {circles.map((circle, index) => (
              <circle key={`mask-cell-${index}`} cx={circle.cx} cy={circle.cy} r={circle.r} fill="black" />
            ))}
          </mask>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="#e8dcc3" />
        <g stroke="#7d241f" fill="none" strokeLinecap="round">
          {underLines.map((line, index) => (
            <path key={`under-${index}`} d={line.d} strokeWidth={line.width * 0.95} opacity={line.opacity * 0.66} />
          ))}
        </g>
        <g mask={`url(#${maskId})`}>
          <rect x="0" y="0" width="100" height="100" fill="#d6c4a2" opacity="0.95" />
          <g stroke="#2f261e" fill="none" strokeLinecap="round">
            {topLines.map((line, index) => (
              <path key={`top-${index}`} d={line.d} strokeWidth={line.width} opacity={line.opacity} />
            ))}
          </g>
          <rect x="0" y="0" width="100" height="100" fill="#aa8f62" opacity="0.05" />
        </g>
      </svg>
    </div>
  );
}
