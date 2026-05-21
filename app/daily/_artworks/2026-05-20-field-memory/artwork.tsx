"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    field_memory_render_to_text?: () => string;
    field_memory_advance?: (steps: number) => void;
  }
}

type Grain = {
  x: number;
  y: number;
  angle: number;
  drift: number;
  wobble: number;
};

const GRAIN_COUNT = 720;
const TWOPI = Math.PI * 2;

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wrapAngle(radians: number): number {
  const mod = radians % TWOPI;
  return mod < 0 ? mod + TWOPI : mod;
}

export default function FieldMemory() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grainsRef = useRef<Array<Grain>>([]);
  const magnetRef = useRef({ x: 0.5, y: 0.5, active: false });
  const pointerIdRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ width: 1, height: 1, dpr: 1 });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) {
      return;
    }

    const random = mulberry32(0x9398ed39);
    if (grainsRef.current.length === 0) {
      grainsRef.current = Array.from({ length: GRAIN_COUNT }, () => ({
        x: random(),
        y: random(),
        angle: random() * TWOPI,
        drift: 0.2 + random() * 0.8,
        wobble: 0.002 + random() * 0.005,
      }));
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const syncSize = () => {
      const rect = root.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      sizeRef.current = { width, height, dpr };
      const pixelWidth = Math.max(1, Math.round(width * dpr));
      const pixelHeight = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const draw = () => {
      const { width, height, dpr } = sizeRef.current;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#ede4d2";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "rgba(103, 79, 56, 0.08)";
      for (let y = 0; y < height; y += Math.max(8, height / 36)) {
        context.fillRect(0, y, width, 1);
      }

      const magnet = magnetRef.current;
      const centerX = magnet.x * width;
      const centerY = magnet.y * height;

      let aligned = 0;
      context.lineCap = "round";
      for (let i = 0; i < grainsRef.current.length; i += 1) {
        const grain = grainsRef.current[i];
        const gx = grain.x * width;
        const gy = grain.y * height;
        const dx = centerX - gx;
        const dy = centerY - gy;
        const distance = Math.hypot(dx, dy);
        const influence = magnet.active ? Math.max(0, 1 - distance / (width * 0.7)) : 0;
        const target = Math.atan2(dy, dx) + Math.sin((grain.x + grain.y) * 14) * 0.08;
        const delta = Math.atan2(Math.sin(target - grain.angle), Math.cos(target - grain.angle));
        grain.angle = wrapAngle(grain.angle + delta * (0.02 + influence * 0.14) + Math.sin(i * 0.17) * grain.wobble);

        if (Math.abs(delta) < 0.14) {
          aligned += 1;
        }

        const step = 0.0008 * grain.drift;
        grain.x = (grain.x + Math.cos(grain.angle) * step + 1) % 1;
        grain.y = (grain.y + Math.sin(grain.angle) * step + 1) % 1;

        const len = 2.2 + influence * 2.6;
        const ox = Math.cos(grain.angle) * len;
        const oy = Math.sin(grain.angle) * len;
        context.strokeStyle = `rgba(52, 36, 22, ${0.18 + influence * 0.62})`;
        context.lineWidth = 0.75 + influence * 0.7;
        context.beginPath();
        context.moveTo(gx - ox, gy - oy);
        context.lineTo(gx + ox, gy + oy);
        context.stroke();
      }

      context.strokeStyle = magnet.active ? "rgba(120, 87, 54, 0.42)" : "rgba(120, 87, 54, 0.2)";
      context.lineWidth = 1.2;
      context.beginPath();
      context.arc(centerX, centerY, Math.max(18, width * 0.08), 0, TWOPI);
      context.stroke();

      return aligned;
    };

    const step = () => draw();

    const loop = () => {
      step();
      rafRef.current = window.requestAnimationFrame(loop);
    };

    window.field_memory_render_to_text = () => {
      const magnet = magnetRef.current;
      const aligned = step();
      return `Field Memory | aligned: ${aligned}/${GRAIN_COUNT} | magnet: ${magnet.active ? "active" : "idle"} @ ${magnet.x.toFixed(2)},${magnet.y.toFixed(2)}`;
    };

    window.field_memory_advance = (steps: number) => {
      for (let i = 0; i < steps; i += 1) {
        step();
      }
    };

    const observer = new ResizeObserver(() => {
      syncSize();
      step();
    });

    syncSize();
    observer.observe(root);
    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      delete window.field_memory_render_to_text;
      delete window.field_memory_advance;
    };
  }, []);

  const updateMagnetFromPointer = (clientX: number, clientY: number) => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const rect = root.getBoundingClientRect();
    const x = rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5;
    const y = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5;
    magnetRef.current.x = Math.min(1, Math.max(0, x));
    magnetRef.current.y = Math.min(1, Math.max(0, y));
  };

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full touch-none select-none overflow-hidden rounded-[1.2rem]"
      onPointerDown={(event) => {
        pointerIdRef.current = event.pointerId;
        magnetRef.current.active = true;
        updateMagnetFromPointer(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (pointerIdRef.current !== event.pointerId) {
          return;
        }
        updateMagnetFromPointer(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        if (pointerIdRef.current !== event.pointerId) {
          return;
        }
        magnetRef.current.active = false;
        pointerIdRef.current = null;
      }}
      onPointerCancel={(event) => {
        if (pointerIdRef.current !== event.pointerId) {
          return;
        }
        magnetRef.current.active = false;
        pointerIdRef.current = null;
      }}
      onPointerLeave={(event) => {
        if (pointerIdRef.current !== event.pointerId) {
          return;
        }
        magnetRef.current.active = false;
        pointerIdRef.current = null;
      }}
      aria-label="A field of iron grains. Drag to move the magnetic pull and watch the grains align to your direction."
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="pointer-events-none absolute left-[7%] top-[8%] rounded border border-[#5e452f]/35 bg-[#f2e7d4]/85 px-2 py-1 font-pixel-square text-[9px] uppercase tracking-[0.18em] text-[#433322]">
        field memory
      </div>
    </div>
  );
}
