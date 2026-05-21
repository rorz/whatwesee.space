"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    margin_tide_render_to_text?: () => string;
    margin_tide_advance?: (steps: number) => void;
  }
}

const GRID = 120;
const MARGIN_RATIO = 0.18;
const DIFFUSION = 0.08;
const DECAY = 0.0022;
const LOAD_RADIUS = 6;
const DEPOSIT_RADIUS = 4;
const DEPOSIT_GAIN = 0.16;

function idx(x: number, y: number): number {
  return y * GRID + x;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export default function MarginTide() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const ink = new Float32Array(GRID * GRID);
    const buffer = new Float32Array(GRID * GRID);
    let rafId = 0;
    let displaySize = 0;
    let resizeObserver: ResizeObserver | null = null;

    const renderCanvas = document.createElement("canvas");
    renderCanvas.width = GRID;
    renderCanvas.height = GRID;
    const renderCtx = renderCanvas.getContext("2d");
    if (!renderCtx) return;
    const renderImage = renderCtx.createImageData(GRID, GRID);

    const pointer = { down: false, loaded: false, x: 0, y: 0 };

    const seedMargins = () => {
      for (let y = 0; y < GRID; y += 1) {
        for (let x = 0; x < GRID; x += 1) {
          const nx = x / (GRID - 1);
          const ny = y / (GRID - 1);
          const edge = nx < MARGIN_RATIO || nx > 1 - MARGIN_RATIO || ny < MARGIN_RATIO || ny > 1 - MARGIN_RATIO;
          if (!edge) continue;
          const stripe = Math.sin(x * 0.23) * Math.cos(y * 0.19);
          if (stripe > 0.25) {
            ink[idx(x, y)] = 0.4 + stripe * 0.3;
          }
        }
      }
    };

    const fitCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
      displaySize = size;
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };

    const toGrid = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * GRID;
      const y = ((clientY - rect.top) / rect.height) * GRID;
      return {
        x: Math.max(0, Math.min(GRID - 1, Math.floor(x))),
        y: Math.max(0, Math.min(GRID - 1, Math.floor(y))),
      };
    };

    const isMargin = (x: number, y: number) => {
      const nx = x / (GRID - 1);
      const ny = y / (GRID - 1);
      return nx < MARGIN_RATIO || nx > 1 - MARGIN_RATIO || ny < MARGIN_RATIO || ny > 1 - MARGIN_RATIO;
    };

    const loadInk = (x: number, y: number) => {
      const r2 = LOAD_RADIUS * LOAD_RADIUS;
      const x0 = Math.max(0, x - LOAD_RADIUS);
      const x1 = Math.min(GRID - 1, x + LOAD_RADIUS);
      const y0 = Math.max(0, y - LOAD_RADIUS);
      const y1 = Math.min(GRID - 1, y + LOAD_RADIUS);
      for (let yy = y0; yy <= y1; yy += 1) {
        for (let xx = x0; xx <= x1; xx += 1) {
          const dx = xx - x;
          const dy = yy - y;
          const d2 = dx * dx + dy * dy;
          if (d2 > r2) continue;
          const falloff = 1 - d2 / r2;
          ink[idx(xx, yy)] = clamp01(ink[idx(xx, yy)] + falloff * 0.08);
        }
      }
    };

    const depositInk = (x: number, y: number) => {
      if (!pointer.loaded) return;
      const r2 = DEPOSIT_RADIUS * DEPOSIT_RADIUS;
      const x0 = Math.max(0, x - DEPOSIT_RADIUS);
      const x1 = Math.min(GRID - 1, x + DEPOSIT_RADIUS);
      const y0 = Math.max(0, y - DEPOSIT_RADIUS);
      const y1 = Math.min(GRID - 1, y + DEPOSIT_RADIUS);
      for (let yy = y0; yy <= y1; yy += 1) {
        for (let xx = x0; xx <= x1; xx += 1) {
          const dx = xx - x;
          const dy = yy - y;
          const d2 = dx * dx + dy * dy;
          if (d2 > r2) continue;
          const falloff = 1 - d2 / r2;
          ink[idx(xx, yy)] = clamp01(ink[idx(xx, yy)] + falloff * DEPOSIT_GAIN);
        }
      }
    };

    const step = () => {
      for (let y = 0; y < GRID; y += 1) {
        for (let x = 0; x < GRID; x += 1) {
          const i = idx(x, y);
          const current = ink[i];
          const left = ink[idx(x > 0 ? x - 1 : x, y)];
          const right = ink[idx(x < GRID - 1 ? x + 1 : x, y)];
          const up = ink[idx(x, y > 0 ? y - 1 : y)];
          const down = ink[idx(x, y < GRID - 1 ? y + 1 : y)];
          const avg = (left + right + up + down) * 0.25;
          const diffused = current + (avg - current) * DIFFUSION;
          buffer[i] = diffused > DECAY ? diffused - DECAY : 0;
        }
      }
      ink.set(buffer);
    };

    const render = () => {
      const data = renderImage.data;
      for (let y = 0; y < GRID; y += 1) {
        for (let x = 0; x < GRID; x += 1) {
          const i = idx(x, y);
          const value = ink[i];
          const base = 242 - Math.sin(y * 0.15) * 2;
          const centerFadeX = Math.min(1, Math.abs(x - GRID * 0.5) / (GRID * 0.5));
          const centerFadeY = Math.min(1, Math.abs(y - GRID * 0.5) / (GRID * 0.5));
          const centerFade = Math.max(centerFadeX, centerFadeY);
          const edgeTint = (1 - centerFade) * 6;
          const inkAlpha = Math.min(1, value * 1.3);
          data[i * 4 + 0] = base - edgeTint - inkAlpha * 170;
          data[i * 4 + 1] = base - 8 - edgeTint - inkAlpha * 155;
          data[i * 4 + 2] = base - 22 - edgeTint - inkAlpha * 135;
          data[i * 4 + 3] = 255;
        }
      }
      renderCtx.putImageData(renderImage, 0, 0);
      ctx.fillStyle = "#f4ecdc";
      ctx.fillRect(0, 0, displaySize, displaySize);
      ctx.drawImage(renderCanvas, 0, 0, displaySize, displaySize);
      ctx.strokeStyle = "rgba(94,72,50,0.24)";
      ctx.lineWidth = Math.max(1, displaySize * 0.0022);
      const inset = displaySize * MARGIN_RATIO;
      ctx.strokeRect(inset, inset, displaySize - inset * 2, displaySize - inset * 2);
    };

    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault();
      const { x, y } = toGrid(event.clientX, event.clientY);
      pointer.down = true;
      pointer.x = x;
      pointer.y = y;
      pointer.loaded = isMargin(x, y);
      if (pointer.loaded) loadInk(x, y);
      depositInk(x, y);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointer.down) return;
      const { x, y } = toGrid(event.clientX, event.clientY);
      pointer.x = x;
      pointer.y = y;
      if (!pointer.loaded && isMargin(x, y)) {
        pointer.loaded = true;
      }
      if (pointer.loaded && isMargin(x, y)) {
        loadInk(x, y);
      }
      depositInk(x, y);
    };

    const stopPointer = () => {
      pointer.down = false;
      pointer.loaded = false;
    };

    const loop = () => {
      step();
      render();
      rafId = window.requestAnimationFrame(loop);
    };

    window.margin_tide_render_to_text = () => {
      let total = 0;
      let center = 0;
      let centerCells = 0;
      for (let y = 0; y < GRID; y += 1) {
        for (let x = 0; x < GRID; x += 1) {
          const value = ink[idx(x, y)];
          total += value;
          const centerBand = x > GRID * 0.3 && x < GRID * 0.7 && y > GRID * 0.3 && y < GRID * 0.7;
          if (centerBand) {
            center += value;
            centerCells += 1;
          }
        }
      }
      return `Margin Tide | loaded: ${pointer.loaded ? 1 : 0} | density: ${(total / (GRID * GRID)).toFixed(3)} | center: ${(center / Math.max(1, centerCells)).toFixed(3)}`;
    };

    window.margin_tide_advance = (steps: number) => {
      for (let i = 0; i < steps; i += 1) {
        step();
      }
      render();
    };

    seedMargins();
    fitCanvas();
    render();

    resizeObserver = new ResizeObserver(() => {
      fitCanvas();
      render();
    });
    resizeObserver.observe(canvas);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", stopPointer);
    canvas.addEventListener("pointercancel", stopPointer);
    canvas.addEventListener("pointerleave", stopPointer);

    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", stopPointer);
      canvas.removeEventListener("pointercancel", stopPointer);
      canvas.removeEventListener("pointerleave", stopPointer);
      delete window.margin_tide_render_to_text;
      delete window.margin_tide_advance;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full touch-none select-none"
      aria-label="A page where margin notes can be pulled toward the center. Drag from the edges inward to carry the annotations across the page."
    />
  );
}
