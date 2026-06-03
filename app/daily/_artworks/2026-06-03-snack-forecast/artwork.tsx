"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    snack_forecast_render_to_text?: () => string;
    snack_forecast_advance?: (steps: number) => void;
  }
}

type WipePoint = { x: number; y: number; r: number };

type Snack = {
  lane: number;
  offset: number;
  hue: number;
  glyph: "rain" | "wind" | "sun";
};

const SNACKS: ReadonlyArray<Snack> = [
  { lane: 0, offset: 0.03, hue: 347, glyph: "rain" },
  { lane: 1, offset: 0.19, hue: 44, glyph: "sun" },
  { lane: 2, offset: 0.36, hue: 187, glyph: "wind" },
  { lane: 0, offset: 0.51, hue: 318, glyph: "rain" },
  { lane: 1, offset: 0.69, hue: 159, glyph: "wind" },
  { lane: 2, offset: 0.82, hue: 22, glyph: "sun" },
  { lane: 0, offset: 0.96, hue: 275, glyph: "rain" },
];

function hsl(h: number, s: number, l: number, a = 1): string {
  return `hsla(${h} ${s}% ${l}% / ${a})`;
}

export default function SnackForecast() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef(0);
  const wipesRef = useRef<Array<WipePoint>>([]);
  const eraseOnRef = useRef(false);
  const tickRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      const size = sizeRef.current;
      if (!ctx || size === 0) return;

      const t = tickRef.current;
      const stutter = (Math.sin(t * 1.8) > 0.46 ? 1 : 0) * (size * 0.016);

      ctx.clearRect(0, 0, size, size);

      const sky = ctx.createLinearGradient(0, 0, 0, size);
      sky.addColorStop(0, "#ffe7f2");
      sky.addColorStop(0.53, "#f4efff");
      sky.addColorStop(1, "#d9fff6");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      ctx.translate(size * 0.5, size * 0.66);
      ctx.rotate(-0.12);
      ctx.translate(-size * 0.5, -size * 0.66);

      const belt = ctx.createLinearGradient(0, size * 0.45, 0, size * 0.95);
      belt.addColorStop(0, "#d5caf6");
      belt.addColorStop(0.6, "#a7b9f6");
      belt.addColorStop(1, "#8fdcd5");
      ctx.fillStyle = belt;
      ctx.fillRect(size * 0.05, size * 0.44, size * 0.9, size * 0.47);

      for (let i = 0; i < 12; i += 1) {
        const x = size * (0.06 + i * 0.075);
        ctx.fillStyle = i % 2 === 0 ? "#c0b4ec" : "#b7cbf5";
        ctx.fillRect(x, size * 0.47, size * 0.038, size * 0.38);
      }

      for (const snack of SNACKS) {
        const laneY = size * (0.56 + snack.lane * 0.11);
        const x = size * (0.08 + ((snack.offset + t * 0.06) % 1) * 0.84) + stutter;

        ctx.fillStyle = hsl(snack.hue, 78, 71, 0.95);
        ctx.beginPath();
        ctx.roundRect(x - size * 0.057, laneY - size * 0.034, size * 0.114, size * 0.068, size * 0.018);
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.82)";
        ctx.lineWidth = Math.max(1, size * 0.004);
        ctx.stroke();

        ctx.fillStyle = "rgba(64, 35, 77, 0.88)";
        ctx.lineWidth = Math.max(1, size * 0.003);
        if (snack.glyph === "rain") {
          ctx.beginPath();
          ctx.moveTo(x, laneY - size * 0.015);
          ctx.quadraticCurveTo(x - size * 0.01, laneY + size * 0.002, x, laneY + size * 0.016);
          ctx.quadraticCurveTo(x + size * 0.01, laneY + size * 0.002, x, laneY - size * 0.015);
          ctx.fill();
        } else if (snack.glyph === "wind") {
          ctx.beginPath();
          ctx.moveTo(x - size * 0.016, laneY + size * 0.004);
          ctx.quadraticCurveTo(x - size * 0.002, laneY - size * 0.01, x + size * 0.016, laneY + size * 0.002);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x - size * 0.013, laneY + size * 0.012);
          ctx.quadraticCurveTo(x, laneY + size * 0.021, x + size * 0.014, laneY + size * 0.01);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, laneY, size * 0.011, 0, Math.PI * 2);
          ctx.fill();
          for (let i = 0; i < 8; i += 1) {
            const a = (Math.PI * 2 * i) / 8;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * size * 0.014, laneY + Math.sin(a) * size * 0.014);
            ctx.lineTo(x + Math.cos(a) * size * 0.022, laneY + Math.sin(a) * size * 0.022);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = "rgba(104, 69, 138, 0.86)";
      ctx.font = `${Math.max(10, size * 0.028)}px var(--font-geist-mono), monospace`;
      ctx.textAlign = "left";
      ctx.fillText("route sweets", size * 0.1, size * 0.52);

      ctx.fillStyle = "rgba(86, 121, 113, 0.85)";
      ctx.font = `${Math.max(9, size * 0.022)}px var(--font-geist-mono), monospace`;
      ctx.fillText("erase steam to read today's weather menu", size * 0.1, size * 0.91);

      ctx.restore();

      ctx.save();
      ctx.fillStyle = "rgba(244, 248, 255, 0.86)";
      ctx.fillRect(0, 0, size, size);
      ctx.globalCompositeOperation = "destination-out";
      for (const point of wipesRef.current) {
        const g = ctx.createRadialGradient(point.x, point.y, point.r * 0.1, point.x, point.y, point.r);
        g.addColorStop(0, "rgba(0,0,0,0.95)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    drawRef.current = draw;
    draw();
  }, []);

  useEffect(() => {
    const loop = () => {
      tickRef.current += 1 / 60;
      drawRef.current?.();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const width = container.clientWidth;
      sizeRef.current = width;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(width * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${width}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      drawRef.current?.();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const addWipe = (x: number, y: number) => {
      wipesRef.current.push({ x, y, r: sizeRef.current * 0.065 });
      if (wipesRef.current.length > 320) {
        wipesRef.current.splice(0, wipesRef.current.length - 320);
      }
      drawRef.current?.();
    };

    const onPointerDown = (event: PointerEvent) => {
      eraseOnRef.current = true;
      const rect = canvas.getBoundingClientRect();
      addWipe(event.clientX - rect.left, event.clientY - rect.top);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!eraseOnRef.current) return;
      const rect = canvas.getBoundingClientRect();
      addWipe(event.clientX - rect.left, event.clientY - rect.top);
    };

    const onPointerUp = () => {
      eraseOnRef.current = false;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  useEffect(() => {
    window.snack_forecast_render_to_text = () => {
      const wipeCount = wipesRef.current.length;
      const clarity = Math.min(100, Math.round((wipeCount / 130) * 100));
      return `snack-forecast|wipes:${wipeCount}|clarity:${clarity}|tick:${tickRef.current.toFixed(2)}`;
    };

    window.snack_forecast_advance = (steps: number) => {
      const safeSteps = Math.max(0, Math.floor(steps));
      tickRef.current += safeSteps / 60;
      drawRef.current?.();
    };

    return () => {
      delete window.snack_forecast_render_to_text;
      delete window.snack_forecast_advance;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        userSelect: "none",
        touchAction: "none",
        cursor: "cell",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} aria-label="Snack Forecast canvas" />
    </div>
  );
}
