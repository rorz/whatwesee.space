"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    fifteen_seats_render_to_text?: () => string;
    fifteen_seats_advance?: (steps: number) => void;
  }
}

const COLS = 11;
const ROWS = 8;
const SEAT_COUNT = COLS * ROWS;

// 36 Labor safe (cols 0-3 all rows + col 4 rows 0-3)
// 20 Coalition rural (col 4 rows 4-7, cols 5-6 all rows)
// 32 Coalition safe (cols 7-10 all rows)
const INITIAL_COALITION = 52;
const MAJORITY_SWING = 15;

type SeatKind = "labor" | "coalition-rural" | "coalition-safe";

interface Seat {
  kind: SeatKind;
  pressure: number;
  tipped: boolean;
}

function getSeatKind(i: number): SeatKind {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  if (col < 4) return "labor";
  if (col === 4 && row < 4) return "labor";
  if (col === 4 && row >= 4) return "coalition-rural";
  if (col === 5 || col === 6) return "coalition-rural";
  return "coalition-safe";
}

function buildSeats(): Seat[] {
  return Array.from({ length: SEAT_COUNT }, (_, i): Seat => ({
    kind: getSeatKind(i),
    pressure: 0,
    tipped: false,
  }));
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function lerpHex(from: string, to: string, t: number): string {
  const [fr, fg, fb] = hexToRgb(from);
  const [tr, tg, tb] = hexToRgb(to);
  const r = Math.round(fr + (tr - fr) * t);
  const g = Math.round(fg + (tg - fg) * t);
  const b = Math.round(fb + (tb - fb) * t);
  return `rgb(${r},${g},${b})`;
}

const COLORS = {
  bg: "#e8d5b0",
  labor: "#5b7fa6",
  tipped: "#4a7a9b",
  coalSafe: "#c27d3e",
  coalRural: "#d4a850",
  fading: "#9eb5bc",
  text: "#5a3c1a",
  textLight: "#8a6545",
};

function getLayout(size: number) {
  const hdrH = Math.round(size * 0.11);
  const ftrH = Math.round(size * 0.09);
  const pad = Math.round(size * 0.025);
  const gridTop = hdrH;
  const gridH = size - hdrH - ftrH;
  const cellW = (size - pad * 2) / COLS;
  const cellH = gridH / ROWS;
  const gap = Math.max(1, Math.floor(Math.min(cellW, cellH) * 0.1));
  return { hdrH, ftrH, pad, gridTop, gridH, cellW, cellH, gap };
}

export default function FifteenSeats() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seatsRef = useRef<Seat[]>(buildSeats());
  const tippedRef = useRef(0);
  const isDownRef = useRef(false);
  const lastSeatRef = useRef(-1);
  const sizeRef = useRef(0);
  const needsRedrawRef = useRef(true);
  const rafRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = sizeRef.current;
    if (size < 1) return;

    const { hdrH, ftrH, pad, gridTop, gridH, cellW, cellH, gap } = getLayout(size);
    const tipped = tippedRef.current;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, size, size);

    // Seat grid
    const seats = seatsRef.current;
    seats.forEach((seat, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = pad + col * cellW;
      const y = gridTop + row * cellH;
      const sw = cellW - gap;
      const sh = cellH - gap;

      let color: string;
      if (seat.kind === "labor") {
        color = COLORS.labor;
      } else if (seat.kind === "coalition-safe") {
        color = COLORS.coalSafe;
      } else if (seat.tipped) {
        color = COLORS.tipped;
      } else {
        color = lerpHex(COLORS.coalRural, COLORS.fading, seat.pressure);
      }

      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(sw), Math.round(sh));
    });

    // Header
    const hdrY = hdrH / 2;
    const fs = Math.max(9, Math.round(size * 0.033));
    ctx.font = `${fs}px monospace`;
    ctx.textBaseline = "middle";

    ctx.fillStyle = COLORS.coalSafe;
    ctx.textAlign = "left";
    ctx.fillText(`coalition ${INITIAL_COALITION - tipped}`, pad, hdrY);

    ctx.fillStyle = COLORS.labor;
    ctx.textAlign = "center";
    ctx.fillText(`labor ${36 + tipped}`, size / 2, hdrY);

    ctx.fillStyle = COLORS.textLight;
    ctx.textAlign = "right";
    ctx.fillText("88 seats · VIC 1999", size - pad, hdrY);

    // Footer
    const ftrY = gridTop + gridH + ftrH / 2;
    const fsSmall = Math.max(8, Math.round(size * 0.03));
    ctx.font = `${fsSmall}px monospace`;

    ctx.fillStyle = COLORS.textLight;
    ctx.textAlign = "left";
    ctx.fillText("drag rural seats to erase", pad, ftrY);

    ctx.textAlign = "right";
    if (tipped === 0) {
      ctx.fillStyle = COLORS.textLight;
      ctx.fillText("0 of 15", size - pad, ftrY);
    } else if (tipped < MAJORITY_SWING) {
      ctx.fillStyle = COLORS.text;
      ctx.fillText(`${tipped} of 15`, size - pad, ftrY);
    } else {
      ctx.fillStyle = COLORS.labor;
      ctx.fillText(`majority lost — ${tipped} seats swung`, size - pad, ftrY);
    }

    // Divider lines
    ctx.strokeStyle = COLORS.bg;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, hdrH);
    ctx.lineTo(size, hdrH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, gridTop + gridH);
    ctx.lineTo(size, gridTop + gridH);
    ctx.stroke();
  }, []);

  const getSeatAt = useCallback((clientX: number, clientY: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return -1;
    const rect = canvas.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const size = sizeRef.current;
    if (size < 1) return -1;

    const { hdrH, pad, gridTop, gridH, cellW, cellH } = getLayout(size);

    if (localY < hdrH || localY > gridTop + gridH) return -1;

    const col = Math.floor((localX - pad) / cellW);
    const row = Math.floor((localY - gridTop) / cellH);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return -1;
    return row * COLS + col;
  }, []);

  const applyErase = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDownRef.current) return;
      const idx = getSeatAt(clientX, clientY);
      if (idx === lastSeatRef.current) return;
      lastSeatRef.current = idx;
      if (idx < 0) return;
      const seat = seatsRef.current[idx];
      if (seat.kind !== "coalition-rural" || seat.tipped) return;
      seat.pressure = Math.min(1, seat.pressure + 0.35);
      if (seat.pressure >= 1) {
        seat.tipped = true;
        tippedRef.current += 1;
      }
      needsRedrawRef.current = true;
    },
    [getSeatAt],
  );

  // Animation loop
  useEffect(() => {
    const loop = () => {
      if (needsRedrawRef.current) {
        needsRedrawRef.current = false;
        draw();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  // Canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fitCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const size = Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
      sizeRef.current = size;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      needsRedrawRef.current = true;
    };

    fitCanvas();
    const ro = new ResizeObserver(fitCanvas);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Pointer events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e: PointerEvent) => {
      isDownRef.current = true;
      lastSeatRef.current = -1;
      canvas.setPointerCapture(e.pointerId);
      applyErase(e.clientX, e.clientY);
    };
    const onMove = (e: PointerEvent) => applyErase(e.clientX, e.clientY);
    const onUp = () => {
      isDownRef.current = false;
      lastSeatRef.current = -1;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [applyErase]);

  // Testability hooks
  useEffect(() => {
    window.fifteen_seats_render_to_text = () => {
      const t = tippedRef.current;
      const coalition = INITIAL_COALITION - t;
      return `tipped=${t} coalition=${coalition} majority=${coalition >= 45 ? "yes" : "lost"}`;
    };
    window.fifteen_seats_advance = (steps: number) => {
      const n = Math.max(0, Math.floor(Number.isFinite(steps) ? steps : 0));
      const seats = seatsRef.current;
      let advanced = 0;
      for (let i = 0; i < seats.length && advanced < n; i++) {
        const seat = seats[i];
        if (seat.kind === "coalition-rural" && !seat.tipped) {
          seat.pressure = 1;
          seat.tipped = true;
          tippedRef.current += 1;
          advanced++;
        }
      }
      needsRedrawRef.current = true;
    };
    return () => {
      delete window.fifteen_seats_render_to_text;
      delete window.fifteen_seats_advance;
    };
  }, []);

  return (
    <div className="w-full h-full" style={{ background: COLORS.bg }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        style={{ display: "block", cursor: "crosshair" }}
      />
    </div>
  );
}
