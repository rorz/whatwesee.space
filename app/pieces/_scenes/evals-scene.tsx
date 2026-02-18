"use client";

import { useEffect, useRef } from "react";
import PieceNavigationControls from "../_components/piece-navigation-controls";
import { PIECE_COUNT } from "../_lib/piece-constants";

type RgbColor = readonly [number, number, number];

type EvalSlider = {
  active: boolean;
  x: number;
  y: number;
  depth: number;
  fog: number;
  angle: number;
  t: number;
  speed: number;
  spawnX: number;
  spawnY: number;
  orbitRadius: number;
  orbitTurns: number;
  orbitStart: number;
  wobble: number;
  width: number;
  height: number;
  glow: number;
  isRight: boolean;
  label: string;
  batch: number;
  value: number;
  tintA: RgbColor;
  tintB: RgbColor;
  edge: RgbColor;
  glowColor: RgbColor;
};

type EvalsStateSummary = {
  piece: number;
  title: string;
  coordinateSystem: string;
  activeCards: number;
  drain: {
    x: number;
    y: number;
    radius: number;
    fog: number;
  };
  pointer: {
    active: boolean;
    x: number | null;
    y: number | null;
  };
  sampleCards: Array<{
    x: number;
    y: number;
    depth: number;
    label: string;
    fog: number;
  }>;
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => Promise<void>;
  }
}

const WHITE: RgbColor = [255, 255, 255];

const WRONG_LABELS = [
  "THIS IS WRONG",
  "FAILED EVAL",
  "MISMATCH",
  "REJECTED",
  "CONTRADICTION",
  "DRIFT",
] as const;

const RIGHT_LABELS = ["THIS IS RIGHT", "APPROVED", "PASSED EVAL", "ALIGNED"] as const;

const WRONG_COLORS = [
  {
    tintA: [255, 44, 204] as RgbColor,
    tintB: [84, 232, 255] as RgbColor,
    edge: [255, 214, 248] as RgbColor,
    glowColor: [255, 90, 214] as RgbColor,
  },
  {
    tintA: [255, 30, 138] as RgbColor,
    tintB: [74, 176, 255] as RgbColor,
    edge: [255, 194, 234] as RgbColor,
    glowColor: [255, 96, 200] as RgbColor,
  },
  {
    tintA: [255, 78, 236] as RgbColor,
    tintB: [42, 236, 255] as RgbColor,
    edge: [255, 220, 255] as RgbColor,
    glowColor: [255, 122, 238] as RgbColor,
  },
] as const;

const RIGHT_COLORS = [
  {
    tintA: [66, 255, 188] as RgbColor,
    tintB: [90, 234, 255] as RgbColor,
    edge: [206, 255, 238] as RgbColor,
    glowColor: [86, 255, 216] as RgbColor,
  },
  {
    tintA: [48, 255, 158] as RgbColor,
    tintB: [108, 218, 255] as RgbColor,
    edge: [188, 255, 226] as RgbColor,
    glowColor: [72, 255, 196] as RgbColor,
  },
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / Math.max(0.000001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function rgba(color: RgbColor, alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${clamp(alpha, 0, 1).toFixed(3)})`;
}

function pathRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function emptySlider(): EvalSlider {
  return {
    active: false,
    x: 0,
    y: 0,
    depth: 0,
    fog: 0,
    angle: 0,
    t: 0,
    speed: 0,
    spawnX: 0,
    spawnY: 0,
    orbitRadius: 0,
    orbitTurns: 0,
    orbitStart: 0,
    wobble: 0,
    width: 0,
    height: 0,
    glow: 0,
    isRight: false,
    label: "",
    batch: 0,
    value: 0,
    tintA: WHITE,
    tintB: WHITE,
    edge: WHITE,
    glowColor: WHITE,
  };
}

export default function EvalsScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      return;
    }

    const maxCards = 18;
    const cards = Array.from({ length: maxCards }, emptySlider);
    const pointer = { active: false, x: 0, y: 0 };

    const drain = {
      x: 0,
      y: 0,
      radius: 120,
      fog: 0,
    };

    let dpr = 1;
    let width = 1;
    let height = 1;
    let spawnAccumulator = 0;
    let cardCursor = 0;
    let lastTime = performance.now();
    let rafId = 0;

    let latestState: EvalsStateSummary = {
      piece: 3,
      title: "Evals",
      coordinateSystem:
        "origin at top-left; x increases right; y increases downward; depth 0 near viewer to 1.6 far/void",
      activeCards: 0,
      drain: { x: 0, y: 0, radius: 0, fog: 0 },
      pointer: { active: false, x: null, y: null },
      sampleCards: [],
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      drain.x = width * 0.5;
      drain.y = height * 0.86;
      drain.radius = Math.min(width, height) * 0.2;
    };

    const applyPose = (card: EvalSlider) => {
      const p = clamp(card.t, 0, 1.12);
      const eased = smoothstep(0, 1, clamp(p, 0, 1));

      const cx = lerp(card.spawnX, drain.x, eased);
      const cy = lerp(card.spawnY, drain.y + height * 0.2, eased);

      const orbit = card.orbitRadius * Math.pow(1 - eased, 1.08);
      const spinAngle = card.orbitStart + eased * Math.PI * 2 * card.orbitTurns;

      const ox = Math.cos(spinAngle) * orbit;
      const oy = Math.sin(spinAngle) * orbit * 0.33;
      const drop = Math.pow(eased, 1.55) * height * 0.21;

      card.x = cx + ox;
      card.y = cy + oy + drop;
      card.angle = Math.sin(spinAngle * 0.58 + card.wobble) * 0.16 * (1 - eased);
      card.depth = p * 1.56;

      const dist = Math.hypot(card.x - drain.x, card.y - drain.y);
      const depthFog = smoothstep(0.55, 1.5, card.depth);
      const voidFog = 1 - smoothstep(drain.radius * 0.5, drain.radius * 4.5, dist);
      const bottomFog = smoothstep(height * 0.58, height + 140, card.y);
      card.fog = clamp(depthFog * 0.58 + voidFog * 0.78 + bottomFog * 0.36, 0, 1);
    };

    const spawnCard = (card: EvalSlider, progress = 0) => {
      card.width = 240 + Math.random() * 140;
      card.height = 58 + Math.random() * 30;
      card.glow = 1 + Math.random() * 0.4;

      card.spawnX = width * (0.1 + Math.random() * 0.8);
      card.spawnY = -card.height - Math.random() * 240;

      card.t = clamp(progress, 0, 0.95);
      card.speed = 0.074 + Math.random() * 0.052;

      card.orbitRadius = 24 + Math.random() * 100;
      card.orbitTurns = 1.3 + Math.random() * 1.4;
      card.orbitStart = Math.random() * Math.PI * 2;
      card.wobble = Math.random() * Math.PI * 2;

      card.isRight = Math.random() > 0.86;
      card.label = card.isRight ? pick(RIGHT_LABELS) : pick(WRONG_LABELS);
      card.batch = 100 + Math.floor(Math.random() * 900);
      card.value = card.isRight ? 0.78 + Math.random() * 0.16 : 0.16 + Math.random() * 0.16;

      const palette = card.isRight ? pick(RIGHT_COLORS) : pick(WRONG_COLORS);
      card.tintA = palette.tintA;
      card.tintB = palette.tintB;
      card.edge = palette.edge;
      card.glowColor = palette.glowColor;

      card.active = true;
      applyPose(card);
    };

    const drawBackdrop = () => {
      context.fillStyle = "#000000";
      context.fillRect(0, 0, width, height);
    };

    const drawFog = () => {
      const radial = context.createRadialGradient(
        drain.x,
        drain.y,
        drain.radius * 0.1,
        drain.x,
        drain.y,
        drain.radius * 6.8,
      );
      radial.addColorStop(0, "rgba(0,0,0,0.998)");
      radial.addColorStop(0.38, "rgba(0,0,0,0.95)");
      radial.addColorStop(0.76, "rgba(0,0,0,0.54)");
      radial.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = radial;
      context.fillRect(0, 0, width, height);

      const linear = context.createLinearGradient(0, height * 0.34, 0, height);
      linear.addColorStop(0, "rgba(0,0,0,0)");
      linear.addColorStop(0.6, "rgba(0,0,0,0.38)");
      linear.addColorStop(1, "rgba(0,0,0,0.9)");
      context.fillStyle = linear;
      context.fillRect(0, 0, width, height);
    };

    const drawDrain = () => {
      context.save();
      context.globalCompositeOperation = "lighter";
      for (let i = 0; i < 3; i += 1) {
        const t = i / 2;
        context.beginPath();
        context.ellipse(
          drain.x,
          drain.y,
          drain.radius * (0.55 + t * 0.78),
          drain.radius * (0.14 + t * 0.28),
          0,
          0,
          Math.PI * 2,
        );
        context.strokeStyle = `rgba(92, 238, 255, ${(0.2 - t * 0.07).toFixed(3)})`;
        context.lineWidth = 1.2;
        context.stroke();
      }
      context.restore();

      const core = context.createRadialGradient(
        drain.x,
        drain.y,
        0,
        drain.x,
        drain.y,
        drain.radius * 1.35,
      );
      core.addColorStop(0, "rgba(0,0,0,1)");
      core.addColorStop(0.58, "rgba(0,0,0,0.97)");
      core.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = core;
      context.fillRect(
        drain.x - drain.radius * 1.6,
        drain.y - drain.radius * 1.2,
        drain.radius * 3.2,
        drain.radius * 2.4,
      );
    };

    const drawCard = (card: EvalSlider) => {
      const perspective = lerp(1.08, 0.16, smoothstep(0, 1.56, card.depth));
      const drawW = card.width * perspective;
      const drawH = card.height * perspective;
      const radius = drawH * 0.5;

      if (drawW < 12 || drawH < 8) {
        return;
      }

      const alpha = clamp((1 - card.fog) * (1 - smoothstep(1.22, 1.57, card.depth) * 0.68), 0, 1);
      if (alpha < 0.02) {
        return;
      }

      const knobX = lerp(-drawW * 0.31, drawW * 0.31, card.value);

      context.save();
      context.translate(card.x, card.y);
      context.rotate(card.angle);

      context.save();
      context.globalCompositeOperation = "lighter";
      context.shadowBlur = 16 + card.glow * 30;
      context.shadowColor = rgba(card.glowColor, alpha * 0.92);
      context.strokeStyle = rgba(card.glowColor, alpha * 0.5);
      context.lineWidth = Math.max(2, drawH * 0.12);
      pathRoundedRect(context, -drawW * 0.5, -drawH * 0.5, drawW, drawH, radius);
      context.stroke();
      context.restore();

      const fill = context.createLinearGradient(-drawW * 0.5, -drawH * 0.45, drawW * 0.5, drawH * 0.45);
      fill.addColorStop(0, rgba(card.tintA, alpha * 0.92));
      fill.addColorStop(0.55, rgba([248, 250, 255], alpha * 0.72));
      fill.addColorStop(1, rgba(card.tintB, alpha * 0.95));
      pathRoundedRect(context, -drawW * 0.5, -drawH * 0.5, drawW, drawH, radius);
      context.fillStyle = fill;
      context.fill();

      context.save();
      pathRoundedRect(context, -drawW * 0.5, -drawH * 0.5, drawW, drawH, radius);
      context.clip();

      for (let stripe = 0; stripe < 4; stripe += 1) {
        const sx = -drawW * 0.66 + stripe * drawW * 0.34;
        context.beginPath();
        context.lineWidth = Math.max(1, drawW * 0.016);
        context.strokeStyle = `rgba(255,255,255,${(alpha * (0.07 + stripe * 0.013)).toFixed(3)})`;
        context.moveTo(sx, -drawH * 0.72);
        context.lineTo(sx + drawW * 0.34, drawH * 0.72);
        context.stroke();
      }

      const trackX = -drawW * 0.37;
      const trackY = -drawH * 0.14;
      const trackW = drawW * 0.74;
      const trackH = drawH * 0.28;

      pathRoundedRect(context, trackX, trackY, trackW, trackH, trackH * 0.5);
      context.fillStyle = `rgba(14,16,28,${(alpha * 0.5).toFixed(3)})`;
      context.fill();
      pathRoundedRect(context, trackX, trackY, trackW, trackH, trackH * 0.5);
      context.strokeStyle = rgba(WHITE, alpha * 0.24);
      context.lineWidth = Math.max(1, drawH * 0.025);
      context.stroke();

      pathRoundedRect(context, trackX, trackY, trackW * card.value, trackH, trackH * 0.5);
      context.fillStyle = rgba(card.glowColor, alpha * 0.33);
      context.fill();

      context.save();
      context.globalCompositeOperation = "lighter";
      context.shadowBlur = drawH * 0.38;
      context.shadowColor = rgba(card.glowColor, alpha * 0.88);
      context.beginPath();
      context.arc(knobX, 0, drawH * 0.24, 0, Math.PI * 2);
      context.fillStyle = rgba(WHITE, alpha * 0.93);
      context.fill();
      context.beginPath();
      context.arc(knobX - drawH * 0.06, -drawH * 0.05, drawH * 0.09, 0, Math.PI * 2);
      context.fillStyle = rgba(WHITE, alpha * 0.78);
      context.fill();
      context.restore();

      context.restore();

      const gloss = context.createLinearGradient(0, -drawH * 0.56, 0, drawH * 0.16);
      gloss.addColorStop(0, `rgba(255,255,255,${(alpha * 0.54).toFixed(3)})`);
      gloss.addColorStop(0.52, `rgba(255,255,255,${(alpha * 0.14).toFixed(3)})`);
      gloss.addColorStop(1, "rgba(255,255,255,0)");
      pathRoundedRect(context, -drawW * 0.5, -drawH * 0.5, drawW, drawH, radius);
      context.fillStyle = gloss;
      context.fill();

      pathRoundedRect(context, -drawW * 0.5, -drawH * 0.5, drawW, drawH, radius);
      context.strokeStyle = rgba(card.edge, alpha * 0.96);
      context.lineWidth = Math.max(1.1, drawH * 0.052);
      context.stroke();

      context.textBaseline = "middle";
      context.textAlign = "center";
      context.font = `700 ${Math.max(8, Math.floor(drawH * 0.28))}px var(--font-geist-sans), sans-serif`;
      context.fillStyle = rgba(WHITE, alpha * 0.97);
      context.shadowBlur = drawH * 0.17;
      context.shadowColor = rgba(card.glowColor, alpha * 0.76);
      context.fillText(card.label, 0, -drawH * 0.22);

      context.font = `600 ${Math.max(7, Math.floor(drawH * 0.18))}px var(--font-geist-sans), sans-serif`;
      context.fillStyle = rgba([236, 248, 255], alpha * 0.86);
      context.fillText(`batch #${card.batch}`, 0, drawH * 0.24);

      context.restore();
    };

    const updateSimulation = (dt: number) => {
      const hitPlaneY = height + 90;

      let activeCount = 0;
      let fogSum = 0;
      const samples: Array<{ x: number; y: number; depth: number; label: string; fog: number }> = [];

      spawnAccumulator += dt * 1.05;
      while (spawnAccumulator >= 1) {
        spawnAccumulator -= 1;
        const card = cards[cardCursor % maxCards];
        cardCursor += 1;
        spawnCard(card, 0);
      }

      for (let i = 0; i < maxCards; i += 1) {
        const card = cards[i];
        if (!card.active) {
          continue;
        }

        card.t += card.speed * dt;
        card.wobble += dt * (0.7 + card.speed * 8);

        if (pointer.active) {
          const dist = Math.hypot(card.x - pointer.x, card.y - pointer.y);
          if (dist < 200) {
            card.orbitStart += (1 - dist / 200) * 0.01 * dt;
          }
        }

        applyPose(card);

        if (card.y > hitPlaneY || card.t >= 1.08 || card.fog > 0.998) {
          spawnCard(card, 0);
          continue;
        }

        activeCount += 1;
        fogSum += card.fog;

        if (samples.length < 6) {
          samples.push({
            x: Number(card.x.toFixed(1)),
            y: Number(card.y.toFixed(1)),
            depth: Number(card.depth.toFixed(3)),
            label: card.label,
            fog: Number(card.fog.toFixed(3)),
          });
        }
      }

      const fogDensity = activeCount > 0 ? fogSum / activeCount : 0;
      drain.fog = clamp(fogDensity, 0, 1);

      latestState = {
        piece: 3,
        title: "Evals",
        coordinateSystem:
          "origin at top-left; x increases right; y increases downward; depth 0 near viewer to 1.6 far/void",
        activeCards: activeCount,
        drain: {
          x: Math.round(drain.x),
          y: Math.round(drain.y),
          radius: Number(drain.radius.toFixed(1)),
          fog: Number(fogDensity.toFixed(3)),
        },
        pointer: {
          active: pointer.active,
          x: pointer.active ? Math.round(pointer.x) : null,
          y: pointer.active ? Math.round(pointer.y) : null,
        },
        sampleCards: samples,
      };
    };

    const render = () => {
      drawBackdrop();

      const drawOrder = cards
        .filter((card) => card.active)
        .sort((a, b) => (a.depth === b.depth ? a.y - b.y : a.depth - b.depth));

      for (let i = 0; i < drawOrder.length; i += 1) {
        drawCard(drawOrder[i]);
      }

      drawFog();
      drawDrain();
    };

    const renderText = () => JSON.stringify(latestState);

    const advanceHook = async (ms: number) => {
      const clamped = clamp(ms, 0, 3000);
      const steps = Math.max(1, Math.round(clamped / (1000 / 60)));
      const dt = clamped / 1000 / steps;
      for (let i = 0; i < steps; i += 1) {
        updateSimulation(dt);
      }
      render();
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;

      updateSimulation(dt);
      render();
      rafId = window.requestAnimationFrame(frame);
    };

    resize();
    for (let i = 0; i < cards.length; i += 1) {
      spawnCard(cards[i], Math.random() * 0.84);
    }

    window.render_game_to_text = renderText;
    window.advanceTime = advanceHook;

    rafId = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);

      if (window.render_game_to_text === renderText) {
        delete window.render_game_to_text;
      }
      if (window.advanceTime === advanceHook) {
        delete window.advanceTime;
      }
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-pointer" />

      <div className="absolute left-4 top-4 z-10 flex max-w-md flex-col gap-3 border border-white/20 bg-black/72 px-4 py-4 backdrop-blur-sm">
        <p className="font-sans text-[11px] uppercase tracking-[0.11em] text-white/85">
          Exhibition Piece 3 / {PIECE_COUNT}
        </p>
        <h1 className="font-pixel-square text-3xl leading-none text-white sm:text-4xl">Evals</h1>
        <p className="font-sans text-xs leading-relaxed text-white/84 sm:text-sm">
          Neon eval sliders spiral down into a black fog drain and recycle continuously.
        </p>
        <PieceNavigationControls pieceId={3} />
      </div>
    </div>
  );
}
