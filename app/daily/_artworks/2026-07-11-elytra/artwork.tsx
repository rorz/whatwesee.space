"use client";

import { useEffect, useRef } from "react";

/**
 * Elytra — Milo Soto
 *
 * 160 top-down darkling beetles (Stenomorpha) on desert sand.
 * Hold the canvas to bring morning fog; every beetle tilts into its
 * fog-basking posture — body foreshortening as the rear rises,
 * dew condensing on the head.
 *
 * The interaction is non-superfluous: fog-basking is the only
 * transaction Stenomorpha makes with the weather. Hold = fog arrives.
 */

declare global {
  interface Window {
    elytra_render_to_text?: () => string;
    elytra_advance?: (steps: number) => void;
  }
}

const COLS = 16;
const ROWS = 10;
const BEETLE_COUNT = COLS * ROWS; // 160
const TILT_SPEED = 0.016; // ~1 second to full tilt at 60 fps
const FOG_ALPHA_MAX = 0.22;

// Seeded hash-based RNG for deterministic specimen variation
function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

interface BeetleSpec {
  bwScale: number;
  bhScale: number;
  antSpread: number;
  legScale: number;
  tilt: number;
}

function buildBeetles(): BeetleSpec[] {
  const rng = seededRng(0x4b4e7 + 20260711);
  return Array.from({ length: BEETLE_COUNT }, () => ({
    bwScale: 0.82 + rng() * 0.36,
    bhScale: 0.80 + rng() * 0.40,
    antSpread: 0.65 + rng() * 0.70,
    legScale: 0.78 + rng() * 0.44,
    tilt: 0,
  }));
}

function drawBeetle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellW: number,
  b: BeetleSpec,
) {
  const bw = cellW * 0.30 * b.bwScale;
  const bh = cellW * 0.50 * b.bhScale;

  // Foreshortening: body north-south axis shrinks as rear tilts upward
  const tiltRad = b.tilt * (Math.PI * 40) / 180;
  const fs = Math.cos(tiltRad);
  const abh = bh * fs;

  // Shadow shifts toward the rear (south) as beetle tilts
  const shadowShift = bh * (1 - fs) * 0.7;
  ctx.save();
  ctx.translate(cx, cy + shadowShift);
  ctx.beginPath();
  ctx.ellipse(0, 0, bw * 0.58, abh * 0.48, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(85, 52, 18, ${0.22 + b.tilt * 0.12})`;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);

  // Elytra (main body)
  ctx.beginPath();
  ctx.ellipse(0, 0, bw * 0.5, abh * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#1c1409";
  ctx.fill();

  // Suture line down elytra
  ctx.beginPath();
  ctx.moveTo(0, -abh * 0.42);
  ctx.lineTo(0, abh * 0.42);
  ctx.strokeStyle = "#30200e";
  ctx.lineWidth = Math.max(0.4, bw * 0.055);
  ctx.stroke();

  // Pronotum (thorax plate at anterior end)
  const pronH = bh * 0.11 * fs;
  const pronW = bw * 0.52;
  const pronY = -abh * 0.5 + pronH * 0.8;
  ctx.beginPath();
  ctx.ellipse(0, pronY, pronW * 0.5, pronH * 1.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#1c1409";
  ctx.fill();

  // Head
  const hR = bw * 0.25;
  const hY = -abh * 0.5 - hR * 0.55;
  ctx.beginPath();
  ctx.arc(0, hY, hR, 0, Math.PI * 2);
  ctx.fillStyle = "#120d06";
  ctx.fill();

  // Antennae
  const antLen = bw * 0.88 * b.antSpread;
  const lw = Math.max(0.35, bw * 0.045);
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(side * hR * 0.68, hY - hR * 0.55);
    ctx.quadraticCurveTo(
      side * bw * 0.62,
      hY - antLen * 0.52,
      side * bw * (0.22 + b.antSpread * 0.28),
      hY - antLen,
    );
    ctx.strokeStyle = "#2e1f0c";
    ctx.lineWidth = lw;
    ctx.stroke();
  }

  // 3 leg pairs (front, mid, rear)
  const legYs = [-abh * 0.22, 0, abh * 0.24];
  const splay = 1 + b.tilt * 0.38;
  const legW = Math.max(0.4, bw * 0.052);
  for (const ly of legYs) {
    for (const side of [-1, 1] as const) {
      const ll = bw * 0.68 * b.legScale * splay;
      const a = side * Math.PI * 0.58;
      const fx = side * bw * 0.5 + Math.cos(a) * ll * 0.44;
      const fy = ly + Math.sin(a) * ll * 0.14;
      const tx = fx + Math.cos(a + side * 0.28) * ll * 0.56;
      const ty = fy + ll * 0.24;
      ctx.beginPath();
      ctx.moveTo(side * bw * 0.5, ly);
      ctx.lineTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = "#281808";
      ctx.lineWidth = legW;
      ctx.stroke();
    }
  }

  // Dew drop forms on head when beetle has nearly fully tilted
  if (b.tilt > 0.72) {
    const dAlpha = (b.tilt - 0.72) / 0.28;
    const dR = bw * 0.18;
    const dX = hR * 0.12;
    const dY = hY - dR * 0.1;
    const g = ctx.createRadialGradient(
      dX - dR * 0.28,
      dY - dR * 0.3,
      dR * 0.04,
      dX,
      dY,
      dR,
    );
    g.addColorStop(0, `rgba(238, 250, 255, ${dAlpha * 0.96})`);
    g.addColorStop(0.55, `rgba(182, 222, 248, ${dAlpha * 0.52})`);
    g.addColorStop(1, `rgba(150, 200, 235, ${dAlpha * 0.06})`);
    ctx.beginPath();
    ctx.arc(dX, dY, dR, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  ctx.restore();
}

function drawFog(
  ctx: CanvasRenderingContext2D,
  size: number,
  alpha: number,
) {
  if (alpha < 0.004) return;
  ctx.fillStyle = `rgba(213, 228, 240, ${alpha * 0.55})`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 5; i++) {
    const y = ((i + 0.5) / 5) * size;
    const g = ctx.createLinearGradient(0, y - size * 0.07, 0, y + size * 0.07);
    g.addColorStop(0, "rgba(208,226,242,0)");
    g.addColorStop(0.5, `rgba(208,226,242,${alpha * 0.16})`);
    g.addColorStop(1, "rgba(208,226,242,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y - size * 0.07, size, size * 0.14);
  }
}

export default function Elytra() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const beetlesRef = useRef<BeetleSpec[]>(buildBeetles());
  const holdingRef = useRef(false);
  const totalTiltRef = useRef(0);
  const frameCountRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const beetles = beetlesRef.current;
    let displaySize = 0;
    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;

    // Build sandy ground texture once
    const groundCanvas = document.createElement("canvas");
    groundCanvas.width = 256;
    groundCanvas.height = 256;
    const gCtx = groundCanvas.getContext("2d");
    if (gCtx) {
      const id = gCtx.createImageData(256, 256);
      const rng = seededRng(0xbe4d);
      for (let i = 0; i < 256 * 256; i++) {
        const n = rng() * 18 - 9;
        const r = Math.round(200 + n);
        const g2 = Math.round(168 + n * 0.8);
        const b2 = Math.round(110 + n * 0.5);
        id.data[i * 4] = r;
        id.data[i * 4 + 1] = g2;
        id.data[i * 4 + 2] = b2;
        id.data[i * 4 + 3] = 255;
      }
      gCtx.putImageData(id, 0, 0);
    }

    const fitCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const size = Math.floor(Math.min(rect.width, rect.height));
      displaySize = size;
      canvas.width = Math.max(1, Math.floor(size * dpr));
      canvas.height = Math.max(1, Math.floor(size * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    fitCanvas();
    resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(canvas);

    const step = () => {
      const target = holdingRef.current ? 1 : 0;
      let total = 0;
      for (const b of beetles) {
        if (target > b.tilt) {
          b.tilt = Math.min(1, b.tilt + TILT_SPEED);
        } else if (target < b.tilt) {
          b.tilt = Math.max(0, b.tilt - TILT_SPEED);
        }
        total += b.tilt;
      }
      totalTiltRef.current = total;
      frameCountRef.current++;
    };

    const render = () => {
      const size = displaySize;
      if (size <= 0) return;

      // Sandy ground
      if (groundCanvas.width > 0) {
        const pat = ctx.createPattern(groundCanvas, "repeat");
        if (pat) {
          ctx.fillStyle = pat;
          ctx.fillRect(0, 0, size, size);
        } else {
          ctx.fillStyle = "#c8a86e";
          ctx.fillRect(0, 0, size, size);
        }
      }

      const cellW = size / COLS;
      const cellH = size / ROWS;

      for (let i = 0; i < BEETLE_COUNT; i++) {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const cx = (col + 0.5) * cellW;
        const cy = (row + 0.5) * cellH;
        drawBeetle(ctx, cx, cy, cellW, beetles[i]);
      }

      const avgTilt = totalTiltRef.current / BEETLE_COUNT;
      drawFog(ctx, size, avgTilt * FOG_ALPHA_MAX);
    };

    const loop = () => {
      step();
      render();
      rafId = window.requestAnimationFrame(loop);
    };

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      holdingRef.current = true;
    };

    const onPointerUp = () => {
      holdingRef.current = false;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    window.elytra_render_to_text = () => {
      const avg = ((totalTiltRef.current / BEETLE_COUNT) * 100).toFixed(1);
      return `Elytra | ${BEETLE_COUNT} beetles | avg tilt: ${avg}% | holding: ${holdingRef.current} | frames: ${frameCountRef.current}`;
    };

    window.elytra_advance = (steps: number) => {
      holdingRef.current = true;
      for (let i = 0; i < steps; i++) step();
      holdingRef.current = false;
      render();
    };

    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      delete window.elytra_render_to_text;
      delete window.elytra_advance;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full touch-none select-none"
      style={{ background: "#c8a86e", cursor: "cell" }}
      aria-label="160 darkling beetles on desert sand. Hold to bring morning fog — every beetle tilts into its fog-basking posture."
    />
  );
}
