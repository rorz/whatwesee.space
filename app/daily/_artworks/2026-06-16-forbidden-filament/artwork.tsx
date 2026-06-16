"use client";

import { useEffect, useRef } from "react";

type OrbitalBook = {
  title: string;
  angle: number;
  speed: number;
  radius: number;
  loaded: boolean;
};

declare global {
  interface Window {
    forbidden_filament_render_to_text?: () => string;
    forbidden_filament_advance?: (steps: number) => void;
  }
}

const TITLES = [
  "night school",
  "salt witness",
  "blue injunction",
  "quiet riot",
  "duct atlas",
  "half permit",
] as const;

export default function ForbiddenFilament() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const booksRef = useRef<OrbitalBook[]>(
    TITLES.map((title, i) => ({
      title,
      angle: (Math.PI * 2 * i) / TITLES.length,
      speed: 0.012 + i * 0.0012,
      radius: 118 + (i % 3) * 12,
      loaded: false,
    })),
  );
  const loadedRef = useRef(0);
  const frameRef = useRef(0);
  const controlRef = useRef({ x: 68, y: 254, dragging: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let size = 0;
    let dpr = 1;
    let ro: ResizeObserver | null = null;

    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      size = Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(size * dpr));
      canvas.height = Math.max(1, Math.floor(size * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const toScene = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (clientX - rect.left) / Math.max(1, rect.width);
      const ny = (clientY - rect.top) / Math.max(1, rect.height);
      return {
        x: nx * 320,
        y: ny * 320,
      };
    };

    const checkCollisions = () => {
      const c = controlRef.current;
      const books = booksRef.current;
      for (const book of books) {
        if (book.loaded) continue;
        const stutterStop = Math.sin(frameRef.current * 0.18 + book.angle * 3) > 0.82;
        const angle = stutterStop ? book.angle : book.angle + frameRef.current * book.speed;
        const bx = 160 + Math.cos(angle) * book.radius;
        const by = 138 + Math.sin(angle) * (book.radius * 0.47);
        const dist = Math.hypot(c.x - bx, c.y - by);
        if (dist < 11) {
          book.loaded = true;
          loadedRef.current += 1;
        }
      }
    };

    const step = (n = 1) => {
      for (let i = 0; i < n; i += 1) {
        frameRef.current += 1;
        checkCollisions();
      }
    };

    const drawBorder = () => {
      ctx.strokeStyle = "#ff375f";
      ctx.lineWidth = 7;
      ctx.beginPath();
      const p = [
        [3, 8],
        [24, 4],
        [48, 10],
        [74, 5],
        [108, 11],
        [151, 4],
        [189, 11],
        [227, 5],
        [266, 10],
        [295, 4],
        [315, 8],
        [315, 310],
        [291, 316],
        [258, 309],
        [226, 315],
        [194, 309],
        [160, 316],
        [128, 309],
        [87, 315],
        [56, 309],
        [23, 316],
        [3, 310],
        [3, 8],
      ];
      ctx.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length; i += 1) ctx.lineTo(p[i][0], p[i][1]);
      ctx.stroke();
    };

    const render = () => {
      ctx.fillStyle = "#ffe84a";
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      const scale = size / 320;
      ctx.scale(scale, scale);

      ctx.fillStyle = "#f4f4e8";
      ctx.fillRect(20, 214, 280, 82);
      ctx.strokeStyle = "#5f6d80";
      ctx.lineWidth = 1;
      for (let y = 222; y <= 290; y += 11) {
        ctx.beginPath();
        ctx.moveTo(24, y);
        ctx.lineTo(296, y + (y % 22 === 0 ? 1 : -1));
        ctx.stroke();
      }
      ctx.fillStyle = "#17233d";
      ctx.font = "11px var(--font-geist-mono), monospace";
      ctx.fillText("bench log: confiscated titles orbiting", 28, 238);

      const books = booksRef.current;
      const loaded = loadedRef.current;

      ctx.strokeStyle = "#2134a7";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(160, 138, 144, 72, 0, 0, Math.PI * 2);
      ctx.stroke();

      for (const book of books) {
        const stutterStop = Math.sin(frameRef.current * 0.18 + book.angle * 3) > 0.82;
        const angle = stutterStop ? book.angle : book.angle + frameRef.current * book.speed;
        const bx = 160 + Math.cos(angle) * book.radius;
        const by = 138 + Math.sin(angle) * (book.radius * 0.47);

        if (!book.loaded) {
          ctx.fillStyle = "#0e1f7a";
          ctx.fillRect(bx - 10, by - 6, 20, 12);
          ctx.fillStyle = "#f6f7ff";
          ctx.fillRect(bx - 8, by - 4, 16, 8);
          ctx.fillStyle = "#0e1f7a";
          ctx.font = "6px var(--font-geist-mono), monospace";
          ctx.fillText(book.title.slice(0, 5), bx - 7, by + 2);
        }
      }

      ctx.fillStyle = "#f8f7f1";
      ctx.beginPath();
      ctx.ellipse(160, 132, 78, 96, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#23317f";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#9aa4b2";
      ctx.fillRect(130, 225, 60, 22);
      ctx.fillStyle = "#727c8d";
      ctx.fillRect(136, 247, 48, 16);
      ctx.fillStyle = "#3d4a60";
      ctx.fillRect(142, 263, 36, 10);

      ctx.strokeStyle = "#5f6d80";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(123, 128);
      ctx.lineTo(197, 128);
      ctx.moveTo(126, 145);
      ctx.lineTo(194, 145);
      ctx.moveTo(129, 162);
      ctx.lineTo(191, 162);
      ctx.moveTo(132, 179);
      ctx.lineTo(188, 179);
      ctx.stroke();

      ctx.fillStyle = "#e03131";
      for (let i = 0; i < loaded; i += 1) {
        ctx.fillRect(130 + (i % 3) * 18, 118 + Math.floor(i / 3) * 12, 12, 8);
      }

      const c = controlRef.current;
      ctx.fillStyle = "#a8b3c4";
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3e4c62";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#162138";
      ctx.font = "10px var(--font-geist-mono), monospace";
      ctx.fillText("tiny compliance nub", 80, 258);

      ctx.fillStyle = "#162138";
      ctx.font = "12px var(--font-geist-mono), monospace";
      ctx.fillText(`shelves recovered: ${loaded}/${books.length}`, 28, 278);

      drawBorder();
      ctx.restore();
    };

    const loop = () => {
      step(1);
      render();
      raf = window.requestAnimationFrame(loop);
    };

    const onDown = (e: PointerEvent) => {
      const p = toScene(e.clientX, e.clientY);
      const c = controlRef.current;
      if (Math.hypot(p.x - c.x, p.y - c.y) <= 16) {
        controlRef.current = { ...c, dragging: true };
      }
    };

    const onMove = (e: PointerEvent) => {
      const c = controlRef.current;
      if (!c.dragging) return;
      const p = toScene(e.clientX, e.clientY);
      controlRef.current = {
        x: Math.max(34, Math.min(286, p.x)),
        y: Math.max(34, Math.min(286, p.y)),
        dragging: true,
      };
    };

    const onUp = () => {
      const c = controlRef.current;
      controlRef.current = { ...c, dragging: false };
    };

    fit();
    ro = new ResizeObserver(fit);
    ro.observe(canvas);

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onUp);

    window.forbidden_filament_render_to_text = () => {
      const loadedTitles = booksRef.current.filter((book) => book.loaded).length;
      return `forbidden-filament | shelves:${loadedTitles}/${booksRef.current.length} | control:${Math.round(controlRef.current.x)},${Math.round(controlRef.current.y)}`;
    };
    window.forbidden_filament_advance = (steps: number) => {
      step(Math.max(0, Math.floor(steps)));
      render();
    };

    raf = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(raf);
      ro?.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onUp);
      delete window.forbidden_filament_render_to_text;
      delete window.forbidden_filament_advance;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none select-none"
      aria-label="Forbidden Filament. Drag the tiny compliance nub into orbiting book tabs to load hidden shelves into the bulb."
    />
  );
}
