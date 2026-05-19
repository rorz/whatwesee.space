"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    invisible_reply_render_to_text?: () => string;
    invisible_reply_advance?: (steps: number) => void;
  }
}

const GRID = 28;
const DIFFUSION = 0.14;
const COOLING = 0.0032;
const BRUSH_RADIUS = 2.5;
const BRUSH_GAIN = 0.34;
const NOTE =
  "dear you i wrote this at dusk and left the page by the stove what appears is what your hands allowed to stay ";

type Glyph = {
  x: number;
  y: number;
  value: number;
  char: string;
};

function idx(x: number, y: number): number {
  return y * GRID + x;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function charForCell(x: number, y: number): string {
  return NOTE[(x * 11 + y * 17) % NOTE.length];
}

export default function InvisibleReply() {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const warmthRef = useRef<Float32Array>(new Float32Array(GRID * GRID));
  const bufferRef = useRef<Float32Array>(new Float32Array(GRID * GRID));
  const pointerDownRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const [glyphs, setGlyphs] = useState<Array<Glyph>>([]);

  const background = useMemo(
    () =>
      ({
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(244,229,206,0.95)), repeating-linear-gradient(0deg, rgba(146,108,78,0.11) 0px, rgba(146,108,78,0.11) 1px, transparent 1px, transparent 16px)",
      }) satisfies React.CSSProperties,
    [],
  );

  useEffect(() => {
    const warmth = warmthRef.current;
    const buffer = bufferRef.current;

    const rebuildGlyphs = () => {
      const next: Array<Glyph> = [];
      for (let y = 0; y < GRID; y += 1) {
        for (let x = 0; x < GRID; x += 1) {
          const value = warmth[idx(x, y)];
          if (value < 0.045) continue;
          next.push({ x, y, value, char: charForCell(x, y) });
        }
      }
      setGlyphs(next);
    };

    const step = () => {
      for (let y = 0; y < GRID; y += 1) {
        for (let x = 0; x < GRID; x += 1) {
          const i = idx(x, y);
          const current = warmth[i];
          const left = warmth[idx(x > 0 ? x - 1 : x, y)];
          const right = warmth[idx(x < GRID - 1 ? x + 1 : x, y)];
          const up = warmth[idx(x, y > 0 ? y - 1 : y)];
          const down = warmth[idx(x, y < GRID - 1 ? y + 1 : y)];
          const neighborAverage = (left + right + up + down) * 0.25;
          const diffuse = current + (neighborAverage - current) * DIFFUSION;
          buffer[i] = clamp01(diffuse > COOLING ? diffuse - COOLING : 0);
        }
      }
      warmth.set(buffer);
    };

    const loop = () => {
      step();
      frameRef.current += 1;
      if (frameRef.current % 2 === 0) rebuildGlyphs();
      rafRef.current = window.requestAnimationFrame(loop);
    };

    window.invisible_reply_render_to_text = () => {
      let active = 0;
      let total = 0;
      for (let i = 0; i < warmth.length; i += 1) {
        const value = warmth[i];
        if (value > 0.06) active += 1;
        total += value;
      }
      return `Invisible Reply | active: ${active}/${GRID * GRID} | warmth: ${(total / (GRID * GRID)).toFixed(3)}`;
    };

    window.invisible_reply_advance = (steps: number) => {
      for (let i = 0; i < steps; i += 1) step();
      rebuildGlyphs();
    };

    rebuildGlyphs();
    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      delete window.invisible_reply_render_to_text;
      delete window.invisible_reply_advance;
    };
  }, []);

  const applyWarmth = (clientX: number, clientY: number) => {
    const el = surfaceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * (GRID - 1);
    const y = ((clientY - rect.top) / rect.height) * (GRID - 1);
    const warmth = warmthRef.current;
    const r2 = BRUSH_RADIUS * BRUSH_RADIUS;
    const x0 = Math.max(0, Math.floor(x - BRUSH_RADIUS));
    const x1 = Math.min(GRID - 1, Math.ceil(x + BRUSH_RADIUS));
    const y0 = Math.max(0, Math.floor(y - BRUSH_RADIUS));
    const y1 = Math.min(GRID - 1, Math.ceil(y + BRUSH_RADIUS));

    for (let gy = y0; gy <= y1; gy += 1) {
      for (let gx = x0; gx <= x1; gx += 1) {
        const dx = gx - x;
        const dy = gy - y;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const falloff = 1 - d2 / r2;
        const i = idx(gx, gy);
        warmth[i] = clamp01(warmth[i] + BRUSH_GAIN * falloff);
      }
    }
  };

  return (
    <div
      ref={surfaceRef}
      className="relative h-full w-full touch-none select-none overflow-hidden"
      style={background}
      onPointerDown={(event) => {
        pointerDownRef.current = true;
        applyWarmth(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (!pointerDownRef.current) return;
        applyWarmth(event.clientX, event.clientY);
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
      aria-label="A postcard with hidden writing. Drag to warm the page and reveal the invisible reply."
    >
      <div className="pointer-events-none absolute inset-[8%] rounded-[8%] border border-[#8d6c56]/25" />
      <div className="pointer-events-none absolute inset-0 font-mono text-[clamp(8px,1.8vw,15px)] tracking-[0.18em] text-[#4f3223]">
        {glyphs.map((glyph) => (
          <span
            key={`${glyph.x}-${glyph.y}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${((glyph.x + 0.5) / GRID) * 100}%`,
              top: `${((glyph.y + 0.5) / GRID) * 100}%`,
              opacity: Math.min(1, glyph.value * 1.2),
            }}
          >
            {glyph.char}
          </span>
        ))}
      </div>
    </div>
  );
}
