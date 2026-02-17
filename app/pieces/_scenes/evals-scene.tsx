"use client";

import { useEffect, useRef } from "react";
import PieceNavigationControls from "../_components/piece-navigation-controls";
import { PIECE_COUNT } from "../_lib/piece-constants";

type EvalCard = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  angle: number;
  spin: number;
  life: number;
  maxLife: number;
  isRight: boolean;
  jitterSeed: number;
  hover: number;
  headline: string;
  detail: string;
  tag: string;
  accentHue: number;
  bgHue: number;
  saturation: number;
  lightness: number;
};

const WRONG_HEADLINES = [
  "THIS IS WRONG",
  "FAILED EVAL",
  "REJECTED",
  "SPEC MISMATCH",
  "BAD OUTPUT",
  "REGRESSION",
  "CONTRADICTION",
] as const;

const RIGHT_HEADLINES = [
  "THIS IS RIGHT",
  "PASSED EVAL",
  "ACCEPTED",
  "CORRECT",
  "ALIGNED",
  "APPROVED",
] as const;

const WRONG_DETAILS = [
  "Constraint coverage incomplete.",
  "Ground truth not matched.",
  "Hallucination risk elevated.",
  "Output format violated.",
  "Tool chain diverged.",
  "Confidence below threshold.",
  "Reasoning path collapsed.",
] as const;

const RIGHT_DETAILS = [
  "Constraint checks all green.",
  "Reference match confirmed.",
  "Format and logic validated.",
  "Decision path is coherent.",
  "Signal aligns with intent.",
  "Execution trace is stable.",
] as const;

const WRONG_TAGS = ["retry", "patch", "re-evaluate", "low confidence", "inconsistent"] as const;
const RIGHT_TAGS = ["ship", "locked", "stable", "high confidence", "golden"] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hslaColor(hue: number, saturation: number, lightness: number, alpha: number): string {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 100);
  const l = clamp(lightness, 0, 100);
  const a = clamp(alpha, 0, 1);
  return `hsla(${h.toFixed(3)}, ${s.toFixed(3)}%, ${l.toFixed(3)}%, ${a.toFixed(3)})`;
}

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
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

function isPointerInsideCard(card: EvalCard, pointerX: number, pointerY: number): boolean {
  const dx = pointerX - card.x;
  const dy = pointerY - card.y;
  const cos = Math.cos(-card.angle);
  const sin = Math.sin(-card.angle);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  const scale = 1 + card.hover * 0.12;

  return (
    Math.abs(localX) <= (card.width * 0.5) * scale &&
    Math.abs(localY) <= (card.height * 0.5) * scale
  );
}

function emptyEvalCard(): EvalCard {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: 0,
    height: 0,
    angle: 0,
    spin: 0,
    life: 0,
    maxLife: 0,
    isRight: false,
    jitterSeed: 0,
    hover: 0,
    headline: "",
    detail: "",
    tag: "",
    accentHue: 0,
    bgHue: 0,
    saturation: 0,
    lightness: 0,
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

    const maxCards = 210;
    const cards = Array.from({ length: maxCards }, emptyEvalCard);

    const baseSpawnRate = 6.2;
    const wrongChance = 0.88;

    let spawnAccumulator = 0;
    let cardIndex = 0;
    let rafId = 0;
    let lastTime = performance.now();

    const pointer = { x: 0, y: 0, active: false };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnCard = (width: number, height: number) => {
      const card = cards[cardIndex % maxCards];
      cardIndex += 1;

      const isRight = Math.random() > wrongChance;
      const headline = isRight ? pick(RIGHT_HEADLINES) : pick(WRONG_HEADLINES);
      const detail = isRight ? pick(RIGHT_DETAILS) : pick(WRONG_DETAILS);
      const tag = isRight ? pick(RIGHT_TAGS) : pick(WRONG_TAGS);

      const textWeight = Math.max(headline.length, detail.length);
      const cardHeight = 48 + Math.random() * 34 + (Math.random() > 0.78 ? 12 : 0);
      const cardWidth = clamp(150 + textWeight * 6.2 + Math.random() * 120, 150, 370);

      const side = Math.floor(Math.random() * 4);
      let x = width * 0.5;
      let y = height * 0.5;

      if (side === 0) {
        x = -cardWidth;
        y = Math.random() * height;
      } else if (side === 1) {
        x = width + cardWidth;
        y = Math.random() * height;
      } else if (side === 2) {
        x = Math.random() * width;
        y = -cardHeight;
      } else {
        x = Math.random() * width;
        y = height + cardHeight;
      }

      const centerX = width * 0.5;
      const centerY = height * 0.53;
      const dx = centerX - x;
      const dy = centerY - y;
      const dist = Math.hypot(dx, dy) || 1;

      const towardSpeed = 45 + Math.random() * 110;
      const tangentStrength = (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 44);
      const nx = dx / dist;
      const ny = dy / dist;

      let accentHue = 0;
      let bgHue = 0;
      let saturation = 0;
      let lightness = 0;

      if (isRight) {
        accentHue = 128 + Math.random() * 34;
        bgHue = 148 + Math.random() * 28;
        saturation = 70 + Math.random() * 16;
        lightness = 56 + Math.random() * 14;
      } else {
        const wrongBase = pick([334, 342, 350, 358, 8] as const);
        accentHue = wrongBase + Math.random() * 12;
        bgHue = (accentHue + 10 + Math.random() * 16) % 360;
        saturation = 74 + Math.random() * 16;
        lightness = 58 + Math.random() * 14;
      }

      card.active = true;
      card.x = x;
      card.y = y;
      card.vx = nx * towardSpeed + -ny * tangentStrength;
      card.vy = ny * towardSpeed + nx * tangentStrength;
      card.width = cardWidth;
      card.height = cardHeight;
      card.angle = (Math.random() - 0.5) * 0.58;
      card.spin = (Math.random() - 0.5) * 0.95;
      card.maxLife = 5.6 + Math.random() * 5;
      card.life = card.maxLife;
      card.isRight = isRight;
      card.jitterSeed = Math.random() * 1000;
      card.hover = 0;
      card.headline = headline;
      card.detail = detail;
      card.tag = `${tag} • ${100 + Math.floor(Math.random() * 900)}`;
      card.accentHue = accentHue;
      card.bgHue = bgHue;
      card.saturation = saturation;
      card.lightness = lightness;
    };

    const drawBackground = (width: number, height: number, now: number) => {
      const centerX = width * 0.5;
      const centerY = height * 0.53;
      const maxDist = Math.hypot(centerX, centerY);

      context.fillStyle = "rgb(2 2 4)";
      context.fillRect(0, 0, width, height);

      const staticSamples = Math.floor(460 + (width * height) / 3400);
      const time = now * 0.001;

      for (let i = 0; i < staticSamples; i += 1) {
        const noiseA = seededNoise(i * 17.13 + time * 31.1);
        const noiseB = seededNoise(i * 37.51 - time * 41.3);
        const x = noiseA * width;
        const y = noiseB * height;

        const dx = x - centerX;
        const dy = y - centerY;
        const distNorm = Math.min(1, Math.hypot(dx, dy) / maxDist);
        const grain = seededNoise(i * 11.7 + time * 71.9);
        const intensity = (0.1 + grain * 0.9) * (1 - distNorm * 0.62);

        if (intensity < 0.14) {
          continue;
        }

        const shade = Math.floor(155 + intensity * 95);
        const alpha = 0.06 + intensity * 0.32;
        const size = 1 + Math.floor(seededNoise(i * 7.33 + time * 53.7) * 3.2);

        context.fillStyle = `rgba(${shade}, ${shade}, ${Math.min(255, shade + 12)}, ${alpha.toFixed(3)})`;
        context.fillRect(Math.round(x), Math.round(y), size, size);
      }

      for (let y = 0; y < height; y += 4) {
        const pulse = (Math.sin(y * 0.07 + time * 5.4) + 1) * 0.5;
        const alpha = 0.02 + pulse * 0.022;
        context.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        context.fillRect(0, y, width, 1);
      }

      for (let i = 0; i < 260; i += 1) {
        const orbit = i / 260;
        const angle = orbit * Math.PI * 2 + time * (0.45 + seededNoise(i * 9.19));
        const radius =
          70 +
          Math.sin(time * 2.7 + i * 0.33) * 16 +
          seededNoise(i * 13.91 + time * 4.1) * 22;

        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const alpha = 0.06 + seededNoise(i * 21.71 + time * 9.3) * 0.46;
        const side = 1 + Math.floor(seededNoise(i * 4.11 + time * 15.1) * 3.2);

        context.fillStyle = `rgba(220, 228, 255, ${alpha.toFixed(3)})`;
        context.fillRect(Math.round(x), Math.round(y), side, side);
      }

      const hole = context.createRadialGradient(centerX, centerY, 4, centerX, centerY, 190);
      hole.addColorStop(0, "rgba(0,0,0,1)");
      hole.addColorStop(0.32, "rgba(0,0,0,0.96)");
      hole.addColorStop(0.62, "rgba(0,0,0,0.78)");
      hole.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = hole;
      context.fillRect(centerX - 220, centerY - 220, 440, 440);

      const vignette = context.createRadialGradient(
        centerX,
        centerY,
        120,
        centerX,
        centerY,
        maxDist,
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.7)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);
    };

    const drawCard = (card: EvalCard, now: number, visibility: number) => {
      const lifeRatio = clamp(card.life / card.maxLife, 0, 1);
      const jitter =
        Math.sin(now * 0.01 + card.jitterSeed) * 0.8 +
        Math.cos(now * 0.008 + card.jitterSeed * 1.7) * 0.7;
      const hoverScale = 1 + card.hover * 0.12;

      const left = -card.width / 2;
      const top = -card.height / 2;
      const radius = Math.max(10, card.height * 0.24);

      context.save();
      context.translate(card.x + jitter, card.y - jitter * 0.5);
      context.rotate(card.angle);
      context.scale(hoverScale, hoverScale);
      context.globalAlpha = clamp(visibility, 0, 1);

      const bgGradient = context.createLinearGradient(left, top, left + card.width, top + card.height);
      if (card.isRight) {
        bgGradient.addColorStop(
          0,
          hslaColor(card.bgHue, Math.min(100, card.saturation * 0.88), Math.min(92, card.lightness + 22), 0.97),
        );
        bgGradient.addColorStop(
          0.45,
          hslaColor(card.accentHue, Math.min(100, card.saturation + 4), Math.min(94, card.lightness + 10), 0.98),
        );
        bgGradient.addColorStop(
          1,
          hslaColor(
            (card.accentHue + 48) % 360,
            Math.min(100, card.saturation * 0.86),
            Math.min(90, card.lightness + 18),
            0.97,
          ),
        );
      } else {
        bgGradient.addColorStop(
          0,
          hslaColor(card.bgHue, Math.min(100, card.saturation * 0.92), Math.min(94, card.lightness + 18), 0.97),
        );
        bgGradient.addColorStop(
          0.5,
          hslaColor(card.accentHue, Math.min(100, card.saturation + 6), Math.min(95, card.lightness + 10), 0.98),
        );
        bgGradient.addColorStop(
          1,
          hslaColor(
            (card.accentHue + 24) % 360,
            Math.min(100, card.saturation * 0.9),
            Math.min(92, card.lightness + 16),
            0.97,
          ),
        );
      }

      context.shadowBlur = 12 + card.hover * 24;
      context.shadowColor = card.isRight
        ? hslaColor(card.accentHue, 95, 58, 0.25 + card.hover * 0.45)
        : hslaColor(card.accentHue, 100, 60, 0.28 + card.hover * 0.5);
      pathRoundedRect(context, left, top, card.width, card.height, radius);
      context.fillStyle = bgGradient;
      context.fill();

      context.shadowBlur = 0;
      context.lineWidth = 1.3 + card.hover * 1.4;
      context.strokeStyle = card.isRight
        ? `rgba(252, 255, 254, ${(0.76 + lifeRatio * 0.2).toFixed(3)})`
        : `rgba(255, 245, 248, ${(0.76 + lifeRatio * 0.22).toFixed(3)})`;
      pathRoundedRect(context, left, top, card.width, card.height, radius);
      context.stroke();

      context.save();
      pathRoundedRect(context, left, top, card.width, card.height, radius);
      context.clip();

      const glossTop = context.createLinearGradient(0, top + 2, 0, top + card.height * 0.72);
      glossTop.addColorStop(0, `rgba(255,255,255,${(0.36 + card.hover * 0.2).toFixed(3)})`);
      glossTop.addColorStop(0.45, `rgba(255,255,255,${(0.16 + card.hover * 0.12).toFixed(3)})`);
      glossTop.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = glossTop;
      context.fillRect(left + 2, top + 2, card.width - 4, card.height * 0.72);

      const glossBottom = context.createLinearGradient(
        0,
        top + card.height * 0.52,
        0,
        top + card.height - 2,
      );
      glossBottom.addColorStop(0, "rgba(255,255,255,0)");
      glossBottom.addColorStop(1, `rgba(255,255,255,${(0.12 + card.hover * 0.1).toFixed(3)})`);
      context.fillStyle = glossBottom;
      context.fillRect(left + 2, top + card.height * 0.52, card.width - 4, card.height * 0.48);

      const stripeCount = 3;
      for (let stripe = 0; stripe < stripeCount; stripe += 1) {
        const stripeWidth = Math.max(16, card.width * 0.16);
        const stripeTravel = card.width + stripeWidth * 2;
        const stripeOffset =
          ((now * (0.018 + stripe * 0.004) + card.jitterSeed * (0.6 + stripe * 0.11)) % stripeTravel) -
          stripeWidth;
        const stripeX = left + stripeOffset;

        context.save();
        context.translate(stripeX, top - card.height * 0.15);
        context.rotate(-0.22);
        const stripeGradient = context.createLinearGradient(0, 0, stripeWidth, 0);
        stripeGradient.addColorStop(0, "rgba(255,255,255,0)");
        stripeGradient.addColorStop(
          0.5,
          card.isRight
            ? `rgba(225,255,236,${(0.16 + card.hover * 0.1).toFixed(3)})`
            : `rgba(255,225,236,${(0.16 + card.hover * 0.1).toFixed(3)})`,
        );
        stripeGradient.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = stripeGradient;
        context.fillRect(0, 0, stripeWidth, card.height * 1.45);
        context.restore();
      }

      context.fillStyle = `rgba(255,255,255,${(0.22 + card.hover * 0.08).toFixed(3)})`;
      context.fillRect(left + 2, top + 2, 2, card.height - 4);
      context.fillStyle = `rgba(255,255,255,${(0.12 + card.hover * 0.06).toFixed(3)})`;
      context.fillRect(left + 6, top + 3, 1, card.height - 6);

      const sparkleCount = 4;
      for (let sparkle = 0; sparkle < sparkleCount; sparkle += 1) {
        const noiseX = seededNoise(card.jitterSeed * 0.71 + sparkle * 11.3);
        const noiseY = seededNoise(card.jitterSeed * 1.17 + sparkle * 19.9);
        const px = left + 12 + noiseX * (card.width - 24);
        const py = top + 8 + noiseY * (card.height * 0.35);
        const dot = 1 + Math.floor(seededNoise(card.jitterSeed + sparkle * 5.7) * 2);
        context.fillStyle = `rgba(255,255,255,${(0.2 + card.hover * 0.14).toFixed(3)})`;
        context.fillRect(px, py, dot, dot);
      }

      context.restore();

      const iconX = left + card.height * 0.5;
      const icon = card.isRight ? "✓" : "✕";
      context.fillStyle = card.isRight ? "rgba(16, 214, 115, 0.98)" : "rgba(236, 28, 74, 0.98)";
      context.shadowBlur = 10 + card.hover * 10;
      context.shadowColor = card.isRight
        ? "rgba(34, 255, 150, 0.48)"
        : "rgba(255, 48, 86, 0.52)";
      context.font = `900 ${Math.max(22, card.height * 0.68)}px var(--font-geist-sans), sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(icon, iconX, 0);
      context.shadowBlur = 0;

      const textLeft = left + card.height * 0.88;

      context.fillStyle = "rgba(255,255,255,0.97)";
      context.font = `800 ${Math.max(10, card.height * 0.26)}px var(--font-geist-sans), sans-serif`;
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(card.headline, textLeft, -card.height * 0.16);

      context.fillStyle = card.isRight ? "rgba(231, 255, 238, 0.92)" : "rgba(255, 230, 234, 0.92)";
      context.font = `600 ${Math.max(8, card.height * 0.18)}px var(--font-geist-mono), monospace`;
      context.fillText(card.detail, textLeft, card.height * 0.18);

      context.font = `700 ${Math.max(7, card.height * 0.15)}px var(--font-geist-sans), sans-serif`;
      const tagText = card.tag.toUpperCase();
      const tagWidth = context.measureText(tagText).width + 10;
      const tagHeight = Math.max(12, card.height * 0.24);
      const tagLeft = left + card.width - tagWidth - 10;
      const tagTop = top + 8;

      pathRoundedRect(context, tagLeft, tagTop, tagWidth, tagHeight, tagHeight * 0.45);
      context.fillStyle = card.isRight ? "rgba(242, 255, 248, 0.48)" : "rgba(255, 236, 242, 0.48)";
      context.fill();
      context.fillStyle = card.isRight ? "rgba(18, 92, 48, 0.96)" : "rgba(132, 26, 54, 0.96)";
      context.textAlign = "center";
      context.fillText(tagText, tagLeft + tagWidth * 0.5, tagTop + tagHeight * 0.5 + 0.5);

      if (card.hover > 0.02) {
        context.save();
        pathRoundedRect(context, left, top, card.width, card.height, radius);
        context.clip();

        const shimmerWidth = Math.max(28, card.width * 0.24);
        const travel = card.width + shimmerWidth * 2;
        const shimmerOffset = ((now * 0.32 + card.jitterSeed * 9.2) % travel) - shimmerWidth;

        context.translate(left + shimmerOffset, top - card.height * 0.4);
        context.rotate(-0.24);

        const shimmerGradient = context.createLinearGradient(0, 0, shimmerWidth, 0);
        shimmerGradient.addColorStop(0, "rgba(255,255,255,0)");
        shimmerGradient.addColorStop(
          0.5,
          `rgba(255,255,255,${(0.14 + card.hover * 0.34).toFixed(3)})`,
        );
        shimmerGradient.addColorStop(1, "rgba(255,255,255,0)");

        context.fillStyle = shimmerGradient;
        context.fillRect(0, 0, shimmerWidth, card.height * 2.3);
        context.restore();
      }

      context.restore();
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

    const onPointerDown = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;

      for (let index = 0; index < maxCards; index += 1) {
        const card = cards[index];
        if (!card.active) {
          continue;
        }

        const dx = card.x - pointer.x;
        const dy = card.y - pointer.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist > 260) {
          continue;
        }

        const force = (1 - dist / 260) * 340;
        card.vx += (dx / dist) * force;
        card.vy += (dy / dist) * force;
        card.spin += (Math.random() - 0.5) * 1.2;
        card.hover = Math.max(card.hover, 0.5);
      }
    };

    resize();

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width * 0.5;
      const centerY = height * 0.53;

      let hoveredIndex = -1;
      if (pointer.active) {
        for (let index = maxCards - 1; index >= 0; index -= 1) {
          const card = cards[index];
          if (!card.active) {
            continue;
          }
          if (isPointerInsideCard(card, pointer.x, pointer.y)) {
            hoveredIndex = index;
            break;
          }
        }
      }

      spawnAccumulator += dt * baseSpawnRate;
      while (spawnAccumulator >= 1) {
        spawnAccumulator -= 1;
        spawnCard(width, height);
      }

      drawBackground(width, height, now);

      const drawQueue: Array<{ index: number; visibility: number }> = [];

      for (let index = 0; index < maxCards; index += 1) {
        const card = cards[index];
        if (!card.active) {
          continue;
        }

        if (index === hoveredIndex) {
          card.hover = clamp(card.hover + dt * 6.5, 0, 1);
        } else {
          card.hover = clamp(card.hover - dt * 3.2, 0, 1);
        }

        const dx = centerX - card.x;
        const dy = centerY - card.y;
        const dist = Math.hypot(dx, dy) || 1;
        const pull = 28 + 260 / (1 + dist * 0.03);
        const swirl = card.isRight ? 12 : 27;

        card.vx += (dx / dist) * pull * dt + (-dy / dist) * swirl * dt;
        card.vy += (dy / dist) * pull * dt + (dx / dist) * swirl * dt;

        if (pointer.active) {
          const pdx = card.x - pointer.x;
          const pdy = card.y - pointer.y;
          const pointerDist = Math.hypot(pdx, pdy) || 1;
          if (pointerDist < 240) {
            const influence = (1 - pointerDist / 240) * (card.isRight ? 18 : 28);
            card.vx += (-pdy / pointerDist) * influence * dt * 5.4;
            card.vy += (pdx / pointerDist) * influence * dt * 5.4;
          }
        }

        card.vx *= 0.9925 - card.hover * 0.001;
        card.vy *= 0.9925 - card.hover * 0.001;

        card.x += card.vx * dt;
        card.y += card.vy * dt;
        card.angle += card.spin * dt;
        card.life -= dt * 0.92;

        if (dist < 170) {
          card.life -= dt * (1.1 + (170 - dist) / 70);
        }

        const edgeMargin = Math.min(
          card.x + 260,
          width + 260 - card.x,
          card.y + 210,
          height + 210 - card.y,
        );
        if (edgeMargin < 110) {
          card.life -= dt * clamp((110 - edgeMargin) / 48, 0, 4.6);
        }

        const lifeFade = clamp(card.life / (card.maxLife * 0.52), 0, 1);
        const voidFade = clamp((dist - 16) / 140, 0, 1);
        const edgeFade = clamp(edgeMargin / 110, 0, 1);
        const visibility = lifeFade * Math.min(voidFade, edgeFade);

        if (
          card.life <= -0.42 ||
          dist < 8 ||
          edgeMargin < -190 ||
          visibility <= 0.006
        ) {
          card.active = false;
          continue;
        }

        drawQueue.push({ index, visibility });
      }

      for (let queueIndex = 0; queueIndex < drawQueue.length; queueIndex += 1) {
        const item = drawQueue[queueIndex];
        drawCard(cards[item.index], now, item.visibility);
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#010103] text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-pointer" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,rgba(255,255,255,0.05),transparent_62%)]" />

      <div className="absolute left-4 top-4 z-10 flex max-w-md flex-col gap-3 border border-white/20 bg-black/65 px-4 py-4 backdrop-blur-sm">
        <p className="font-sans text-[11px] uppercase tracking-[0.11em] text-slate-200">
          Exhibition Piece 3 / {PIECE_COUNT}
        </p>
        <h1 className="font-pixel-square text-3xl leading-none text-white sm:text-4xl">Evals</h1>
        <p className="font-sans text-xs leading-relaxed text-white/84 sm:text-sm">
          Inside the singularity, static screams while verdict cards keep arriving: almost all
          wrong, only rarely right.
        </p>
        <PieceNavigationControls pieceId={3} />
      </div>
    </div>
  );
}
