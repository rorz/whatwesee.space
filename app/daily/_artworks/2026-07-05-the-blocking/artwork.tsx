"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    the_blocking_render_to_text?: () => string;
    the_blocking_advance?: (steps: number) => void;
  }
}

interface Vec2 {
  x: number;
  y: number;
}

interface Keyframe {
  t: number;
  pos: Vec2;
  angle: number;
}

interface Actor {
  id: number;
  color: string;
  label: string;
  keyframes: Keyframe[];
}

const INITIAL_ACTORS: Actor[] = [
  {
    id: 0,
    color: "#c93030",
    label: "A",
    keyframes: [
      { t: 0, pos: { x: 0.18, y: 0.28 }, angle: 0.4 },
      { t: 28, pos: { x: 0.55, y: 0.2 }, angle: 1.9 },
      { t: 55, pos: { x: 0.8, y: 0.55 }, angle: 3.2 },
      { t: 80, pos: { x: 0.42, y: 0.72 }, angle: 4.6 },
    ],
  },
  {
    id: 1,
    color: "#1a6eb5",
    label: "B",
    keyframes: [
      { t: 0, pos: { x: 0.65, y: 0.25 }, angle: 2.1 },
      { t: 38, pos: { x: 0.25, y: 0.6 }, angle: 0.9 },
      { t: 65, pos: { x: 0.7, y: 0.7 }, angle: 5.1 },
      { t: 90, pos: { x: 0.5, y: 0.42 }, angle: 2.6 },
    ],
  },
  {
    id: 2,
    color: "#b87a10",
    label: "C",
    keyframes: [
      { t: 0, pos: { x: 0.38, y: 0.65 }, angle: 5.6 },
      { t: 42, pos: { x: 0.82, y: 0.48 }, angle: 1.1 },
      { t: 72, pos: { x: 0.2, y: 0.38 }, angle: 3.9 },
      { t: 95, pos: { x: 0.6, y: 0.58 }, angle: 0.3 },
    ],
  },
];

const STAGE_SPLIT = 0.78;
const GRID_DIVS = 6;
const TL_PAD_X = 36;
const ACTOR_SIZE = 0.048;
const LOOP_DURATION = 14;
const SPEED = 100 / LOOP_DURATION;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function getPose(kfs: Keyframe[], t: number): { pos: Vec2; angle: number } {
  if (kfs.length === 0) return { pos: { x: 0.5, y: 0.5 }, angle: 0 };
  if (kfs.length === 1) return { pos: kfs[0].pos, angle: kfs[0].angle };

  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  let prevKf = last;
  let nextT = first.t + 100;
  let nextPos = first.pos;
  let nextAngle = first.angle;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (t >= sorted[i].t && t < sorted[i + 1].t) {
      prevKf = sorted[i];
      nextT = sorted[i + 1].t;
      nextPos = sorted[i + 1].pos;
      nextAngle = sorted[i + 1].angle;
      break;
    }
  }

  const span = nextT - prevKf.t;
  if (span <= 0) return { pos: prevKf.pos, angle: prevKf.angle };
  const alpha = (t - prevKf.t) / span;

  return {
    pos: {
      x: lerp(prevKf.pos.x, nextPos.x, alpha),
      y: lerp(prevKf.pos.y, nextPos.y, alpha),
    },
    angle: lerpAngle(prevKf.angle, nextAngle, alpha),
  };
}

export default function TheBlocking() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let S = 0;
    let rafId = 0;
    let playT = 0;
    let lastTs = -1;

    const actors: Actor[] = INITIAL_ACTORS.map((a) => ({
      ...a,
      keyframes: a.keyframes.map((kf) => ({ ...kf, pos: { ...kf.pos } })),
    }));

    const display: Array<{ x: number; y: number; angle: number }> = actors.map(
      (a) => ({ x: a.keyframes[0].pos.x, y: a.keyframes[0].pos.y, angle: a.keyframes[0].angle }),
    );

    let resetCountdown = -1;
    let resetTimerId: ReturnType<typeof setInterval> | null = null;

    const totalKf = () => actors.reduce((s, a) => s + a.keyframes.length, 0);

    const startReset = () => {
      if (resetTimerId !== null) return;
      resetCountdown = 4;
      resetTimerId = setInterval(() => {
        resetCountdown--;
        if (resetCountdown <= 0) {
          clearInterval(resetTimerId!);
          resetTimerId = null;
          resetCountdown = -1;
          actors.forEach((a, i) => {
            a.keyframes = INITIAL_ACTORS[i].keyframes.map((kf) => ({
              ...kf,
              pos: { ...kf.pos },
            }));
          });
        }
      }, 1000);
    };

    const fit = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      S = Math.min(rect.width, rect.height);
      canvas.width = Math.floor(S * dpr);
      canvas.height = Math.floor(S * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      if (S <= 0) return;

      const stageH = S * STAGE_SPLIT;
      const tlH = S - stageH;
      const tlTop = stageH;
      const actorSz = ACTOR_SIZE * S;

      ctx.clearRect(0, 0, S, S);

      ctx.fillStyle = "#e86828";
      ctx.fillRect(0, 0, S, stageH);

      ctx.strokeStyle = "#d45c1e";
      ctx.lineWidth = 0.5;
      for (let i = 1; i < GRID_DIVS; i++) {
        const gx = (i / GRID_DIVS) * S;
        const gy = (i / GRID_DIVS) * stageH;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, stageH);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(S, gy);
        ctx.stroke();
      }

      actors.forEach((actor) => {
        actor.keyframes.forEach((kf) => {
          const mx = kf.pos.x * S;
          const my = kf.pos.y * stageH;
          const s = 5;
          ctx.strokeStyle = actor.color + "66";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(mx - s, my - s);
          ctx.lineTo(mx + s, my + s);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(mx + s, my - s);
          ctx.lineTo(mx - s, my + s);
          ctx.stroke();
        });
      });

      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `bold ${Math.max(8, S * 0.028)}px monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("\u25B6 CAM", S * 0.03, S * 0.03);
      ctx.restore();

      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.38)";
      ctx.font = `${Math.max(7, S * 0.022)}px monospace`;
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText("PRE-VIZ  SCENE 1", S - S * 0.03, S * 0.03);
      ctx.restore();

      actors.forEach((actor, i) => {
        const d = display[i];
        const cx = d.x * S;
        const cy = d.y * stageH;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.22)";
        ctx.shadowBlur = 5;
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillRect(cx - actorSz, cy - actorSz, actorSz * 2, actorSz * 2);
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(d.angle);
        ctx.fillStyle = actor.color;
        ctx.beginPath();
        ctx.moveTo(actorSz * 0.9, 0);
        ctx.lineTo(-actorSz * 0.4, actorSz * 0.5);
        ctx.lineTo(-actorSz * 0.4, -actorSz * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = actor.color;
        ctx.font = `bold ${Math.max(8, actorSz * 0.85)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(actor.label, cx, cy);
        ctx.restore();
      });

      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, tlTop, S, tlH);
      ctx.fillStyle = "#2e2e2e";
      ctx.fillRect(0, tlTop, S, 1);

      const laneH = tlH / INITIAL_ACTORS.length;
      const tlLeft = TL_PAD_X;
      const tlRight = S - TL_PAD_X;
      const tlWidth = tlRight - tlLeft;

      INITIAL_ACTORS.forEach((origActor, rowIdx) => {
        const actor = actors[rowIdx];
        const laneY = tlTop + rowIdx * laneH;
        const laneMid = laneY + laneH * 0.5;

        if (rowIdx > 0) {
          ctx.strokeStyle = "#2a2a2a";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, laneY);
          ctx.lineTo(S, laneY);
          ctx.stroke();
        }

        ctx.fillStyle = origActor.color;
        ctx.font = `bold ${Math.max(8, laneH * 0.38)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(origActor.label, TL_PAD_X * 0.5, laneMid);

        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tlLeft, laneMid);
        ctx.lineTo(tlRight, laneMid);
        ctx.stroke();

        actor.keyframes.forEach((kf) => {
          const kx = tlLeft + (kf.t / 100) * tlWidth;
          const ds = Math.max(4, laneH * 0.22);
          ctx.fillStyle = origActor.color;
          ctx.beginPath();
          ctx.moveTo(kx, laneMid - ds);
          ctx.lineTo(kx + ds, laneMid);
          ctx.lineTo(kx, laneMid + ds);
          ctx.lineTo(kx - ds, laneMid);
          ctx.closePath();
          ctx.fill();
        });
      });

      const phX = tlLeft + (playT / 100) * tlWidth;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(phX, tlTop);
      ctx.lineTo(phX, tlTop + tlH);
      ctx.stroke();
      ctx.setLineDash([]);

      if (resetCountdown > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, stageH * 0.28, S, stageH * 0.44);
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(10, S * 0.04)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`BLOCKING RESETS IN ${resetCountdown}`, S * 0.5, stageH * 0.5);
      }
    };

    const step = (dt: number) => {
      playT = (playT + SPEED * dt) % 100;

      actors.forEach((actor, i) => {
        const d = display[i];
        if (actor.keyframes.length > 0) {
          const target = getPose(actor.keyframes, playT);
          d.x = lerp(d.x, target.pos.x, 0.15);
          d.y = lerp(d.y, target.pos.y, 0.15);
          d.angle = lerpAngle(d.angle, target.angle, 0.15);
        } else {
          d.x = lerp(d.x, 0.5, 0.025);
          d.y = lerp(d.y, 0.5, 0.025);
          d.angle = lerpAngle(d.angle, 0, 0.025);
        }
      });
    };

    const loop = (ts: number) => {
      if (lastTs < 0) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.1);
      lastTs = ts;
      step(dt);
      draw();
      rafId = window.requestAnimationFrame(loop);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    rafId = window.requestAnimationFrame(loop);

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * S;
      const cy = ((e.clientY - rect.top) / rect.height) * S;

      const stageH = S * STAGE_SPLIT;
      const tlH = S - stageH;
      if (cy <= stageH) return;

      const laneH = tlH / INITIAL_ACTORS.length;
      const rowIdx = Math.floor((cy - stageH) / laneH);
      if (rowIdx < 0 || rowIdx >= INITIAL_ACTORS.length) return;

      const actor = actors[rowIdx];
      const tlLeft = TL_PAD_X;
      const tlRight = S - TL_PAD_X;
      const tlWidth = tlRight - tlLeft;
      const hitR = 14;

      let closestIdx = -1;
      let closestDist = Infinity;
      actor.keyframes.forEach((kf, idx) => {
        const kx = tlLeft + (kf.t / 100) * tlWidth;
        const d = Math.abs(cx - kx);
        if (d < hitR && d < closestDist) {
          closestDist = d;
          closestIdx = idx;
        }
      });

      if (closestIdx >= 0) {
        actor.keyframes.splice(closestIdx, 1);
        if (totalKf() === 0 && resetTimerId === null) {
          startReset();
        }
      }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    window.the_blocking_render_to_text = () => {
      const total = totalKf();
      const max = INITIAL_ACTORS.reduce((s, a) => s + a.keyframes.length, 0);
      const labels = actors.map((a) => `${a.label}:${a.keyframes.length}kf`).join(" ");
      return `blocking: ${total}/${max} keyframes (${labels}) t=${playT.toFixed(1)}`;
    };

    window.the_blocking_advance = (steps: number) => {
      const n = Math.max(0, Math.floor(Number.isFinite(steps) ? steps : 0));
      for (let i = 0; i < n; i++) step(1 / 60);
    };

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      if (resetTimerId !== null) clearInterval(resetTimerId);
      delete window.the_blocking_render_to_text;
      delete window.the_blocking_advance;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full touch-none select-none"
      aria-label="A pre-visualization stage with three actors — A, B, and C — cycling through their blocking on an orange floor. A dark timeline strip at the bottom shows keyframe diamonds for each actor lane. Click a diamond to erase that blocking mark."
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair" />
    </div>
  );
}
