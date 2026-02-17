"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

type Token = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  spin: number;
  hue: number;
  saturation: number;
  lightness: number;
  label: string;
};

type Impact = {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  hue: number;
};

const PIECE_TITLES = [
  "Token Ceiling",
  "Latent Bloom",
  "Edge Grammar",
  "Ghost Buffer",
  "Soft Prompt",
  "State Mirror",
  "Silent Branch",
  "Fork Pulse",
  "Memory Lattice",
  "Final Resolve",
];

const TOKEN_LABELS = ["TOK", "CTX", "SEQ", "BPE", "RAM", "LOG", "VEC", "AST"];

function emptyToken(): Token {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 0,
    angle: 0,
    spin: 0,
    hue: 0,
    saturation: 0,
    lightness: 0,
    label: "TOK",
  };
}

function emptyImpact(): Impact {
  return {
    active: false,
    x: 0,
    y: 0,
    radius: 0,
    life: 0,
    maxLife: 0,
    hue: 0,
  };
}

function PlaceholderPiece({ id, title }: { id: number; title: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040406] text-white">
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative flex max-w-xl flex-col items-center gap-4 border border-white/20 bg-black/70 px-8 py-10 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.12em] text-white/70">
          Piece {id} of 10
        </p>
        <h1 className="font-pixel-square text-4xl text-lime-300 sm:text-5xl">{title}</h1>
        <p className="font-sans text-sm text-white/80">
          This chamber is loading soon. Piece 1 is currently available.
        </p>
        <Link
          href="/"
          className="mt-2 border border-black bg-orange-500 px-5 py-2 font-sans text-sm font-semibold uppercase tracking-[0.08em] text-black shadow-[0_4px_0_#7c2d12]"
        >
          back to lobby
        </Link>
      </div>
    </div>
  );
}

function TokenCeilingPiece() {
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

    const maxTokens = 720;
    const maxImpacts = 180;
    const gravity = 840;
    const ceilingRatio = 0.1;
    const spawnRate = 235;
    const cannonCount = 7;
    const tokens = Array.from({ length: maxTokens }, emptyToken);
    const impacts = Array.from({ length: maxImpacts }, emptyImpact);
    let spawnAccumulator = 0;
    let spawnIndex = 0;
    let impactIndex = 0;
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
      token.size = 11 + Math.random() * 17;
      token.angle = Math.random() * Math.PI * 2;
      token.spin = (Math.random() - 0.5) * 10;
      token.hue = Math.random() * 360;
      token.saturation = 86 + Math.random() * 13;
      token.lightness = 52 + Math.random() * 18;
      token.label = TOKEN_LABELS[(spawnIndex + Math.floor(Math.random() * TOKEN_LABELS.length)) % TOKEN_LABELS.length];
      spawnIndex += 1;
    };

    const addImpact = (x: number, y: number, hue: number) => {
      const impact = impacts[impactIndex % maxImpacts];
      impact.active = true;
      impact.x = x;
      impact.y = y;
      impact.radius = 5 + Math.random() * 9;
      impact.maxLife = 0.34 + Math.random() * 0.24;
      impact.life = impact.maxLife;
      impact.hue = hue;
      impactIndex += 1;
    };

    const drawToken = (token: Token) => {
      context.save();
      context.translate(token.x, token.y);
      context.rotate(token.angle);
      context.fillStyle = `hsl(${token.hue} ${token.saturation}% ${token.lightness}%)`;
      context.fillRect(-token.size / 2, -token.size / 2, token.size, token.size);
      context.strokeStyle = "rgba(0,0,0,0.7)";
      context.lineWidth = 1.2;
      context.strokeRect(-token.size / 2, -token.size / 2, token.size, token.size);
      context.fillStyle = "rgba(0,0,0,0.82)";
      context.font = `${Math.max(6.5, token.size * 0.28)}px var(--font-geist-mono), monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(token.label, 0, 0);
      context.restore();
    };

    const drawImpact = (impact: Impact) => {
      const alpha = Math.max(0, impact.life / impact.maxLife);
      context.strokeStyle = `hsla(${impact.hue} 100% 66% / ${alpha * 0.92})`;
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(impact.x, impact.y, impact.radius + (1 - alpha) * 22, 0, Math.PI * 2);
      context.stroke();
    };

    resize();

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ceilingY = Math.max(52, height * ceilingRatio);
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

        const half = token.size / 2;

        if (token.y - half <= ceilingY && token.vy < 0) {
          token.y = ceilingY + half;
          token.vy = Math.abs(token.vy) * (0.74 + Math.random() * 0.16);
          token.vx += (Math.random() - 0.5) * 170;
          token.spin += (Math.random() - 0.5) * 6;
          addImpact(token.x, ceilingY, token.hue);
        }

        if (token.x - half < 0 && token.vx < 0) {
          token.x = half;
          token.vx *= -0.72;
        } else if (token.x + half > width && token.vx > 0) {
          token.x = width - half;
          token.vx *= -0.72;
        }

        if (token.y - token.size > floorY) {
          token.active = false;
          continue;
        }

        drawToken(token);
      }

      for (let i = 0; i < maxImpacts; i += 1) {
        const impact = impacts[i];
        if (!impact.active) {
          continue;
        }
        impact.life -= dt;
        if (impact.life <= 0) {
          impact.active = false;
          continue;
        }
        drawImpact(impact);
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030409] text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,rgba(255,140,34,0.12),transparent_58%)]" />

      <div className="absolute left-4 top-4 z-10 flex max-w-sm flex-col gap-3 border border-white/20 bg-black/65 px-4 py-4 backdrop-blur-sm">
        <p className="font-sans text-[11px] uppercase tracking-[0.11em] text-orange-300">
          Exhibition Piece 1 / 10
        </p>
        <h1 className="font-pixel-square text-3xl leading-none text-orange-200 sm:text-4xl">
          Token Ceiling
        </h1>
        <p className="font-sans text-xs leading-relaxed text-white/84 sm:text-sm">
          A ream of technicolour token blocks is fired violently upward and repeatedly slammed into the y-min ceiling.
        </p>
        <Link
          href="/"
          className="pointer-events-auto inline-flex w-fit border border-black bg-orange-500 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-black shadow-[0_4px_0_#7c2d12] sm:text-sm"
        >
          back to lobby
        </Link>
      </div>
    </div>
  );
}

export default function PiecePage() {
  const params = useParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsed = Number(rawId);
  const pieceId = Number.isFinite(parsed) ? Math.min(10, Math.max(1, Math.floor(parsed))) : 1;
  const title = useMemo(() => PIECE_TITLES[pieceId - 1], [pieceId]);

  if (pieceId === 1) {
    return <TokenCeilingPiece />;
  }

  return <PlaceholderPiece id={pieceId} title={title} />;
}
