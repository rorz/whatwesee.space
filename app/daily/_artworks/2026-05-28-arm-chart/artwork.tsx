"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    arm_chart_render_to_text?: () => string;
    arm_chart_advance?: (steps: number) => void;
  }
}

type Pitch = {
  relX: number; // 0–1 within zone
  relY: number; // 0–1 within zone
  sector: number; // 0–8 row-major
};

const SCOUT_READS: string[] = [
  "arm slot holding",
  "releasing early — watch the shoulder",
  "good extension, missing outside",
  "clusters high in the zone",
  "keeps the breaking ball below the knees",
  "low-and-away every time — hitters will adjust",
  "three pitches, same spot — that is a tell",
  "needs to work inside more",
  "the arm is lying about the fastball",
  "consistent with the two-seamer down",
  "favoring the glove side, no idea why",
  "count gets long, location drifts up",
];

// Zone in normalized canvas coords (0–1 range)
const ZONE = { x: 0.22, y: 0.14, w: 0.56, h: 0.52 };

export default function ArmChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef(0);
  const pitchesRef = useRef<Pitch[]>([]);
  const sectorCountsRef = useRef<number[]>(Array.from({ length: 9 }, () => 0));
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);
  const readIndexRef = useRef(0);
  const [pitchCount, setPitchCount] = useState(0);
  const [scoutRead, setScoutRead] = useState("");

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  const draw = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const size = sizeRef.current;
    if (size === 0) return;

    ctx.clearRect(0, 0, size, size);

    // Background gradient — warm stone
    const bg = ctx.createLinearGradient(0, 0, 0, size);
    bg.addColorStop(0, "#5c5850");
    bg.addColorStop(1, "#38352e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    const zx = ZONE.x * size;
    const zy = ZONE.y * size;
    const zw = ZONE.w * size;
    const zh = ZONE.h * size;

    // Heat overlay per sector
    const counts = sectorCountsRef.current;
    const maxCount = Math.max(...counts, 1);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col;
        const heat = counts[idx] / maxCount;
        if (heat > 0) {
          const sx = zx + (col * zw) / 3;
          const sy = zy + (row * zh) / 3;
          const sw = zw / 3;
          const sh = zh / 3;
          // Warm orange heat: #e05c1a at full intensity
          ctx.fillStyle = `rgba(224, 92, 26, ${0.12 + heat * 0.58})`;
          ctx.fillRect(sx, sy, sw, sh);
        }
      }
    }

    // Zone border — chalk white
    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.strokeRect(zx, zy, zw, zh);

    // Inner 3×3 grid — faint dashes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 1; i <= 2; i++) {
      ctx.moveTo(zx + (i * zw) / 3, zy);
      ctx.lineTo(zx + (i * zw) / 3, zy + zh);
      ctx.moveTo(zx, zy + (i * zh) / 3);
      ctx.lineTo(zx + zw, zy + (i * zh) / 3);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Home plate — trapezoid below zone
    const plateCX = size / 2;
    const plateTopY = (ZONE.y + ZONE.h + 0.065) * size;
    const plateW = ZONE.w * 0.68 * size;
    const plateTip = plateTopY + size * 0.055;
    ctx.beginPath();
    ctx.moveTo(plateCX - plateW / 2, plateTopY);
    ctx.lineTo(plateCX + plateW / 2, plateTopY);
    ctx.lineTo(plateCX + plateW * 0.32, plateTopY + size * 0.034);
    ctx.lineTo(plateCX, plateTip);
    ctx.lineTo(plateCX - plateW * 0.32, plateTopY + size * 0.034);
    ctx.closePath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fill();

    // Zone label
    ctx.font = `${Math.max(9, size * 0.022)}px monospace`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
    ctx.textAlign = "center";
    ctx.fillText("STRIKE ZONE", zx + zw / 2, zy - size * 0.018);

    // Placed pitches
    const pitches = pitchesRef.current;
    const dotR = Math.max(4, size * 0.012);
    for (const p of pitches) {
      const px = (ZONE.x + p.relX * ZONE.w) * size;
      const py = (ZONE.y + p.relY * ZONE.h) * size;
      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fillStyle = "#e05c1a";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Drag-in-progress arc
    if (isDraggingRef.current && dragStartRef.current && currentPosRef.current) {
      const s = dragStartRef.current;
      const e = currentPosRef.current;
      const cpx = ((s.x + e.x) / 2) * size;
      const cpy = ((s.y + e.y) / 2 - 0.07) * size;
      ctx.beginPath();
      ctx.moveTo(s.x * size, s.y * size);
      ctx.quadraticCurveTo(cpx, cpy, e.x * size, e.y * size);
      ctx.strokeStyle = "rgba(224, 92, 26, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // End indicator
      const isInZone =
        e.x >= ZONE.x &&
        e.x <= ZONE.x + ZONE.w &&
        e.y >= ZONE.y &&
        e.y <= ZONE.y + ZONE.h;
      ctx.beginPath();
      ctx.arc(e.x * size, e.y * size, dotR * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = isInZone ? "#e05c1a" : "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Pitch count — bottom right
    if (pitches.length > 0) {
      ctx.font = `${Math.max(8, size * 0.02)}px monospace`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.textAlign = "right";
      ctx.fillText(
        `${pitches.length} pitch${pitches.length !== 1 ? "es" : ""}`,
        size - size * 0.025,
        size - size * 0.02,
      );
    }
  }, [getCtx]);

  const resize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const cssSize = container.clientWidth;
    sizeRef.current = cssSize;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }, [draw]);

  const toNorm = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const size = sizeRef.current;
    return {
      x: (clientX - rect.left) / size,
      y: (clientY - rect.top) / size,
    };
  }, []);

  const commitPitch = useCallback(
    (norm: { x: number; y: number }) => {
      if (
        norm.x < ZONE.x ||
        norm.x > ZONE.x + ZONE.w ||
        norm.y < ZONE.y ||
        norm.y > ZONE.y + ZONE.h
      ) {
        return;
      }
      const relX = (norm.x - ZONE.x) / ZONE.w;
      const relY = (norm.y - ZONE.y) / ZONE.h;
      const col = Math.min(2, Math.floor(relX * 3));
      const row = Math.min(2, Math.floor(relY * 3));
      const sector = row * 3 + col;
      pitchesRef.current = [...pitchesRef.current, { relX, relY, sector }];
      sectorCountsRef.current[sector]++;
      const count = pitchesRef.current.length;
      setPitchCount(count);
      if (count % 3 === 0) {
        const read = SCOUT_READS[readIndexRef.current % SCOUT_READS.length];
        readIndexRef.current++;
        setScoutRead(read);
      }
    },
    [],
  );

  // Mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      const n = toNorm(e.clientX, e.clientY);
      dragStartRef.current = n;
      currentPosRef.current = n;
      draw();
    };
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      currentPosRef.current = toNorm(e.clientX, e.clientY);
      draw();
    };
    const onUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      commitPitch(toNorm(e.clientX, e.clientY));
      dragStartRef.current = null;
      currentPosRef.current = null;
      draw();
    };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [toNorm, commitPitch, draw]);

  // Touch events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      isDraggingRef.current = true;
      const n = toNorm(t.clientX, t.clientY);
      dragStartRef.current = n;
      currentPosRef.current = n;
      draw();
    };
    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDraggingRef.current) return;
      const t = e.touches[0];
      if (!t) return;
      currentPosRef.current = toNorm(t.clientX, t.clientY);
      draw();
    };
    const onEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const t = e.changedTouches[0];
      if (t) commitPitch(toNorm(t.clientX, t.clientY));
      dragStartRef.current = null;
      currentPosRef.current = null;
      draw();
    };

    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, [toNorm, commitPitch, draw]);

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    resize();
    return () => ro.disconnect();
  }, [resize]);

  // Window hooks
  useEffect(() => {
    window.arm_chart_render_to_text = () => {
      const counts = sectorCountsRef.current;
      return `pitches:${pitchesRef.current.length};sectors:${counts.join(",")}`;
    };
    window.arm_chart_advance = (steps: number) => {
      for (let i = 0; i < steps; i++) {
        const relX = 0.15 + Math.random() * 0.7;
        const relY = 0.15 + Math.random() * 0.7;
        const col = Math.min(2, Math.floor(relX * 3));
        const row = Math.min(2, Math.floor(relY * 3));
        const sector = row * 3 + col;
        pitchesRef.current = [...pitchesRef.current, { relX, relY, sector }];
        sectorCountsRef.current[sector]++;
        const count = pitchesRef.current.length;
        if (count % 3 === 0) {
          const read = SCOUT_READS[readIndexRef.current % SCOUT_READS.length];
          readIndexRef.current++;
          setScoutRead(read);
        }
      }
      setPitchCount(pitchesRef.current.length);
      draw();
    };
    return () => {
      delete window.arm_chart_render_to_text;
      delete window.arm_chart_advance;
    };
  }, [draw]);

  // Redraw when pitch count changes
  useEffect(() => {
    draw();
  }, [pitchCount, draw]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative", cursor: "crosshair" }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
      {scoutRead && (
        <div
          style={{
            position: "absolute",
            bottom: "3%",
            left: "4%",
            right: "12%",
            fontFamily: "monospace",
            fontSize: "clamp(9px, 2.2vw, 12px)",
            color: "rgba(255, 255, 255, 0.72)",
            backgroundColor: "rgba(0, 0, 0, 0.38)",
            padding: "4px 8px",
            borderLeft: "2px solid #e05c1a",
            pointerEvents: "none",
            lineHeight: 1.4,
          }}
        >
          {scoutRead}
        </div>
      )}
    </div>
  );
}
