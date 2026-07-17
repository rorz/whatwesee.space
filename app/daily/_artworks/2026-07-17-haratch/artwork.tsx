"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    haratch_render_to_text?: () => string;
    haratch_advance?: (steps: number) => void;
  }
}

const GRID = 100;
const FOG_GAIN = 0.00018;
const ERASE_RADIUS = 9;
const ERASE_STRENGTH = 0.05;
const FOG_INITIAL = 0.28;

interface TextLine {
  x: number;
  y: number;
  text: string;
  size: number;
  bold?: boolean;
  align?: CanvasTextAlign;
  color: string;
}

const LAYOUT: TextLine[] = [
  { x: 0.5, y: 0.074, text: "H  A  R  A  T  C  H", size: 0.062, bold: true, align: "center", color: "#e8dcc8" },
  { x: 0.5, y: 0.112, text: "Fondé en 1925 · Paris · Schavarch Missakian, rédacteur", size: 0.019, align: "center", color: "#7a7060" },
  { x: 0.06, y: 0.225, text: "EN AVANT", size: 0.023, bold: true, align: "left", color: "#e8dcc8" },
  { x: 0.06, y: 0.263, text: "Nos lecteurs trouvent ces colonnes", size: 0.018, align: "left", color: "#9a8e7c" },
  { x: 0.06, y: 0.293, text: "dans les mains de leurs voisins,", size: 0.018, align: "left", color: "#9a8e7c" },
  { x: 0.06, y: 0.323, text: "dans les cafés du quatorzième,", size: 0.018, align: "left", color: "#9a8e7c" },
  { x: 0.06, y: 0.353, text: "dans les salles où la communauté", size: 0.018, align: "left", color: "#9a8e7c" },
  { x: 0.06, y: 0.383, text: "se souvient de ce qu'elle a perdu.", size: 0.018, align: "left", color: "#9a8e7c" },
  { x: 0.55, y: 0.225, text: "DIASPORA", size: 0.023, bold: true, align: "left", color: "#e8dcc8" },
  { x: 0.55, y: 0.263, text: "La presse arménienne de France", size: 0.018, align: "left", color: "#9a8e7c" },
  { x: 0.55, y: 0.293, text: "paraît sans interruption depuis", size: 0.018, align: "left", color: "#9a8e7c" },
  { x: 0.55, y: 0.323, text: "trente-six ans. Chaque numéro", size: 0.018, align: "left", color: "#9a8e7c" },
  { x: 0.55, y: 0.353, text: "porte la date comme une adresse", size: 0.018, align: "left", color: "#9a8e7c" },
  { x: 0.55, y: 0.383, text: "que le pays n'a pas reçue.", size: 0.018, align: "left", color: "#9a8e7c" },
  { x: 0.5, y: 0.572, text: "« La langue est la seule frontière", size: 0.021, align: "center", color: "#c4a882" },
  { x: 0.5, y: 0.608, text: "que personne ne peut fermer. »", size: 0.021, align: "center", color: "#c4a882" },
  { x: 0.06, y: 0.716, text: "POLITIQUE", size: 0.021, bold: true, align: "left", color: "#e8dcc8" },
  { x: 0.06, y: 0.751, text: "Le gouvernement provisoire", size: 0.017, align: "left", color: "#7a7060" },
  { x: 0.06, y: 0.776, text: "Nouvelles de la Conférence", size: 0.017, align: "left", color: "#7a7060" },
  { x: 0.06, y: 0.801, text: "Correspondances consulaires", size: 0.017, align: "left", color: "#7a7060" },
  { x: 0.55, y: 0.716, text: "CULTURE", size: 0.021, bold: true, align: "left", color: "#e8dcc8" },
  { x: 0.55, y: 0.751, text: "Théâtre arménien, Paris XIVe", size: 0.017, align: "left", color: "#7a7060" },
  { x: 0.55, y: 0.776, text: "Revue de la semaine", size: 0.017, align: "left", color: "#7a7060" },
  { x: 0.55, y: 0.801, text: "Mémoire et littérature", size: 0.017, align: "left", color: "#7a7060" },
  { x: 0.5, y: 0.882, text: "Imprimé à Paris, rue Letellier · XIVe arrondissement", size: 0.016, align: "center", color: "#5a5044" },
  { x: 0.5, y: 0.938, text: "HARATCH · ՀԱՌԱՋ · EN AVANT", size: 0.022, bold: true, align: "center", color: "#c4a882" },
];

function drawNewspaper(tc: CanvasRenderingContext2D, size: number): void {
  tc.fillStyle = "#1a2440";
  tc.fillRect(0, 0, size, size);

  tc.strokeStyle = "#3a4260";
  tc.lineWidth = Math.max(1, size * 0.0012);

  const hline = (y: number) => {
    const px = Math.floor(y * size) + 0.5;
    tc.beginPath();
    tc.moveTo(size * 0.05, px);
    tc.lineTo(size * 0.95, px);
    tc.stroke();
  };
  hline(0.148);
  hline(0.524);
  hline(0.645);
  hline(0.845);

  const vline = (x: number, y0: number, y1: number) => {
    const px = Math.floor(x * size) + 0.5;
    tc.beginPath();
    tc.moveTo(px, size * y0);
    tc.lineTo(px, size * y1);
    tc.stroke();
  };
  vline(0.527, 0.19, 0.524);
  vline(0.527, 0.645, 0.845);

  for (const line of LAYOUT) {
    const fontSize = Math.max(8, Math.floor(line.size * size));
    tc.font = `${line.bold ? "bold " : ""}${fontSize}px 'Geist Mono', monospace`;
    tc.textAlign = line.align ?? "left";
    tc.textBaseline = "alphabetic";
    tc.fillStyle = line.color;
    tc.fillText(line.text, line.x * size, line.y * size);
  }
}

export default function Haratch() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fogRef = useRef<Float32Array>(new Float32Array(GRID * GRID).fill(FOG_INITIAL));
  const pointerRef = useRef<{ x: number; y: number; down: boolean } | null>(null);
  const clearedRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let rafId = 0;
    let displaySize = 0;
    let resizeObserver: ResizeObserver | null = null;

    const textCanvas = document.createElement("canvas");

    const fogOffscreen = document.createElement("canvas");
    fogOffscreen.width = GRID;
    fogOffscreen.height = GRID;
    const fogCtx = fogOffscreen.getContext("2d");
    if (!fogCtx) return;
    const fogImageData = fogCtx.createImageData(GRID, GRID);

    const fog = fogRef.current;

    const fitCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.floor(Math.min(rect.width, rect.height));
      if (size <= 0) return;
      displaySize = size;
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      textCanvas.width = size;
      textCanvas.height = size;
      const tc = textCanvas.getContext("2d");
      if (tc) drawNewspaper(tc, size);
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

    const eraseFog = (gx: number, gy: number) => {
      const r = ERASE_RADIUS;
      const r2 = r * r;
      for (let fy = Math.max(0, gy - r); fy <= Math.min(GRID - 1, gy + r); fy++) {
        for (let fx = Math.max(0, gx - r); fx <= Math.min(GRID - 1, gx + r); fx++) {
          const dx = fx - gx;
          const dy = fy - gy;
          const d2 = dx * dx + dy * dy;
          if (d2 > r2) continue;
          const falloff = 1 - Math.sqrt(d2) / r;
          const i = fy * GRID + fx;
          fog[i] = Math.max(0, fog[i] - ERASE_STRENGTH * falloff);
        }
      }
    };

    const step = () => {
      const p = pointerRef.current;
      if (p?.down) eraseFog(p.x, p.y);
      let cleared = 0;
      for (let i = 0; i < GRID * GRID; i++) {
        fog[i] = Math.min(1, fog[i] + FOG_GAIN);
        if (fog[i] < 0.4) cleared++;
      }
      clearedRef.current = Math.round((cleared / (GRID * GRID)) * 100);
    };

    const render = () => {
      if (displaySize <= 0) return;
      ctx.drawImage(textCanvas, 0, 0, displaySize, displaySize);
      const d = fogImageData.data;
      for (let i = 0; i < GRID * GRID; i++) {
        const alpha = Math.round(fog[i] * 230);
        d[i * 4 + 0] = 24;
        d[i * 4 + 1] = 30;
        d[i * 4 + 2] = 58;
        d[i * 4 + 3] = alpha;
      }
      fogCtx.putImageData(fogImageData, 0, 0);
      ctx.drawImage(fogOffscreen, 0, 0, displaySize, displaySize);
    };

    const loop = () => {
      step();
      render();
      rafId = window.requestAnimationFrame(loop);
    };

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const { x, y } = toGrid(e.clientX, e.clientY);
      pointerRef.current = { x, y, down: true };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const { x, y } = toGrid(e.clientX, e.clientY);
      const cur = pointerRef.current;
      pointerRef.current = { x, y, down: cur?.down ?? false };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const { x, y } = toGrid(e.clientX, e.clientY);
      pointerRef.current = { x, y, down: false };
    };

    const handlePointerLeave = () => {
      if (pointerRef.current) {
        pointerRef.current = { ...pointerRef.current, down: false };
      }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("pointercancel", handlePointerLeave);

    window.haratch_render_to_text = () => {
      const total = fog.reduce((a, b) => a + b, 0);
      const avg = total / (GRID * GRID);
      return `Haratch | fog: ${(avg * 100).toFixed(1)}% | cleared: ${clearedRef.current}%`;
    };

    window.haratch_advance = (steps: number) => {
      for (let n = 0; n < steps; n++) step();
      render();
    };

    fitCanvas();
    resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(canvas);
    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("pointercancel", handlePointerLeave);
      delete window.haratch_render_to_text;
      delete window.haratch_advance;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full cursor-crosshair touch-none select-none"
      style={{ background: "#1a2440" }}
      aria-label="Front page of Haratch, the Armenian diaspora newspaper founded in Paris 1925. Drag across the surface to sweep away the grey sediment covering the type."
    />
  );
}
