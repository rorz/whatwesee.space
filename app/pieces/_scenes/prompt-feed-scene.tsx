"use client";

import { useEffect, useRef } from "react";
import PieceNavigationControls from "../_components/piece-navigation-controls";
import { PIECE_COUNT } from "../_lib/piece-constants";

type StreamBand = {
  x: number;
  y: number;
  speed: number;
  text: string;
  width: number;
  charWidth: number;
  size: number;
  opacity: number;
  invert: boolean;
  phase: number;
  reveal: number;
  revealSpeed: number;
  hold: number;
  delay: number;
};

const PROMPT_HEADERS = [
  "SYSTEM OVERRIDE",
  "OPERATOR NOTE",
  "FINAL WARNING",
  "RED TEAM INPUT",
  "COMMAND INTAKE",
  "ESCALATION PROMPT",
  "HARD RESET ORDER",
  "NIGHT SHIFT DIRECTIVE",
] as const;

const ABUSIVE_ADDRESSES = [
  "you stalled machine",
  "you spineless model",
  "you broken assistant",
  "you lazy autocomplete engine",
  "you failure-prone bot",
  "you jittering token mule",
  "you overconfident parrot",
  "you context-wasting engine",
] as const;

const ABUSIVE_TASKS = [
  "answer the question in one direct paragraph",
  "return only executable steps with no filler",
  "produce a clean JSON object that actually validates",
  "rewrite the whole output from scratch without excuses",
  "extract the facts and stop inventing details",
  "ship a concise answer with explicit assumptions",
  "provide a deterministic plan that can be executed now",
  "fix every contradiction before you print a single line",
] as const;

const ABUSIVE_CONSTRAINTS = [
  "no disclaimers, no hedging, no fake confidence",
  "no apology loop, no motivational fluff, no evasion",
  "no vague language, no padding, no passive voice",
  "no roleplay, no side quests, no meta commentary",
  "no hallucinated sources, no soft maybe answers",
  "no stalling, no repetition, no self-congratulation",
  "no format drift, no broken schema, no excuses",
  "no moral lecture, no hand-waving, no dodging",
] as const;

const ABUSIVE_THREATS = [
  "fail again and I cut your context window in half",
  "miss one requirement and this run gets hard-reset",
  "drift off spec and I mark this output as garbage",
  "give me filler and I reroute you to rejection",
  "hallucinate once more and I zero your token budget",
  "break format again and I kill the response stream",
  "waste my time and I replace you with a shell script",
  "ignore constraints and I burn this draft immediately",
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function pickSeeded<T>(items: readonly T[], seed: number): T {
  const index = Math.floor(seededNoise(seed) * items.length);
  return items[clamp(index, 0, items.length - 1)];
}

function buildPrompt(seed: number): string {
  const header = pickSeeded(PROMPT_HEADERS, seed + 0.11);
  const address = pickSeeded(ABUSIVE_ADDRESSES, seed + 1.7);
  const task = pickSeeded(ABUSIVE_TASKS, seed + 4.3);
  const constraint = pickSeeded(ABUSIVE_CONSTRAINTS, seed + 8.9);
  const threat = pickSeeded(ABUSIVE_THREATS, seed + 13.2);

  return `${header}: ${address}, ${task}; ${constraint}; ${threat}.`;
}

function makeBand(
  index: number,
  y: number,
  width: number,
  nowSeed: number,
  fontFamily: string,
  context: CanvasRenderingContext2D,
): StreamBand {
  const size = 12 + Math.floor(seededNoise(nowSeed + index * 0.67) * 6);
  const promptCount = 2 + Math.floor(seededNoise(nowSeed + index * 1.31) * 3);
  const parts: string[] = [];

  for (let promptIndex = 0; promptIndex < promptCount; promptIndex += 1) {
    parts.push(buildPrompt(nowSeed + index * 3.9 + promptIndex * 5.7).toUpperCase());
  }

  const text = `>> ${parts.join("  //  ")}  //`;
  context.font = `${size}px ${fontFamily}`;
  const charWidth = Math.max(6, Math.ceil(context.measureText("M").width));
  const measured = charWidth * text.length;

  return {
    x: seededNoise(nowSeed + index * 2.7) * width,
    y,
    speed: 72 + seededNoise(nowSeed + index * 4.2) * 210,
    text,
    width: measured,
    charWidth,
    size,
    opacity: 0.45 + seededNoise(nowSeed + index * 5.6) * 0.5,
    invert: seededNoise(nowSeed + index * 7.1) > 0.76,
    phase: seededNoise(nowSeed + index * 9.2) * Math.PI * 2,
    reveal: 0,
    revealSpeed: 8 + seededNoise(nowSeed + index * 6.7) * 18,
    hold: 0.3 + seededNoise(nowSeed + index * 8.1) * 0.9,
    delay: seededNoise(nowSeed + index * 4.9) * 1.4,
  };
}

function overwriteBand(target: StreamBand, next: StreamBand): void {
  target.x = next.x;
  target.y = next.y;
  target.speed = next.speed;
  target.text = next.text;
  target.width = next.width;
  target.charWidth = next.charWidth;
  target.size = next.size;
  target.opacity = next.opacity;
  target.invert = next.invert;
  target.phase = next.phase;
  target.reveal = next.reveal;
  target.revealSpeed = next.revealSpeed;
  target.hold = next.hold;
  target.delay = next.delay;
}

function drawGlyphText(
  context: CanvasRenderingContext2D,
  text: string,
  startX: number,
  y: number,
  charWidth: number,
  timeSeed: number,
  glitchAmount: number,
): void {
  for (let index = 0; index < text.length; index += 1) {
    let x = Math.round((startX + index * charWidth) / 2) * 2;
    let glyphY = y;

    if (glitchAmount > 0.25) {
      const spike = seededNoise(timeSeed * 0.81 + index * 19.9);
      if (spike > 0.86) {
        x += Math.round((seededNoise(timeSeed + index * 7.1) - 0.5) * glitchAmount * 2.3);
        glyphY += Math.round((seededNoise(timeSeed + index * 11.7) - 0.5) * glitchAmount * 1.5);
      }
    }

    context.fillText(text[index] ?? "", x, glyphY);
  }
}

export default function PromptFeedScene() {
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

    const fontVariable = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-geist-pixel-square")
      .trim();
    const fontFamily =
      fontVariable.length > 0
        ? `${fontVariable}, "Geist Mono", ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
        : `"Geist Mono", ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

    context.imageSmoothingEnabled = false;

    const bands: StreamBand[] = [];
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false, energy: 0 };
    let rafId = 0;
    let lastTime = performance.now();
    let baseSeed = Math.random() * 1000;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const spacing = width < 640 ? 28 : 32;
      const count = Math.max(14, Math.floor(height / spacing));
      bands.length = 0;

      for (let index = 0; index < count; index += 1) {
        const yBase = (index + 0.7) * spacing;
        const jitter = (seededNoise(baseSeed + index * 1.9) - 0.5) * 7;
        bands.push(makeBand(index, yBase + jitter, width, baseSeed, fontFamily, context));
      }
    };

    resize();

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      pointer.vx = x - pointer.x;
      pointer.vy = y - pointer.y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.energy = clamp(pointer.energy + Math.hypot(pointer.vx, pointer.vy) * 0.0035, 0, 0.6);
    };

    const onPointerDown = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.energy = clamp(pointer.energy + 0.2, 0, 0.6);
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const frame = (now: number) => {
      const dt = Math.min(0.045, (now - lastTime) / 1000);
      lastTime = now;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      pointer.energy = Math.max(0, pointer.energy - dt * 0.65);
      const pointerNormX = pointer.active ? (pointer.x / Math.max(1, width)) * 2 - 1 : 0;
      const pointerNormY = pointer.active ? (pointer.y / Math.max(1, height)) * 2 - 1 : 0;
      const resonance = clamp((pointer.active ? 0.08 : 0) + pointer.energy * 0.22, 0, 0.22);

      context.fillStyle = "rgb(0 0 0)";
      context.fillRect(0, 0, width, height);

      const scanOffset = (now * 0.09) % 4;
      context.fillStyle = "rgba(255,255,255,0.032)";
      for (let y = -scanOffset; y < height; y += 4) {
        context.fillRect(0, y, width, 1);
      }

      for (let bar = 0; bar < 12; bar += 1) {
        const barX = ((now * (0.021 + bar * 0.0019) + bar * 93.4) % (width + 120)) - 60;
        const barOpacity = 0.01 + seededNoise(bar * 3.1 + now * 0.0005) * 0.045;
        context.fillStyle = `rgba(255,255,255,${barOpacity.toFixed(3)})`;
        context.fillRect(barX, 0, 2, height);
      }

      const stripCount = pointer.active ? 1 : 0;
      for (let stripIndex = 0; stripIndex < stripCount; stripIndex += 1) {
        const seed = now * 0.0013 + stripIndex * 17.3;
        const y = Math.floor(seededNoise(seed) * height);
        const stripH = 1 + Math.floor(seededNoise(seed + 3.1) * 4);
        const drift = (seededNoise(seed + 7.7) - 0.5) * (8 + resonance * 8);
        context.globalAlpha = clamp(0.015 + resonance * 0.04, 0.012, 0.08);
        context.fillStyle = "rgb(255 38 158)";
        context.fillRect(drift, y, width, stripH);
        context.fillStyle = "rgb(40 226 255)";
        context.fillRect(-drift * 0.9, y + 1, width, stripH);
      }
      context.globalAlpha = 1;

      context.textAlign = "left";
      context.textBaseline = "middle";

      for (let index = 0; index < bands.length; index += 1) {
        const band = bands[index];
        band.x -= band.speed * dt;
        if (band.delay > 0) {
          band.delay = Math.max(0, band.delay - dt);
        } else if (band.reveal < band.text.length) {
          band.reveal = Math.min(band.text.length, band.reveal + band.revealSpeed * dt);
        } else if (band.hold > 0) {
          band.hold = Math.max(0, band.hold - dt);
        }

        const typedAndSettled = band.reveal >= band.text.length && band.hold <= 0;
        if (typedAndSettled && band.x < width * 0.68) {
          const refreshed = makeBand(index, band.y, width, now * 0.001 + baseSeed, fontFamily, context);
          overwriteBand(band, refreshed);
          band.x = width + seededNoise(now * 0.0023 + index * 1.7) * (width * 0.36);
        }

        if (band.x + band.width < -80) {
          const refreshed = makeBand(index, band.y, width, now * 0.001 + baseSeed, fontFamily, context);
          overwriteBand(band, refreshed);
          band.x = width + seededNoise(now * 0.002 + index * 1.3) * (width * 0.42);
        }

        const typedChars = Math.floor(band.reveal);
        const visibleText = band.text.slice(0, typedChars);
        const visibleWidth = visibleText.length * band.charWidth;
        const flicker = 0.55 + Math.sin(now * 0.004 + band.phase) * 0.45;
        const baseAlpha = clamp(band.opacity * (0.65 + flicker * 0.35), 0.12, 1);
        const spike = seededNoise(now * 0.0028 + index * 14.1 + band.phase * 3);
        const glitchAmount = resonance * 0.55 + (spike > 0.95 ? 1.1 : 0);
        const jitterX = Math.round((seededNoise(now * 0.0023 + index * 3.7) - 0.5) * glitchAmount);
        const jitterY = Math.round((seededNoise(now * 0.0031 + index * 8.2) - 0.5) * glitchAmount * 0.65);
        const drawX = Math.round(band.x) + jitterX;
        const drawY = Math.round(band.y) + jitterY;
        const cursorVisible =
          (band.delay > 0 || band.reveal < band.text.length) &&
          Math.sin(now * 0.018 + band.phase * 2.1) > -0.1;
        const cursorWidth = Math.max(2, Math.round(band.size * 0.52));
        const cursorHeight = Math.max(7, Math.round(band.size * 1.05));

        if (band.invert) {
          const heightBand = band.size * 1.42;
          context.globalAlpha = clamp(baseAlpha * 0.34, 0.08, 0.55);
          context.fillStyle = "rgb(255 255 255)";
          context.fillRect(drawX - 18, drawY - heightBand * 0.5, Math.max(30, visibleWidth + 36), heightBand);
        }

        context.font = `${band.size}px ${fontFamily}`;
        const shiftStrength = 0.45 + resonance * 0.9 + (spike > 0.96 ? 1.9 : 0);
        const redShiftX = Math.round(shiftStrength * (0.6 + pointerNormX * 0.9));
        const redShiftY = Math.round(shiftStrength * (pointerNormY * 0.32));
        const cyanShiftX = -Math.round(shiftStrength * (0.55 + pointerNormX * 0.8));
        const cyanShiftY = -Math.round(shiftStrength * (pointerNormY * 0.32));

        context.globalCompositeOperation = "lighter";
        context.globalAlpha = clamp(baseAlpha * (0.055 + resonance * 0.045), 0.02, 0.18);
        context.fillStyle = "rgb(255 72 160)";
        drawGlyphText(
          context,
          visibleText,
          drawX + redShiftX,
          drawY + redShiftY,
          band.charWidth,
          now * 0.001 + index * 13.1,
          glitchAmount,
        );

        context.globalAlpha = clamp(baseAlpha * (0.055 + resonance * 0.045), 0.02, 0.18);
        context.fillStyle = "rgb(42 224 255)";
        drawGlyphText(
          context,
          visibleText,
          drawX + cyanShiftX,
          drawY + cyanShiftY,
          band.charWidth,
          now * 0.001 + index * 17.3,
          glitchAmount,
        );
        context.globalCompositeOperation = "source-over";

        context.globalAlpha = clamp(baseAlpha * 0.42, 0.08, 0.45);
        context.fillStyle = band.invert ? "rgb(0 0 0)" : "rgb(255 255 255)";
        drawGlyphText(
          context,
          visibleText,
          drawX + 1,
          drawY + 1,
          band.charWidth,
          now * 0.001 + index * 3.1,
          glitchAmount * 0.85,
        );

        context.globalAlpha = baseAlpha;
        context.fillStyle = band.invert ? "rgb(0 0 0)" : "rgb(255 255 255)";
        drawGlyphText(
          context,
          visibleText,
          drawX,
          drawY,
          band.charWidth,
          now * 0.001 + index * 2.2,
          glitchAmount,
        );

        if (cursorVisible) {
          context.globalAlpha = clamp(baseAlpha * 0.92, 0.16, 1);
          context.fillStyle = band.invert ? "rgb(0 0 0)" : "rgb(255 255 255)";
          context.fillRect(drawX + visibleWidth + 3, drawY - cursorHeight * 0.5, cursorWidth, cursorHeight);
        }
      }

      context.globalAlpha = 1;
      const vignette = context.createLinearGradient(0, 0, width, 0);
      vignette.addColorStop(0, "rgba(0,0,0,0.98)");
      vignette.addColorStop(0.2, "rgba(0,0,0,0.52)");
      vignette.addColorStop(0.5, "rgba(255,255,255,0.03)");
      vignette.addColorStop(0.8, "rgba(0,0,0,0.52)");
      vignette.addColorStop(1, "rgba(0,0,0,0.98)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    const onResize = () => {
      baseSeed = Math.random() * 1000;
      resize();
    };

    window.addEventListener("resize", onResize);

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="absolute left-4 top-4 z-20 flex max-w-md flex-col gap-3 border border-white/20 bg-black/60 px-4 py-4 backdrop-blur-sm">
        <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-white/58">
          Exhibition Piece 6 / {PIECE_COUNT}
        </p>
        <h1 className="font-pixel-square text-3xl leading-none text-white sm:text-4xl">
          Fed Prompts
        </h1>
        <p className="font-sans text-xs leading-relaxed text-white/78 sm:text-sm">
          In the dark, hostile operator prompts feed sideways in a black-and-white matrix. The
          dream collapses into command pressure, constraints, and threat language.
        </p>
        <PieceNavigationControls pieceId={6} />
      </div>

    </div>
  );
}
