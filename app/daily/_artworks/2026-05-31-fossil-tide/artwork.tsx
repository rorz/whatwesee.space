"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fossil_tide_render_to_text?: () => string;
    fossil_tide_advance?: (steps: number) => void;
  }
}

// Stable ammonite layout — deterministic, not random
const AMMONITES: ReadonlyArray<{
  rx: number;
  ry: number;
  r: number;
  a: number;
}> = [
  { rx: 0.21, ry: 0.72, r: 0.055, a: 0.4 },
  { rx: 0.72, ry: 0.84, r: 0.038, a: 2.1 },
  { rx: 0.47, ry: 0.93, r: 0.050, a: 1.0 },
  { rx: 0.14, ry: 0.90, r: 0.030, a: 3.3 },
  { rx: 0.83, ry: 0.76, r: 0.042, a: 0.8 },
  { rx: 0.61, ry: 0.63, r: 0.028, a: 2.7 },
];

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

// Logarithmic spiral (shell / ammonite)
function drawSpiral(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  color: string,
  alpha: number,
  turns: number,
  b: number,
  r0: number,
  angleOffset: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, scale * 0.04);
  ctx.lineCap = "round";
  ctx.beginPath();
  let first = true;
  const end = Math.PI * 2 * turns;
  for (let t = 0; t <= end; t += 0.06) {
    const r = scale * r0 * Math.exp(b * t);
    const x = cx + r * Math.cos(t + angleOffset);
    const y = cy + r * Math.sin(t + angleOffset);
    if (first) {
      ctx.moveTo(x, y);
      first = false;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

export default function FossilTide() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef(0);
  const progressRef = useRef(0);
  const isHoldingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const drawFnRef = useRef<(() => void) | null>(null);

  // Core rendering — reads only from refs, safe to call from anywhere
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      const ctx = canvas.getContext("2d");
      const size = sizeRef.current;
      if (!ctx || size === 0) return;

      const p = progressRef.current;
      // Split line: p=0 → 68% from top; p=1 → 8% from top
      const splitY = size * (0.68 - p * 0.60);

      ctx.clearRect(0, 0, size, size);

      // ── Desert zone (above split) ──────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, size, splitY + 1);
      ctx.clip();

      const skyGrad = ctx.createLinearGradient(0, 0, 0, splitY);
      skyGrad.addColorStop(0, lerpRgb([232, 213, 176], [91, 143, 170], p));
      skyGrad.addColorStop(0.6, lerpRgb([201, 169, 110], [42, 106, 138], p));
      skyGrad.addColorStop(1, lerpRgb([139, 98, 70], [13, 61, 92], p));
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, size, splitY + 1);

      // Sand ripples fading as ocean arrives
      if (p < 0.85) {
        const ri = (1 - p / 0.85) * 0.32;
        ctx.globalAlpha = ri;
        ctx.strokeStyle = "#7a5538";
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 7; i++) {
          const ly = splitY * (0.45 + i * 0.07);
          if (ly > splitY - 4) continue;
          ctx.beginPath();
          ctx.moveTo(0, ly);
          for (let x = 0; x <= size; x += 4) {
            ctx.lineTo(
              x,
              ly + Math.sin((x / size) * Math.PI * 4 + i * 0.9) * size * 0.007,
            );
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();

      // ── Ocean zone (below split) ───────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, splitY, size, size - splitY);
      ctx.clip();

      const seaGrad = ctx.createLinearGradient(0, splitY, 0, size);
      seaGrad.addColorStop(0, "#0d3d5c");
      seaGrad.addColorStop(0.7, "#071a26");
      seaGrad.addColorStop(1, "#040f18");
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, splitY, size, size - splitY);

      // Caustic shimmer near the waterline
      const shimmerAlpha = Math.min(1, p * 2) * 0.18;
      if (shimmerAlpha > 0.01) {
        ctx.strokeStyle = "#8ad4e4";
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = shimmerAlpha;
        for (let i = 0; i < 4; i++) {
          const ly = splitY + size * 0.016 + i * size * 0.022;
          ctx.beginPath();
          ctx.moveTo(0, ly);
          for (let x = 0; x <= size; x += 4) {
            ctx.lineTo(
              x,
              ly + Math.sin((x / size) * Math.PI * 6 + i * 1.5) * size * 0.005,
            );
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Ammonite fossils emerge as ocean deepens
      const amAlpha = Math.max(0, (p - 0.14) / 0.86);
      if (amAlpha > 0) {
        for (const am of AMMONITES) {
          const ay = am.ry * size;
          if (ay < splitY + size * 0.02) continue;
          drawSpiral(
            ctx,
            am.rx * size,
            ay,
            am.r * size,
            "#8ab8c8",
            amAlpha * 0.75,
            3.5,
            0.18,
            0.04,
            am.a,
          );
        }
      }

      // Seabed silting at bottom
      const seabedAlpha = Math.min(1, p * 1.5) * 0.38;
      if (seabedAlpha > 0) {
        ctx.globalAlpha = seabedAlpha;
        ctx.fillStyle = "#0a3040";
        ctx.fillRect(0, size * 0.92, size, size * 0.08);
        ctx.globalAlpha = 1;
      }

      ctx.restore();

      // ── Waterline ─────────────────────────────────────────────────
      ctx.save();
      ctx.strokeStyle = lerpRgb([201, 169, 110], [58, 138, 172], p);
      ctx.lineWidth = Math.max(1.5, size * 0.0035);
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.moveTo(0, splitY);
      for (let x = 0; x <= size; x += 4) {
        ctx.lineTo(
          x,
          splitY + Math.sin((x / size) * Math.PI * 5) * size * 0.004,
        );
      }
      ctx.stroke();
      ctx.restore();

      // ── Central shell (nautilus, anchored on waterline) ────────────
      const shellScale = size * 0.13;
      drawSpiral(
        ctx,
        size * 0.5,
        splitY,
        shellScale,
        "#f5f0e8",
        0.88,
        2.8,
        0.22,
        0.05,
        -Math.PI * 0.5,
      );
      // Faint outer halo
      const outerR = shellScale * 0.05 * Math.exp(0.22 * Math.PI * 2 * 2.8);
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "#f5f0e8";
      ctx.lineWidth = Math.max(1, size * 0.006);
      ctx.beginPath();
      ctx.arc(size * 0.5, splitY, outerR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ── Caption ────────────────────────────────────────────────────
      const millionYearsAgo = Math.round(p * 100);
      const label =
        p < 0.04
          ? "PRESENT — Béchar, Algeria"
          : p > 0.97
            ? "TETHYS SEA — 100M yr ago"
            : `TETHYS SEA — ${millionYearsAgo}M yr ago`;
      ctx.font = `${Math.max(9, size * 0.021)}px monospace`;
      ctx.fillStyle = `rgba(255,255,255,${0.3 + p * 0.25})`;
      ctx.textAlign = "center";
      ctx.fillText(label, size * 0.5, size * 0.955);
    };

    drawFnRef.current = render;
    render();
  }, []);

  // RAF animation loop — increments / decrements progress
  useEffect(() => {
    let last = 0;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (isHoldingRef.current) {
        progressRef.current = Math.min(1, progressRef.current + dt * 0.22);
      } else {
        progressRef.current = Math.max(0, progressRef.current - dt * 0.38);
      }
      drawFnRef.current?.();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame((now) => {
      last = now;
      rafRef.current = requestAnimationFrame(loop);
    });
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ResizeObserver — DPR-aware canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const size = container.clientWidth;
      sizeRef.current = size;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFnRef.current?.();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    return () => ro.disconnect();
  }, []);

  // Pointer events — hold to reveal the ancient sea
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = () => {
      isHoldingRef.current = true;
    };
    const onUp = () => {
      isHoldingRef.current = false;
    };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchcancel", onUp);

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("touchstart", onDown);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("touchcancel", onUp);
    };
  }, []);

  // Testability hooks
  useEffect(() => {
    window.fossil_tide_render_to_text = () => {
      const p = progressRef.current;
      const state =
        p < 0.05 ? "desert" : p > 0.95 ? "ocean" : "transition";
      return `state:${state};progress:${p.toFixed(2)};holding:${isHoldingRef.current}`;
    };
    window.fossil_tide_advance = (steps: number) => {
      progressRef.current = Math.min(1, progressRef.current + steps * 0.05);
      drawFnRef.current?.();
    };
    return () => {
      delete window.fossil_tide_render_to_text;
      delete window.fossil_tide_advance;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        cursor: "crosshair",
        userSelect: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
