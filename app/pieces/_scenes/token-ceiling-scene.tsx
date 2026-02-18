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
  height: number;
  angle: number;
  spin: number;
  hue: number;
  saturation: number;
  lightness: number;
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
    height: 0,
    angle: 0,
    spin: 0,
    hue: 0,
    saturation: 0,
    lightness: 0,
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
    const spawnRate = 235;
    const cannonCount = 7;
    const tokens = Array.from({ length: maxTokens }, emptyToken);
    const ceilingBits = Array.from({ length: maxCeilingBits }, emptyCeilingBit);

    let spawnAccumulator = 0;
    let spawnIndex = 0;
    let ceilingBitIndex = 0;
    let pointerCeilingY: number | null = null;
    let rafId = 0;
    let lastTime = performance.now();

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

    const spawnToken = (width: number, height: number) => {
      const token = tokens[spawnIndex % maxTokens];
      const lane = spawnIndex % cannonCount;
      const laneWidth = width / (cannonCount + 1);
      const originX = laneWidth * (lane + 1) + (Math.random() - 0.5) * laneWidth * 0.36;

      token.active = true;
      token.x = originX;
      token.y = height + 14 + Math.random() * 40;
      token.vx = (Math.random() - 0.5) * 260 + (lane - (cannonCount - 1) / 2) * 34;
      token.vy = -(860 + Math.random() * 980);
      token.angle = Math.random() * Math.PI * 2;
      token.spin = (Math.random() - 0.5) * 10;
      token.hue = Math.random() * 360;
      token.saturation = 86 + Math.random() * 13;
      token.lightness = 52 + Math.random() * 18;
      token.label =
        labelPool[
          (spawnIndex + Math.floor(Math.random() * labelPool.length)) % labelPool.length
        ];
      token.height = 11 + Math.random() * 10;
      token.width = Math.max(
        token.height * 1.12,
        token.height * (0.72 + token.label.length * 0.3),
      );

      spawnIndex += 1;
    };

    const addCeilingBurst = (
      x: number,
      y: number,
      hue: number,
      impactVelocity: number,
    ) => {
      const velocityScale = clamp(Math.abs(impactVelocity) / 1100, 0.6, 1.6);
      const burstCount = 5 + Math.floor(Math.random() * 7);

      for (let bitIndex = 0; bitIndex < burstCount; bitIndex += 1) {
        const bit = ceilingBits[ceilingBitIndex % maxCeilingBits];
        ceilingBitIndex += 1;

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
      }
    };

    const drawToken = (token: Token) => {
      context.save();
      context.translate(token.x, token.y);
      context.rotate(token.angle);
      context.fillStyle = `hsl(${token.hue} ${token.saturation}% ${token.lightness}%)`;
      context.fillRect(-token.width / 2, -token.height / 2, token.width, token.height);
      context.fillStyle = "rgba(255,255,255,0.96)";
      context.font = `800 ${Math.max(5.8, token.height * 0.35)}px var(--font-geist-pixel-square), monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(token.label, 0, 0);
      context.restore();
    };

    const drawCeilingBit = (bit: CeilingBit) => {
      const alpha = Math.max(0, bit.life / bit.maxLife);
      const side = Math.max(1, Math.round(bit.size * (0.7 + alpha * 0.55)));
      const x = Math.round(bit.x - side * 0.5);
      const y = Math.round(bit.y - side * 0.5);
      context.fillStyle = `hsla(${bit.hue} 95% ${bit.lightness}% / ${alpha * 0.95})`;
      context.fillRect(x, y, side, side);
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointerCeilingY = event.clientY - bounds.top;
    };

    const onPointerLeave = () => {
      pointerCeilingY = null;
    };

    resize();

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const defaultCeilingY = Math.max(52, height * ceilingRatio);
      const ceilingMinY = 28;
      const ceilingMaxY = Math.max(ceilingMinY + 36, height - 112);
      const ceilingY =
        pointerCeilingY === null
          ? defaultCeilingY
          : clamp(pointerCeilingY, ceilingMinY, ceilingMaxY);
      const floorY = height + 90;

      spawnAccumulator += dt * spawnRate;
      while (spawnAccumulator >= 1) {
        spawnAccumulator -= 1;
        spawnToken(width, height);
      }

      context.fillStyle = "rgba(3, 5, 9, 0.24)";
      context.fillRect(0, 0, width, height);

      const ceilingGradient = context.createLinearGradient(0, 0, 0, ceilingY + 8);
      ceilingGradient.addColorStop(0, "rgba(255, 122, 25, 0.16)");
      ceilingGradient.addColorStop(1, "rgba(255, 122, 25, 0)");
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

      const cannonWidth = width / (cannonCount + 1);
      for (let cannon = 0; cannon < cannonCount; cannon += 1) {
        const x = cannonWidth * (cannon + 1);
        context.fillStyle = "rgba(255, 122, 25, 0.4)";
        context.fillRect(x - 8, height - 18, 16, 18);
      }

      for (let i = 0; i < maxTokens; i += 1) {
        const token = tokens[i];
        if (!token.active) {
          continue;
        }

        token.vy += gravity * dt;
        token.x += token.vx * dt;
        token.y += token.vy * dt;
        token.angle += token.spin * dt;

        const halfWidth = token.width / 2;
        const halfHeight = token.height / 2;

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
          continue;
        }

        drawCeilingBit(bit);
      }

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
