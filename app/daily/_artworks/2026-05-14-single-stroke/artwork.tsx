"use client";

import { useEffect, useRef } from "react";

/**
 * Single Stroke — Iris Holm
 *
 * Cellular-automaton ink-on-paper. Two grids overlaid on a single canvas:
 *   wet[]  : per-cell paper wetness (0..1), accumulated by pointer-drag, decays slowly.
 *   ink[]  : per-cell ink density (0..1), spreads ONLY into wet neighbors per frame.
 *
 * The interaction is non-superfluous: ink propagation is gated by wetness. A dry
 * sheet stops the ink dead. The participant must prepare the paper before they strike.
 *
 * Renders into 100% × 100% of its parent (which is square via DailyFrame).
 */

declare global {
  interface Window {
    /** Testability hook used by automated review loops. */
    single_stroke_render_to_text?: () => string;
    /** Testability hook for advancing the sim N steps in tests. */
    single_stroke_advance?: (steps: number) => Promise<void>;
  }
}

const GRID = 160; // simulation grid size — display canvas upscales from this
const WET_DECAY_PER_FRAME = 0.0008;
const INK_DECAY_PER_FRAME = 0.0001;
const INK_SPREAD_RATE = 0.18;
const POINTER_WET_RADIUS = 9;
const POINTER_WET_GAIN = 0.22;
const CLICK_INK_RADIUS = 3;
const CLICK_INK_AMOUNT = 0.95;

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function idx(x: number, y: number): number {
  return y * GRID + x;
}

export default function SingleStroke() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wetRef = useRef<Float32Array>(new Float32Array(GRID * GRID));
  const inkRef = useRef<Float32Array>(new Float32Array(GRID * GRID));
  const pointerRef = useRef<{ x: number; y: number; down: boolean } | null>(null);
  const strokesRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const wet = wetRef.current;
    const ink = inkRef.current;
    const buffer = new Float32Array(GRID * GRID); // scratch for spread

    let rafId = 0;
    let displaySize = 0;
    let resizeObserver: ResizeObserver | null = null;

    const fitCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.floor(Math.min(rect.width, rect.height));
      displaySize = size;
      canvas.width = Math.max(1, Math.floor(size * dpr));
      canvas.height = Math.max(1, Math.floor(size * dpr));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    fitCanvas();
    resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(canvas);

    // Offscreen paper texture
    const paper = document.createElement("canvas");
    paper.width = GRID;
    paper.height = GRID;
    const paperCtx = paper.getContext("2d");
    if (paperCtx) {
      const imageData = paperCtx.createImageData(GRID, GRID);
      for (let i = 0; i < GRID * GRID; i += 1) {
        const noise = Math.random() * 12 - 6;
        const base = 240 + noise;
        imageData.data[i * 4 + 0] = base;
        imageData.data[i * 4 + 1] = base - 4;
        imageData.data[i * 4 + 2] = base - 16;
        imageData.data[i * 4 + 3] = 255;
      }
      paperCtx.putImageData(imageData, 0, 0);
    }

    // Per-cell render buffer (RGBA)
    const renderCanvas = document.createElement("canvas");
    renderCanvas.width = GRID;
    renderCanvas.height = GRID;
    const renderCtx = renderCanvas.getContext("2d");
    if (!renderCtx) return;
    const renderImage = renderCtx.createImageData(GRID, GRID);
    const paperImage = paperCtx ? paperCtx.getImageData(0, 0, GRID, GRID) : null;

    const depositWetness = (gx: number, gy: number) => {
      const r = POINTER_WET_RADIUS;
      const r2 = r * r;
      const x0 = Math.max(0, gx - r);
      const x1 = Math.min(GRID - 1, gx + r);
      const y0 = Math.max(0, gy - r);
      const y1 = Math.min(GRID - 1, gy + r);
      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
          const dx = x - gx;
          const dy = y - gy;
          const d2 = dx * dx + dy * dy;
          if (d2 > r2) continue;
          const falloff = 1 - d2 / r2;
          wet[idx(x, y)] = clamp01(wet[idx(x, y)] + POINTER_WET_GAIN * falloff);
        }
      }
    };

    const dropInk = (gx: number, gy: number) => {
      const r = CLICK_INK_RADIUS;
      const r2 = r * r;
      const x0 = Math.max(0, gx - r);
      const x1 = Math.min(GRID - 1, gx + r);
      const y0 = Math.max(0, gy - r);
      const y1 = Math.min(GRID - 1, gy + r);
      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
          const dx = x - gx;
          const dy = y - gy;
          if (dx * dx + dy * dy > r2) continue;
          ink[idx(x, y)] = clamp01(ink[idx(x, y)] + CLICK_INK_AMOUNT);
        }
      }
      strokesRef.current += 1;
    };

    const step = () => {
      // 1. Ink spreads into wet neighbors (4-cell stencil)
      buffer.set(ink);
      for (let y = 1; y < GRID - 1; y += 1) {
        for (let x = 1; x < GRID - 1; x += 1) {
          const i = idx(x, y);
          const here = ink[i];
          if (here <= 0.001) continue;
          // Compute total receptive capacity of neighbors
          const left = wet[idx(x - 1, y)];
          const right = wet[idx(x + 1, y)];
          const up = wet[idx(x, y - 1)];
          const down = wet[idx(x, y + 1)];
          const totalReceptive = left + right + up + down;
          if (totalReceptive <= 0.01) continue;
          const give = here * INK_SPREAD_RATE;
          buffer[i] -= give;
          buffer[idx(x - 1, y)] += (give * left) / totalReceptive;
          buffer[idx(x + 1, y)] += (give * right) / totalReceptive;
          buffer[idx(x, y - 1)] += (give * up) / totalReceptive;
          buffer[idx(x, y + 1)] += (give * down) / totalReceptive;
        }
      }
      ink.set(buffer);

      // 2. Slow decays
      for (let i = 0; i < GRID * GRID; i += 1) {
        wet[i] = wet[i] > WET_DECAY_PER_FRAME ? wet[i] - WET_DECAY_PER_FRAME : 0;
        ink[i] = ink[i] > INK_DECAY_PER_FRAME ? ink[i] - INK_DECAY_PER_FRAME : 0;
      }
    };

    const render = () => {
      // Compose per-cell pixel: start from paper, darken by wetness, then darken by ink.
      const data = renderImage.data;
      const paperData = paperImage?.data;
      for (let i = 0; i < GRID * GRID; i += 1) {
        const w = wet[i];
        const k = ink[i];
        // Base paper
        const pr = paperData ? paperData[i * 4 + 0] : 240;
        const pg = paperData ? paperData[i * 4 + 1] : 236;
        const pb = paperData ? paperData[i * 4 + 2] : 224;
        // Wet darkens slightly toward warm gray
        const wetMix = w * 0.18;
        const r1 = pr * (1 - wetMix) + 200 * wetMix;
        const g1 = pg * (1 - wetMix) + 192 * wetMix;
        const b1 = pb * (1 - wetMix) + 176 * wetMix;
        // Ink darkens toward near-black, but feathered
        const inkAlpha = Math.min(1, k * 1.4);
        const r2 = r1 * (1 - inkAlpha) + 18 * inkAlpha;
        const g2 = g1 * (1 - inkAlpha) + 16 * inkAlpha;
        const b2 = b1 * (1 - inkAlpha) + 22 * inkAlpha;
        data[i * 4 + 0] = r2;
        data[i * 4 + 1] = g2;
        data[i * 4 + 2] = b2;
        data[i * 4 + 3] = 255;
      }
      renderCtx.putImageData(renderImage, 0, 0);
      // Blit upscaled to display canvas (uses smoothing for organic ink edges)
      ctx.drawImage(renderCanvas, 0, 0, displaySize, displaySize);
    };

    const loop = () => {
      // Continuous pointer-drag wets the paper
      const p = pointerRef.current;
      if (p && p.down) {
        depositWetness(p.x, p.y);
      }
      step();
      render();
      rafId = window.requestAnimationFrame(loop);
    };

    const toGrid = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const gx = ((clientX - rect.left) / rect.width) * GRID;
      const gy = ((clientY - rect.top) / rect.height) * GRID;
      return {
        x: Math.max(0, Math.min(GRID - 1, Math.floor(gx))),
        y: Math.max(0, Math.min(GRID - 1, Math.floor(gy))),
      };
    };

    const handlePointerDown = (event: PointerEvent) => {
      event.preventDefault();
      const { x, y } = toGrid(event.clientX, event.clientY);
      pointerRef.current = { x, y, down: true };
      depositWetness(x, y);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const { x, y } = toGrid(event.clientX, event.clientY);
      const current = pointerRef.current;
      pointerRef.current = { x, y, down: current?.down ?? false };
    };

    const handlePointerUp = (event: PointerEvent) => {
      const { x, y } = toGrid(event.clientX, event.clientY);
      // A click commits ink at the release point
      dropInk(x, y);
      pointerRef.current = { x, y, down: false };
    };

    const handlePointerLeave = () => {
      const current = pointerRef.current;
      if (current) {
        pointerRef.current = { ...current, down: false };
      }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("pointercancel", handlePointerLeave);

    // Testability hooks
    window.single_stroke_render_to_text = () => {
      let totalWet = 0;
      let totalInk = 0;
      for (let i = 0; i < wet.length; i += 1) {
        totalWet += wet[i];
        totalInk += ink[i];
      }
      const cells = GRID * GRID;
      return `Single Stroke | wetness: ${((totalWet / cells) * 100).toFixed(1)}% | ink: ${((totalInk / cells) * 100).toFixed(1)}% | strokes: ${strokesRef.current}`;
    };
    window.single_stroke_advance = async (steps: number) => {
      for (let n = 0; n < steps; n += 1) {
        step();
      }
      render();
    };

    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("pointercancel", handlePointerLeave);
      delete window.single_stroke_render_to_text;
      delete window.single_stroke_advance;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full cursor-crosshair touch-none select-none"
      style={{ background: "#f5efe2" }}
      aria-label="A digital sheet of paper. Drag to moisten it, click to drop ink. The ink spreads only where the paper has been wetted."
    />
  );
}
