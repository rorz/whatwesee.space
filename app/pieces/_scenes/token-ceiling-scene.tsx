"use client";

import { useEffect, useMemo, useRef } from "react";
import PieceNavigationControls from "../_components/piece-navigation-controls";
import { PIECE_COUNT } from "../_lib/piece-constants";

type Token = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  halfWidth: number;
  height: number;
  halfHeight: number;
  angle: number;
  spin: number;
  hue: number;
  saturation: number;
  lightness: number;
  fillStyle: string;
  textFont: string;
  label: string;
};

type CeilingBit = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  lightness: number;
  fillStyle: string;
};

const FALLBACK_TOKEN_POOL = [
  "mind",
  "grid",
  "trace",
  "state",
  "logic",
  "frame",
  "node",
  "signal",
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function emptyToken(): Token {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: 0,
    halfWidth: 0,
    height: 0,
    halfHeight: 0,
    angle: 0,
    spin: 0,
    hue: 0,
    saturation: 0,
    lightness: 0,
    fillStyle: "hsl(0 0% 0%)",
    textFont: "800 6px var(--font-geist-pixel-square), monospace",
    label: "DATA",
  };
}

function emptyCeilingBit(): CeilingBit {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 0,
    life: 0,
    maxLife: 0,
    hue: 0,
    lightness: 0,
    fillStyle: "hsl(0 0% 0%)",
  };
}

type TokenCeilingSceneProps = {
  tokenPool: string[];
};

export default function TokenCeilingScene({ tokenPool }: TokenCeilingSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelPool = useMemo(() => {
    const sanitized = tokenPool
      .map((token) => token.trim().toUpperCase())
      .filter((token) => token.length >= 2 && token.length <= 5);
    return sanitized.length > 0
      ? sanitized
      : FALLBACK_TOKEN_POOL.map((token) => token.toUpperCase());
  }, [tokenPool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      return;
    }

    const maxTokens = 720;
    const maxCeilingBits = 1500;
    const gravity = 840;
    const ceilingRatio = 0.1;
    const ceilingMinY = 28;
    const spawnRate = 235;
    const minSpawnRateScaleAtTop = 0.6;
    const baseActiveTokenBudget = 420;
    const topActiveTokenBudget = 250;
    const baseActiveCeilingBitBudget = 620;
    const topActiveCeilingBitBudget = 340;
    const cannonCount = 7;
    const tokens = Array.from({ length: maxTokens }, emptyToken);
    const ceilingBits = Array.from({ length: maxCeilingBits }, emptyCeilingBit);

    let activeTokenCount = 0;
    let activeCeilingBitCount = 0;
    let spawnAccumulator = 0;
    let spawnIndex = 0;
    let ceilingBitIndex = 0;
    let currentCeilingPressure = 0;
    let currentCeilingBitBudget = baseActiveCeilingBitBudget;
    let pointerCeilingY: number | null = null;
    let rafId = 0;
    let lastTime = performance.now();
    let viewportWidth = 1;
    let viewportHeight = 1;
    let laneWidth = 1;
    let defaultCeilingY = 52;
    let ceilingMaxY = 88;
    let floorY = 190;
    const cannonX = new Float32Array(cannonCount);
    let ceilingGradient: CanvasGradient | null = null;
    let ceilingGradientWidth = -1;
    let ceilingGradientY = -1;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      laneWidth = viewportWidth / (cannonCount + 1);
      defaultCeilingY = Math.max(52, viewportHeight * ceilingRatio);
      ceilingMaxY = Math.max(ceilingMinY + 36, viewportHeight - 112);
      floorY = viewportHeight + 90;
      for (let cannon = 0; cannon < cannonCount; cannon += 1) {
        cannonX[cannon] = laneWidth * (cannon + 1);
      }
      ceilingGradient = null;
      ceilingGradientWidth = -1;
      ceilingGradientY = -1;

      canvas.width = Math.floor(viewportWidth * dpr);
      canvas.height = Math.floor(viewportHeight * dpr);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnToken = () => {
      const token = tokens[spawnIndex % maxTokens];
      const lane = spawnIndex % cannonCount;
      const originX = cannonX[lane] + (Math.random() - 0.5) * laneWidth * 0.36;

      if (!token.active) {
        activeTokenCount += 1;
      }
      token.active = true;
      token.x = originX;
      token.y = viewportHeight + 14 + Math.random() * 40;
      token.vx = (Math.random() - 0.5) * 260 + (lane - (cannonCount - 1) / 2) * 34;
      token.vy = -(860 + Math.random() * 980);
      token.angle = Math.random() * Math.PI * 2;
      token.spin = (Math.random() - 0.5) * 10;
      token.hue = Math.random() * 360;
      token.saturation = 86 + Math.random() * 13;
      token.lightness = 52 + Math.random() * 18;
      token.fillStyle = `hsl(${token.hue} ${token.saturation}% ${token.lightness}%)`;
      token.label =
        labelPool[
          (spawnIndex + Math.floor(Math.random() * labelPool.length)) % labelPool.length
        ];
      token.height = 11 + Math.random() * 10;
      token.width = Math.max(
        token.height * 1.12,
        token.height * (0.72 + token.label.length * 0.3),
      );
      token.halfWidth = token.width * 0.5;
      token.halfHeight = token.height * 0.5;
      token.textFont = `800 ${Math.max(5.8, token.height * 0.35)}px var(--font-geist-pixel-square), monospace`;

      spawnIndex += 1;
    };

    const addCeilingBurst = (
      x: number,
      y: number,
      hue: number,
      impactVelocity: number,
    ) => {
      if (activeCeilingBitCount >= currentCeilingBitBudget) {
        return;
      }

      const velocityScale = clamp(Math.abs(impactVelocity) / 1100, 0.6, 1.6);
      const baseBurstCount = 5 + Math.floor(Math.random() * 7);
      const burstCountScale = 1 - currentCeilingPressure * 0.45;
      const availableBits = currentCeilingBitBudget - activeCeilingBitCount;
      if (availableBits <= 0) {
        return;
      }
      const burstCount = Math.max(
        1,
        Math.min(
          availableBits,
          Math.round(baseBurstCount * burstCountScale),
        ),
      );

      for (let bitIndex = 0; bitIndex < burstCount; bitIndex += 1) {
        const bit = ceilingBits[ceilingBitIndex % maxCeilingBits];
        ceilingBitIndex += 1;

        if (!bit.active) {
          activeCeilingBitCount += 1;
        }
        bit.active = true;
        bit.x = x + (Math.random() - 0.5) * 9;
        bit.y = y - 1 - Math.random() * 4;
        bit.vx = (Math.random() - 0.5) * (170 + velocityScale * 220);
        bit.vy = -(160 + Math.random() * 320 * velocityScale);
        bit.size = 1.6 + Math.random() * 3.6;
        bit.maxLife = 0.16 + Math.random() * 0.34;
        bit.life = bit.maxLife;
        bit.hue = (hue + (Math.random() - 0.5) * 24 + 360) % 360;
        bit.lightness = 58 + Math.random() * 22;
        bit.fillStyle = `hsl(${bit.hue} 95% ${bit.lightness}%)`;
      }
    };

    const drawToken = (token: Token) => {
      context.save();
      context.translate(token.x, token.y);
      context.rotate(token.angle);
      context.fillStyle = token.fillStyle;
      context.fillRect(-token.halfWidth, -token.halfHeight, token.width, token.height);
      context.fillStyle = "rgba(255,255,255,0.96)";
      context.font = token.textFont;
      context.fillText(token.label, 0, 0);
      context.restore();
    };

    const drawCeilingBit = (bit: CeilingBit) => {
      const alpha = Math.max(0, bit.life / bit.maxLife);
      const side = Math.max(1, Math.round(bit.size * (0.7 + alpha * 0.55)));
      const x = Math.round(bit.x - side * 0.5);
      const y = Math.round(bit.y - side * 0.5);
      context.globalAlpha = alpha * 0.95;
      context.fillStyle = bit.fillStyle;
      context.fillRect(x, y, side, side);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerCeilingY = event.offsetY;
    };

    const onPointerLeave = () => {
      pointerCeilingY = null;
    };

    resize();

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;

      const width = viewportWidth;
      const height = viewportHeight;
      const ceilingY =
        pointerCeilingY === null
          ? defaultCeilingY
          : clamp(pointerCeilingY, ceilingMinY, ceilingMaxY);
      const ceilingGradientYKey = Math.round((ceilingY + 8) * 2) / 2;

      const ceilingPressure = clamp(
        (defaultCeilingY - ceilingY) / Math.max(1, defaultCeilingY - ceilingMinY),
        0,
        1,
      );
      currentCeilingPressure = ceilingPressure;
      const activeTokenBudget = Math.round(
        baseActiveTokenBudget +
          (topActiveTokenBudget - baseActiveTokenBudget) * ceilingPressure,
      );
      currentCeilingBitBudget = Math.round(
        baseActiveCeilingBitBudget +
          (topActiveCeilingBitBudget - baseActiveCeilingBitBudget) * ceilingPressure,
      );

      const spawnScaleForCeiling = 1 - ceilingPressure * (1 - minSpawnRateScaleAtTop);
      const tokenOverflow = clamp(
        (activeTokenCount - activeTokenBudget) / Math.max(1, activeTokenBudget),
        0,
        1,
      );
      const spawnScaleForLoad = 1 - tokenOverflow * 0.88;
      const effectiveSpawnRate = spawnRate * spawnScaleForCeiling * spawnScaleForLoad;

      spawnAccumulator = Math.min(spawnAccumulator + dt * effectiveSpawnRate, 3.4);
      while (spawnAccumulator >= 1 && activeTokenCount < maxTokens) {
        if (activeTokenCount >= activeTokenBudget) {
          break;
        }
        spawnAccumulator -= 1;
        spawnToken();
      }

      context.globalAlpha = 1;
      context.fillStyle = "rgba(3, 5, 9, 0.24)";
      context.fillRect(0, 0, width, height);

      if (
        !ceilingGradient ||
        ceilingGradientWidth !== width ||
        ceilingGradientY !== ceilingGradientYKey
      ) {
        ceilingGradient = context.createLinearGradient(0, 0, 0, ceilingGradientYKey);
        ceilingGradient.addColorStop(0, "rgba(255, 122, 25, 0.16)");
        ceilingGradient.addColorStop(1, "rgba(255, 122, 25, 0)");
        ceilingGradientWidth = width;
        ceilingGradientY = ceilingGradientYKey;
      }
      context.fillStyle = ceilingGradient;
      context.fillRect(0, 0, width, ceilingY + 8);
      context.strokeStyle = "rgba(255, 122, 25, 0.86)";
      context.lineWidth = 2.2;
      context.beginPath();
      context.moveTo(0, ceilingY);
      context.lineTo(width, ceilingY);
      context.stroke();

      context.fillStyle = "rgba(255,255,255,0.84)";
      context.font = "600 12px var(--font-geist-sans), sans-serif";
      context.textAlign = "left";
      context.textBaseline = "top";
      context.fillText("y-min barrier", 14, Math.max(8, ceilingY - 18));

      context.fillStyle = "rgba(255, 122, 25, 0.4)";
      for (let cannon = 0; cannon < cannonCount; cannon += 1) {
        context.fillRect(cannonX[cannon] - 8, height - 18, 16, 18);
      }

      context.textAlign = "center";
      context.textBaseline = "middle";
      for (let i = 0; i < maxTokens; i += 1) {
        const token = tokens[i];
        if (!token.active) {
          continue;
        }

        token.vy += gravity * dt;
        token.x += token.vx * dt;
        token.y += token.vy * dt;
        token.angle += token.spin * dt;

        const halfWidth = token.halfWidth;
        const halfHeight = token.halfHeight;

        if (token.y - halfHeight <= ceilingY && token.vy < 0) {
          const impactVelocity = token.vy;
          token.y = ceilingY + halfHeight;
          token.vy = Math.abs(token.vy) * (0.74 + Math.random() * 0.16);
          token.vx += (Math.random() - 0.5) * 170;
          token.spin += (Math.random() - 0.5) * 6;
          addCeilingBurst(token.x, ceilingY, token.hue, impactVelocity);
        }

        if (token.x - halfWidth < 0 && token.vx < 0) {
          token.x = halfWidth;
          token.vx *= -0.72;
        } else if (token.x + halfWidth > width && token.vx > 0) {
          token.x = width - halfWidth;
          token.vx *= -0.72;
        }

        if (token.y - halfHeight > floorY) {
          token.active = false;
          activeTokenCount = Math.max(0, activeTokenCount - 1);
          continue;
        }

        if (
          activeTokenCount > activeTokenBudget &&
          token.vy > 0 &&
          token.y - halfHeight > height + 24
        ) {
          token.active = false;
          activeTokenCount = Math.max(0, activeTokenCount - 1);
          continue;
        }

        if (
          token.x + halfWidth < -12 ||
          token.x - halfWidth > width + 12 ||
          token.y + halfHeight < -16 ||
          token.y - halfHeight > height + 16
        ) {
          continue;
        }

        drawToken(token);
      }

      for (let i = 0; i < maxCeilingBits; i += 1) {
        const bit = ceilingBits[i];
        if (!bit.active) {
          continue;
        }

        bit.vy += gravity * 0.42 * dt;
        bit.x += bit.vx * dt;
        bit.y += bit.vy * dt;
        bit.life -= dt;

        if (
          bit.life <= 0 ||
          bit.y > ceilingY + 82 ||
          bit.y < -64 ||
          bit.x < -24 ||
          bit.x > width + 24
        ) {
          bit.active = false;
          activeCeilingBitCount = Math.max(0, activeCeilingBitCount - 1);
          continue;
        }

        drawCeilingBit(bit);
      }
      context.globalAlpha = 1;

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [labelPool]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030409] text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,rgba(255,140,34,0.12),transparent_58%)]" />

      <div className="absolute left-4 top-4 z-10 flex max-w-md flex-col gap-3 border border-white/20 bg-black/65 px-4 py-4 backdrop-blur-sm relative">
        <p className="font-sans text-[11px] uppercase tracking-[0.11em] text-orange-300">
          Exhibition Piece 1 / {PIECE_COUNT}
        </p>
        <h1 className="font-pixel-square text-3xl leading-none text-orange-200 sm:text-4xl">
          Token Ceiling
        </h1>
        <p className="font-sans text-xs leading-relaxed text-white/84 sm:text-sm">
          A ream of technicolour token blocks is fired violently upward and repeatedly slammed into the y-min ceiling.
        </p>
        <PieceNavigationControls pieceId={1} />
      </div>
    </div>
  );
}
