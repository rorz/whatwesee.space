"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    claim_shy_render_to_text?: () => string;
    claim_shy_advance?: (steps: number) => void;
  }
}

const GRID = 80;
const MAX_CLAIMS = 7;
const VEIN_RADIUS = 13;
const REPULSE_RADIUS = 18;
const REPULSE_STRENGTH = 0.55;
const DRIFT_FRICTION = 0.92;
const DRIFT_NOISE = 0.04;
const MAX_SPEED = 0.45;

type OreVein = { x: number; y: number; vx: number; vy: number };
type Claim = { gx: number; gy: number };

const STRATA: ReadonlyArray<readonly [number, number, number]> = [
  [72, 68, 62],
  [118, 112, 104],
  [178, 170, 158],
  [132, 104, 78],
  [58, 54, 50],
];

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export default function ClaimShy() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const veinsRef = useRef<OreVein[]>([
    { x: 0.28 * GRID, y: 0.35 * GRID, vx: 0.1, vy: 0.08 },
    { x: 0.65 * GRID, y: 0.6 * GRID, vx: -0.08, vy: 0.12 },
    { x: 0.5 * GRID, y: 0.22 * GRID, vx: 0.06, vy: -0.1 },
  ]);
  const claimsRef = useRef<Claim[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let rafId = 0;
    let displaySize = 0;
    let resizeObserver: ResizeObserver | null = null;

    const fitCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.floor(Math.min(rect.width, rect.height));
      displaySize = size;
      canvas.width = Math.max(1, Math.floor(size * dpr));
      canvas.height = Math.max(1, Math.floor(size * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    fitCanvas();
    resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(container);

    const rockCanvas = document.createElement("canvas");
    rockCanvas.width = GRID;
    rockCanvas.height = GRID;
    const rockCtx = rockCanvas.getContext("2d");
    if (rockCtx) {
      const id = rockCtx.createImageData(GRID, GRID);
      for (let y = 0; y < GRID; y++) {
        const si = Math.floor((y / GRID) * STRATA.length);
        const [sr, sg, sb] = STRATA[si];
        for (let x = 0; x < GRID; x++) {
          const n = (Math.random() - 0.5) * 22;
          const i = (y * GRID + x) * 4;
          id.data[i + 0] = clamp(sr + n, 0, 255);
          id.data[i + 1] = clamp(sg + n, 0, 255);
          id.data[i + 2] = clamp(sb + n, 0, 255);
          id.data[i + 3] = 255;
        }
      }
      rockCtx.putImageData(id, 0, 0);
    }

    const oreCanvas = document.createElement("canvas");
    oreCanvas.width = GRID;
    oreCanvas.height = GRID;
    const oreCtx = oreCanvas.getContext("2d");
    if (!oreCtx) return;
    const oreImage = oreCtx.createImageData(GRID, GRID);

    const grid = new Float32Array(GRID * GRID);

    const rebuildGrid = () => {
      grid.fill(0);
      for (const v of veinsRef.current) {
        const x0 = Math.max(0, Math.floor(v.x - VEIN_RADIUS));
        const x1 = Math.min(GRID - 1, Math.ceil(v.x + VEIN_RADIUS));
        const y0 = Math.max(0, Math.floor(v.y - VEIN_RADIUS));
        const y1 = Math.min(GRID - 1, Math.ceil(v.y + VEIN_RADIUS));
        for (let cy = y0; cy <= y1; cy++) {
          for (let cx = x0; cx <= x1; cx++) {
            const dx = cx - v.x;
            const dy = cy - v.y;
            const d2 = dx * dx + dy * dy;
            const r2 = VEIN_RADIUS * VEIN_RADIUS;
            if (d2 >= r2) continue;
            const t = 1 - d2 / r2;
            grid[cy * GRID + cx] = clamp(grid[cy * GRID + cx] + t * t, 0, 1);
          }
        }
      }
    };

    const step = () => {
      const currentClaims = claimsRef.current;
      for (const v of veinsRef.current) {
        v.vx = v.vx * DRIFT_FRICTION + (Math.random() - 0.5) * DRIFT_NOISE;
        v.vy = v.vy * DRIFT_FRICTION + (Math.random() - 0.5) * DRIFT_NOISE;

        for (const c of currentClaims) {
          const dx = v.x - c.gx;
          const dy = v.y - c.gy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < REPULSE_RADIUS && d > 0.5) {
            const force = REPULSE_STRENGTH * (1 - d / REPULSE_RADIUS) / d;
            v.vx += dx * force;
            v.vy += dy * force;
          }
        }

        const speed = Math.sqrt(v.vx * v.vx + v.vy * v.vy);
        if (speed > MAX_SPEED) {
          v.vx = (v.vx / speed) * MAX_SPEED;
          v.vy = (v.vy / speed) * MAX_SPEED;
        }

        v.x += v.vx;
        v.y += v.vy;

        if (v.x < VEIN_RADIUS) { v.x = VEIN_RADIUS; v.vx = Math.abs(v.vx); }
        if (v.x > GRID - 1 - VEIN_RADIUS) { v.x = GRID - 1 - VEIN_RADIUS; v.vx = -Math.abs(v.vx); }
        if (v.y < VEIN_RADIUS) { v.y = VEIN_RADIUS; v.vy = Math.abs(v.vy); }
        if (v.y > GRID - 1 - VEIN_RADIUS) { v.y = GRID - 1 - VEIN_RADIUS; v.vy = -Math.abs(v.vy); }
      }

      rebuildGrid();
      frameRef.current += 1;
    };

    const render = () => {
      ctx.drawImage(rockCanvas, 0, 0, displaySize, displaySize);

      const data = oreImage.data;
      for (let i = 0; i < GRID * GRID; i++) {
        const v = grid[i];
        data[i * 4 + 0] = 218;
        data[i * 4 + 1] = 162;
        data[i * 4 + 2] = 38;
        data[i * 4 + 3] = Math.floor(v * 190);
      }
      oreCtx.putImageData(oreImage, 0, 0);
      ctx.drawImage(oreCanvas, 0, 0, displaySize, displaySize);
    };

    const loop = () => {
      step();
      render();
      rafId = window.requestAnimationFrame(loop);
    };

    const toGrid = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const gx = ((clientX - rect.left) / rect.width) * GRID;
      const gy = ((clientY - rect.top) / rect.height) * GRID;
      return {
        gx: Math.max(0, Math.min(GRID - 1, Math.floor(gx))),
        gy: Math.max(0, Math.min(GRID - 1, Math.floor(gy))),
      };
    };

    const handlePointerDown = (event: PointerEvent) => {
      event.preventDefault();
      if (claimsRef.current.length >= MAX_CLAIMS) return;
      const { gx, gy } = toGrid(event.clientX, event.clientY);
      const next = [...claimsRef.current, { gx, gy }];
      claimsRef.current = next;
      setClaims(next);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    window.claim_shy_render_to_text = () => {
      const veins = veinsRef.current;
      const c = claimsRef.current.length;
      const positions = veins.map((v) => `(${v.x.toFixed(1)},${v.y.toFixed(1)})`).join(" ");
      return `Claim Shy | claims: ${c}/${MAX_CLAIMS} | veins: ${positions} | frame: ${frameRef.current}`;
    };

    window.claim_shy_advance = (steps: number) => {
      for (let n = 0; n < steps; n++) step();
      render();
    };

    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      delete window.claim_shy_render_to_text;
      delete window.claim_shy_advance;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full touch-none select-none"
      aria-label="A geological cross-section with three ore veins glowing gold in the rock. Click anywhere to plant a claim stake. The ore migrates away from every stake you plant."
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />
      {claims.map((claim, i) => (
        <div
          key={i}
          className="pointer-events-none absolute"
          style={{
            left: `${(claim.gx / GRID) * 100}%`,
            top: `${(claim.gy / GRID) * 100}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#c8952a",
              border: "2px solid #1c1a17",
              margin: "0 auto",
            }}
          />
          <div
            style={{
              width: "2px",
              height: "18px",
              background: "#1c1a17",
              margin: "0 auto",
            }}
          />
        </div>
      ))}
    </div>
  );
}
