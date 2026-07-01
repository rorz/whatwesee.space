"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    short_line_render_to_text?: () => string;
    short_line_advance?: (steps: number) => void;
  }
}

type UnitKind = "passenger" | "freight";

type Unit = {
  id: number;
  kind: UnitKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: "approach" | "branch" | "exit";
  correct: boolean | null;
  flash: number;
};

const SPEED = 0.00016;
const MAIN_Y = 0.44;
const STATION_A_X = 0.10;
const JUNCTION_X = 0.72;
const BRANCH_END_X = 0.90;
const BRANCH_END_Y = 0.72;
const SPAWN_GAP = 5500;

export default function ShortLine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let size = 0;
    let lastT = performance.now();
    let spawnIn = 1200;
    let idSeq = 0;
    let switchTo: "main" | "branch" = "main";
    let switchFlash = 0;
    const score = { ok: 0, total: 0 };
    const units: Unit[] = [];

    const fitCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.floor(Math.min(rect.width, rect.height));
      canvas.width = Math.max(1, Math.floor(size * dpr));
      canvas.height = Math.max(1, Math.floor(size * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    fitCanvas();
    const ro = new ResizeObserver(fitCanvas);
    ro.observe(container);

    const px = (f: number) => f * size;

    const spawnUnit = () => {
      const kind: UnitKind = Math.random() < 0.5 ? "passenger" : "freight";
      units.push({
        id: idSeq++,
        kind,
        x: -0.07,
        y: MAIN_Y,
        vx: SPEED,
        vy: 0,
        phase: "approach",
        correct: null,
        flash: 0,
      });
    };

    spawnUnit();

    const step = (dt: number) => {
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawnIn = SPAWN_GAP;
        const nearJunction = units.some(
          (u) => u.phase === "approach" && u.x > JUNCTION_X - 0.20
        );
        if (!nearJunction) spawnUnit();
      }

      for (let i = units.length - 1; i >= 0; i--) {
        const u = units[i];
        u.flash = Math.max(0, u.flash - dt);

        if (u.phase === "approach") {
          u.x += u.vx * dt;
          if (u.x >= JUNCTION_X) {
            const goesBranch = switchTo === "branch";
            u.correct = goesBranch ? u.kind === "freight" : u.kind === "passenger";
            u.flash = 700;
            score.total++;
            if (u.correct) score.ok++;
            if (goesBranch) {
              u.phase = "branch";
              const branchDX = BRANCH_END_X - JUNCTION_X;
              const branchDY = BRANCH_END_Y - MAIN_Y;
              const len = Math.sqrt(branchDX * branchDX + branchDY * branchDY);
              u.vx = (branchDX / len) * SPEED;
              u.vy = (branchDY / len) * SPEED;
            } else {
              u.phase = "exit";
              u.vx = SPEED;
              u.vy = 0;
            }
          }
        } else if (u.phase === "branch") {
          u.x += u.vx * dt;
          u.y += u.vy * dt;
          if (u.x > 1.05 || u.y > 0.90) units.splice(i, 1);
        } else {
          u.x += u.vx * dt;
          if (u.x > 1.06) units.splice(i, 1);
        }
      }

      switchFlash = Math.max(0, switchFlash - dt);
    };

    const drawRails = (
      x1f: number,
      y1f: number,
      x2f: number,
      y2f: number,
      sleepers: number
    ) => {
      const dxF = x2f - x1f;
      const dyF = y2f - y1f;
      const len = Math.sqrt(dxF * dxF + dyF * dyF);
      if (len === 0) return;
      const nxF = dyF / len;
      const nyF = -dxF / len;
      const railOff = 0.0075;
      const sleeperHalf = 0.020;

      ctx.strokeStyle = "#c4bbaf";
      ctx.lineWidth = Math.max(1, size * 0.006);
      for (let i = 0; i <= sleepers; i++) {
        const t = i / sleepers;
        const sxF = x1f + dxF * t;
        const syF = y1f + dyF * t;
        ctx.beginPath();
        ctx.moveTo(px(sxF + nxF * sleeperHalf), px(syF + nyF * sleeperHalf));
        ctx.lineTo(px(sxF - nxF * sleeperHalf), px(syF - nyF * sleeperHalf));
        ctx.stroke();
      }

      ctx.strokeStyle = "#2e2a26";
      ctx.lineWidth = Math.max(1.5, size * 0.0026);
      for (const sign of [-1, 1] as const) {
        ctx.beginPath();
        ctx.moveTo(px(x1f + nxF * railOff * sign), px(y1f + nyF * railOff * sign));
        ctx.lineTo(px(x2f + nxF * railOff * sign), px(y2f + nyF * railOff * sign));
        ctx.stroke();
      }
    };

    const drawStation = (
      xf: number,
      yf: number,
      label: string,
      above: boolean
    ) => {
      const r = Math.max(4, size * 0.017);
      ctx.fillStyle = "#2e2a26";
      ctx.beginPath();
      ctx.arc(px(xf), px(yf), r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0ece5";
      ctx.beginPath();
      ctx.arc(px(xf), px(yf), r * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2e2a26";
      ctx.font = `700 ${Math.max(8, Math.floor(size * 0.027))}px "Helvetica Neue", Helvetica, system-ui, sans-serif`;
      ctx.textAlign = "center";
      const labelYf = above ? yf - 0.055 : yf + 0.065;
      ctx.fillText(label, px(xf), px(labelYf));
    };

    const render = () => {
      if (size < 1) return;

      ctx.fillStyle = "#f0ece5";
      ctx.fillRect(0, 0, size, size);

      drawRails(-0.02, MAIN_Y, STATION_A_X, MAIN_Y, 3);
      drawRails(STATION_A_X, MAIN_Y, JUNCTION_X, MAIN_Y, 18);
      drawRails(JUNCTION_X, MAIN_Y, 1.02, MAIN_Y, 9);
      drawRails(JUNCTION_X, MAIN_Y, BRANCH_END_X, BRANCH_END_Y, 11);

      drawStation(STATION_A_X, MAIN_Y, "PORT", false);
      drawStation(JUNCTION_X, MAIN_Y, "MEIDEN CHIKKŌ", true);

      const midBXf = (JUNCTION_X + BRANCH_END_X) / 2;
      const midBYf = (MAIN_Y + BRANCH_END_Y) / 2;
      const bAngle = Math.atan2(BRANCH_END_Y - MAIN_Y, BRANCH_END_X - JUNCTION_X);
      ctx.save();
      ctx.translate(px(midBXf), px(midBYf));
      ctx.rotate(bAngle);
      ctx.fillStyle = "#857d74";
      ctx.font = `${Math.max(6, Math.floor(size * 0.021))}px "Helvetica Neue", Helvetica, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("TŌCHIKU LINE", 0, -px(0.022));
      ctx.restore();

      const sw = switchTo === "branch";
      const swCol = switchFlash > 0 ? "#c8102e" : "#2e2a26";

      ctx.strokeStyle = swCol;
      ctx.lineWidth = Math.max(2, size * 0.0042);
      ctx.beginPath();
      ctx.moveTo(px(JUNCTION_X) - px(0.04), px(MAIN_Y));
      ctx.lineTo(
        sw ? px(JUNCTION_X) + px(0.055) : px(JUNCTION_X) + px(0.06),
        sw ? px(MAIN_Y) + px(0.04) : px(MAIN_Y)
      );
      ctx.stroke();

      ctx.fillStyle = swCol;
      ctx.font = `${Math.max(7, Math.floor(size * 0.024))}px "Courier New", Courier, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(
        sw ? "↘ BRANCH" : "→ MAIN",
        px(JUNCTION_X),
        px(MAIN_Y) + px(0.075)
      );

      const uw = Math.max(12, size * 0.062);
      const uh = Math.max(7, size * 0.033);

      for (const u of units) {
        const cx = px(u.x);
        const cy = px(u.y);
        const flashing = u.flash > 0;
        const baseCol = u.kind === "passenger" ? "#c8102e" : "#4a5568";
        const col = flashing
          ? u.correct
            ? "#16a34a"
            : "#dc2626"
          : baseCol;

        ctx.fillStyle = col;
        ctx.fillRect(cx - uw / 2, cy - uh / 2, uw, uh);

        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1;
        const segs = 3;
        for (let s = 1; s < segs; s++) {
          const segX = cx - uw / 2 + (uw / segs) * s;
          ctx.beginPath();
          ctx.moveTo(segX, cy - uh / 2);
          ctx.lineTo(segX, cy + uh / 2);
          ctx.stroke();
        }

        ctx.fillStyle = "#ffffff";
        ctx.font = `700 ${Math.max(7, Math.floor(size * 0.024))}px "Courier New", Courier, monospace`;
        ctx.textAlign = "center";
        ctx.fillText(u.kind === "passenger" ? "P" : "F", cx, cy + px(0.010));

        if (u.phase === "approach" && u.x > JUNCTION_X - 0.14) {
          ctx.strokeStyle = baseCol;
          ctx.lineWidth = Math.max(1.5, size * 0.003);
          ctx.setLineDash([px(0.008), px(0.006)]);
          ctx.strokeRect(cx - uw / 2 - 3, cy - uh / 2 - 3, uw + 6, uh + 6);
          ctx.setLineDash([]);
        }
      }

      ctx.fillStyle = "#2e2a26";
      ctx.font = `700 ${Math.max(10, Math.floor(size * 0.035))}px "Helvetica Neue", Helvetica, system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("CHIKKŌ LINE", px(0.05), px(0.10));

      ctx.font = `${Math.max(7, Math.floor(size * 0.022))}px "Helvetica Neue", Helvetica, system-ui, sans-serif`;
      ctx.fillStyle = "#857d74";
      ctx.fillText("1.5 KM · NAGOYA · MEITETSU", px(0.05), px(0.148));

      ctx.fillStyle = "#2e2a26";
      ctx.font = `${Math.max(8, Math.floor(size * 0.024))}px "Courier New", Courier, monospace`;
      ctx.textAlign = "right";
      ctx.fillText(`${score.ok} / ${score.total}`, px(0.96), px(0.10));

      ctx.fillStyle = "#857d74";
      ctx.font = `${Math.max(6, Math.floor(size * 0.019))}px "Courier New", Courier, monospace`;
      ctx.fillText("sorted", px(0.96), px(0.142));

      if (score.total === 0) {
        ctx.fillStyle = "rgba(46,42,38,0.38)";
        ctx.font = `${Math.max(7, Math.floor(size * 0.022))}px "Helvetica Neue", Helvetica, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("press to flip switch", px(0.50), px(0.90));
      }
    };

    const loop = (t: number) => {
      const dt = Math.min(t - lastT, 50);
      lastT = t;
      step(dt);
      render();
      rafId = requestAnimationFrame(loop);
    };

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      switchTo = switchTo === "main" ? "branch" : "main";
      switchFlash = 320;
    };

    canvas.addEventListener("pointerdown", onPointerDown);

    window.short_line_render_to_text = () =>
      `Short Line | switch:${switchTo} | units:${units.length} | sorted:${score.ok}/${score.total}`;

    window.short_line_advance = (steps: number) => {
      for (let i = 0; i < steps; i++) step(16);
      render();
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      delete window.short_line_render_to_text;
      delete window.short_line_advance;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full touch-none select-none"
      aria-label="Schematic of the Chikkō Line, a 1.5 km railway in Nagoya. Trains of two types approach the junction from the left. Press to flip the switch and sort each train to its correct track."
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-pointer"
      />
    </div>
  );
}
