"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    altitude_dispatch_render_to_text?: () => string;
    altitude_dispatch_advance?: (steps: number) => void;
  }
}

const FIELDS = [
  { label: "LOCALITY", value: "WALISO" },
  { label: "ZONE", value: "SW SHEWA ZONE" },
  { label: "COORDINATES", value: "8\u00b032\u2032N  37\u00b058\u2032E" },
  { label: "ELEVATION", value: "2,063 m ASL" },
  { label: "DISTANCE", value: "114 km ADDIS" },
];

const MAX_DRIFT = 1.0;

function computeCoherence(drift: number[]): number {
  const avg = drift.reduce((sum, d) => sum + Math.abs(d), 0) / drift.length;
  return Math.max(0, Math.min(100, 100 - avg * 100));
}

function drawFrame(
  canvas: HTMLCanvasElement,
  drift: number[],
  coherence: number,
  shakes: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  // scale from a 480-unit logical grid to actual physical pixels
  const s = W / 480;

  // ── background ────────────────────────────────────────────────────────────
  ctx.fillStyle = "#f5f1eb";
  ctx.fillRect(0, 0, W, H);

  const pad = Math.round(28 * s);
  const labelCol = pad;
  const valueCol = Math.round(192 * s);
  const rowH = Math.round(50 * s);
  const startY = Math.round(90 * s);
  const mono = `var(--font-geist-mono, "Courier New", monospace)`;

  // ── header ────────────────────────────────────────────────────────────────
  ctx.fillStyle = "#1a1815";
  ctx.font = `bold ${Math.round(10 * s)}px ${mono}`;
  ctx.fillText("ADMINISTRATIVE INTAKE — FORM 2063", labelCol, Math.round(38 * s));

  ctx.fillStyle = "#9a9088";
  ctx.font = `${Math.round(8 * s)}px ${mono}`;
  ctx.fillText("OROMIA REGION · ETHIOPIA", labelCol, Math.round(55 * s));

  // top rule
  ctx.fillStyle = "#1a1815";
  ctx.fillRect(pad, Math.round(66 * s), W - pad * 2, Math.round(1.5 * s));

  // ── fields ────────────────────────────────────────────────────────────────
  for (let i = 0; i < FIELDS.length; i++) {
    const { label, value } = FIELDS[i];
    const rowY = startY + i * rowH;
    // max pixel displacement at full drift
    const xOffset = drift[i] * 34 * s;

    ctx.fillStyle = "#9a9088";
    ctx.font = `${Math.round(8 * s)}px ${mono}`;
    ctx.fillText(label, labelCol, rowY);

    ctx.fillStyle = "#1a1815";
    ctx.font = `bold ${Math.round(13 * s)}px ${mono}`;
    ctx.fillText(value, valueCol + xOffset, rowY + Math.round(2 * s));

    // separator
    if (i < FIELDS.length - 1) {
      ctx.fillStyle = "#ddd5cb";
      ctx.fillRect(pad, rowY + Math.round(14 * s), W - pad * 2, Math.round(1 * s));
    }
  }

  // ── status line ──────────────────────────────────────────────────────────
  const statusY = startY + FIELDS.length * rowH + Math.round(8 * s);
  const status =
    coherence < 40 ? "UNVERIFIED" : coherence < 70 ? "DEGRADING" : "VERIFIED";
  const statusColor =
    coherence < 40 ? "#c53d2a" : coherence < 70 ? "#a06020" : "#1a1815";

  ctx.fillStyle = "#9a9088";
  ctx.font = `${Math.round(8 * s)}px ${mono}`;
  ctx.fillText("STATUS", labelCol, statusY);

  ctx.fillStyle = statusColor;
  ctx.font = `bold ${Math.round(13 * s)}px ${mono}`;
  ctx.fillText(status, valueCol, statusY + Math.round(2 * s));

  // bottom rule
  const ruleY = statusY + Math.round(20 * s);
  ctx.fillStyle = "#1a1815";
  ctx.fillRect(pad, ruleY, W - pad * 2, Math.round(1.5 * s));

  // ── coherence meter ──────────────────────────────────────────────────────
  const meterLabelY = ruleY + Math.round(22 * s);
  const meterBarY = meterLabelY + Math.round(7 * s);
  const meterH = Math.round(14 * s);
  const meterW = W - pad * 2;

  ctx.fillStyle = "#9a9088";
  ctx.font = `${Math.round(8 * s)}px ${mono}`;
  ctx.fillText("RECORD COHERENCE", labelCol, meterLabelY);

  // track
  ctx.fillStyle = "#ddd5cb";
  ctx.fillRect(pad, meterBarY, meterW, meterH);

  // fill — already in the red on load; climbs to amber, then green
  const fillW = Math.round(meterW * (coherence / 100));
  ctx.fillStyle =
    coherence < 40 ? "#c53d2a" : coherence < 70 ? "#c57020" : "#3a6a2a";
  ctx.fillRect(pad, meterBarY, fillW, meterH);

  // percentage label inside bar
  ctx.fillStyle = "#f5f1eb";
  ctx.font = `bold ${Math.round(9 * s)}px ${mono}`;
  ctx.fillText(
    `${Math.round(coherence)}%`,
    pad + Math.round(5 * s),
    meterBarY + Math.round(11 * s),
  );

  // ── footer ────────────────────────────────────────────────────────────────
  ctx.fillStyle = "#9a9088";
  ctx.font = `${Math.round(7.5 * s)}px ${mono}`;
  ctx.fillText(
    `SHAKES: ${shakes}   ·   DRAG FAST TO RESTORE RECORD`,
    labelCol,
    H - Math.round(18 * s),
  );
}

export default function AltitudeDispatch() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // normalized drift per field [-1, 1]; pre-seeded so meter starts in the red
  const driftRef = useRef<number[]>(FIELDS.map((_, i) => 0.35 + i * 0.06));
  const driftVelRef = useRef<number[]>(FIELDS.map(() => 0));
  const coherenceRef = useRef(computeCoherence(FIELDS.map((_, i) => 0.35 + i * 0.06)));
  const shakesRef = useRef(0);
  const lastPtrRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const rafRef = useRef(0);
  const frameRef = useRef(0);

  // ── resize observer ───────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const size = container.clientWidth;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ── animation loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mounted = true;

    const tick = () => {
      if (!mounted) return;

      const frame = ++frameRef.current;
      const drift = driftRef.current;
      const vel = driftVelRef.current;

      // slowly perturb each field in its own rhythm
      for (let i = 0; i < FIELDS.length; i++) {
        const rate = 0.00025 * (1 + i * 0.19);
        const dir = Math.sin(frame * 0.00065 + i * 1.37) > 0 ? 1 : -1;
        vel[i] += dir * rate;
        vel[i] *= 0.986; // gentle damping
        drift[i] = Math.max(
          -MAX_DRIFT,
          Math.min(MAX_DRIFT, drift[i] + vel[i]),
        );
      }

      coherenceRef.current = computeCoherence(drift);

      if (canvas.width > 0 && canvas.height > 0) {
        drawFrame(canvas, drift, coherenceRef.current, shakesRef.current);
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      mounted = false;
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── testability hooks ─────────────────────────────────────────────────────
  useEffect(() => {
    window.altitude_dispatch_render_to_text = () => {
      const c = Math.round(coherenceRef.current);
      const status =
        c < 40 ? "UNVERIFIED" : c < 70 ? "DEGRADING" : "VERIFIED";
      return `Altitude Dispatch | coherence:${c}% | status:${status} | shakes:${shakesRef.current}`;
    };

    window.altitude_dispatch_advance = (steps: number) => {
      const n = Math.max(0, Math.floor(steps));
      const drift = driftRef.current;
      const vel = driftVelRef.current;
      for (let s = 0; s < n; s++) {
        for (let i = 0; i < drift.length; i++) {
          vel[i] *= 0.986;
          drift[i] = Math.max(
            -MAX_DRIFT,
            Math.min(MAX_DRIFT, drift[i] + vel[i]),
          );
        }
      }
      coherenceRef.current = computeCoherence(drift);
    };

    return () => {
      delete window.altitude_dispatch_render_to_text;
      delete window.altitude_dispatch_advance;
    };
  }, []);

  // ── shake detection ───────────────────────────────────────────────────────
  const triggerShake = () => {
    shakesRef.current++;
    const drift = driftRef.current;
    const vel = driftVelRef.current;
    for (let i = 0; i < drift.length; i++) {
      // strong restoring impulse → snap motion
      vel[i] = -drift[i] * 0.35 + (Math.random() - 0.5) * 0.015;
      drift[i] *= 0.28;
    }
    coherenceRef.current = computeCoherence(drift);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    lastPtrRef.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const prev = lastPtrRef.current;
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    const dt = Math.max(1, e.timeStamp - prev.t);
    const velocity = Math.hypot(dx, dy) / dt;
    lastPtrRef.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    if (velocity > 0.9) {
      triggerShake();
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    lastPtrRef.current = null;
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#f5f1eb]">
      <canvas
        ref={canvasRef}
        className="block cursor-crosshair touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
