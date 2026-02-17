"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

type Vec = {
  x: number;
  y: number;
};

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

type BloomNode = {
  x: number;
  y: number;
  energy: number;
  hue: number;
};

type BloomBranch = {
  active: boolean;
  points: Vec[];
  progress: number;
  speed: number;
  life: number;
  maxLife: number;
  hue: number;
  width: number;
};

type BloomTrace = {
  active: boolean;
  points: Vec[];
  life: number;
  maxLife: number;
  hue: number;
  width: number;
};

export const PIECE_COUNT = 10;

export const PIECE_TITLES = [
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

type PieceViewClientProps = {
  pieceId: number;
  title: string;
  tokenPool: string[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function wrapPiece(id: number): number {
  if (id < 1) {
    return PIECE_COUNT;
  }
  if (id > PIECE_COUNT) {
    return 1;
  }
  return id;
}

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

function emptyBranch(): BloomBranch {
  return {
    active: false,
    points: [],
    progress: 0,
    speed: 0,
    life: 0,
    maxLife: 0,
    hue: 0,
    width: 0,
  };
}

function emptyTrace(): BloomTrace {
  return {
    active: false,
    points: [],
    life: 0,
    maxLife: 0,
    hue: 0,
    width: 0,
  };
}

function PieceNavigationControls({ pieceId }: { pieceId: number }) {
  const prev = wrapPiece(pieceId - 1);
  const next = wrapPiece(pieceId + 1);

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/"
          className="pointer-events-auto inline-flex border border-black bg-orange-500 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-black shadow-[0_4px_0_#7c2d12] sm:text-sm"
        >
          back to start
        </Link>
        <Link
          href={`/pieces/${prev}`}
          className="pointer-events-auto inline-flex border border-white/30 bg-black/65 px-3 py-2 font-sans text-xs font-semibold uppercase tracking-[0.09em] text-white hover:bg-white/10 sm:text-sm"
        >
          prev piece
        </Link>
        <Link
          href={`/pieces/${next}`}
          className="pointer-events-auto inline-flex border border-white/30 bg-black/65 px-3 py-2 font-sans text-xs font-semibold uppercase tracking-[0.09em] text-white hover:bg-white/10 sm:text-sm"
        >
          next piece
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: PIECE_COUNT }, (_, index) => {
          const id = index + 1;
          const active = id === pieceId;
          return (
            <Link
              key={`piece-link-${id}`}
              href={`/pieces/${id}`}
              className={`pointer-events-auto inline-flex min-w-[2rem] items-center justify-center border px-2 py-1 font-mono text-[11px] font-semibold tracking-[0.04em] ${active ? "border-orange-300 bg-orange-400 text-black" : "border-white/25 bg-black/55 text-white hover:bg-white/10"}`}
            >
              {id}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function PlaceholderPiece({ id, title }: { id: number; title: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040406] text-white">
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative flex max-w-xl flex-col items-center gap-4 border border-white/20 bg-black/70 px-8 py-10 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.12em] text-white/70">
          Piece {id} of {PIECE_COUNT}
        </p>
        <h1 className="font-pixel-square text-4xl text-lime-300 sm:text-5xl">{title}</h1>
        <p className="font-sans text-sm text-white/80">
          This chamber is loading soon. Pieces 1 and 2 are currently available.
        </p>
        <PieceNavigationControls pieceId={id} />
      </div>
    </div>
  );
}

function TokenCeilingPiece({ tokenPool }: { tokenPool: string[] }) {
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
      token.label =
        labelPool[
          (spawnIndex + Math.floor(Math.random() * labelPool.length)) % labelPool.length
        ];
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
      context.fillRect(-token.size / 2, -token.size / 2, token.size, token.size);
      context.strokeStyle = "rgba(0,0,0,0.7)";
      context.lineWidth = 1.2;
      context.strokeRect(-token.size / 2, -token.size / 2, token.size, token.size);
      context.fillStyle = "rgba(0,0,0,0.82)";
      context.font = `${Math.max(6.5, token.size * 0.28)}px var(--font-geist-pixel-square), monospace`;
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
          const impactVelocity = token.vy;
          token.y = ceilingY + half;
          token.vy = Math.abs(token.vy) * (0.74 + Math.random() * 0.16);
          token.vx += (Math.random() - 0.5) * 170;
          token.spin += (Math.random() - 0.5) * 6;
          addCeilingBurst(token.x, ceilingY, token.hue, impactVelocity);
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

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [labelPool]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030409] text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,rgba(255,140,34,0.12),transparent_58%)]" />

      <div className="absolute left-4 top-4 z-10 flex max-w-md flex-col gap-3 border border-white/20 bg-black/65 px-4 py-4 backdrop-blur-sm">
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

function LatentBloomPiece() {
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

    const maxBranches = 190;
    const maxTraces = 240;
    const branches = Array.from({ length: maxBranches }, emptyBranch);
    const traces = Array.from({ length: maxTraces }, emptyTrace);
    let branchCursor = 0;
    let traceCursor = 0;
    let nodes: BloomNode[] = [];
    let ambientTimer = 0;
    let pointerEmitTimer = 0;
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

      const spacing = width < 640 ? 26 : width < 1024 ? 31 : 36;
      const rebuilt: BloomNode[] = [];
      let nodeIndex = 0;
      for (let y = spacing * 0.8; y < height - spacing * 0.2; y += spacing) {
        for (let x = spacing * 0.8; x < width - spacing * 0.2; x += spacing) {
          const jitterX = (seededNoise(nodeIndex * 17 + 3) - 0.5) * spacing * 0.3;
          const jitterY = (seededNoise(nodeIndex * 29 + 7) - 0.5) * spacing * 0.3;
          rebuilt.push({
            x: x + jitterX,
            y: y + jitterY,
            energy: 0,
            hue: 180 + seededNoise(nodeIndex * 13 + 9) * 180,
          });
          nodeIndex += 1;
        }
      }
      nodes = rebuilt;
    };

    const drawPolyline = (points: Vec[], progress: number) => {
      if (points.length < 2) {
        return;
      }
      const segments = points.length - 1;
      const bounded = clamp(progress, 0, 1) * segments;
      const full = Math.floor(bounded);
      const partial = bounded - full;

      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let segment = 0; segment < full; segment += 1) {
        const point = points[segment + 1];
        context.lineTo(point.x, point.y);
      }
      if (full < segments) {
        const start = points[full];
        const end = points[full + 1];
        context.lineTo(
          start.x + (end.x - start.x) * partial,
          start.y + (end.y - start.y) * partial,
        );
      }
      context.stroke();
    };

    const spawnTraceFromBranch = (branch: BloomBranch) => {
      const trace = traces[traceCursor % maxTraces];
      traceCursor += 1;
      trace.active = true;
      trace.life = 2.2 + Math.random() * 2.2;
      trace.maxLife = trace.life;
      trace.hue = (branch.hue + 18 + Math.random() * 32) % 360;
      trace.width = 1 + Math.random() * 1.2;
      trace.points = branch.points.map((point) => ({
        x: Math.round(point.x / 7) * 7,
        y: Math.round(point.y / 7) * 7,
      }));
    };

    const ignite = (x: number, y: number, intensity: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const radius = 120 + intensity * 80;
      const radiusSq = radius * radius;
      const baseHue = (performance.now() * 0.045 + Math.random() * 120) % 360;

      for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
        const node = nodes[nodeIndex];
        const dx = node.x - x;
        const dy = node.y - y;
        const distSq = dx * dx + dy * dy;
        if (distSq > radiusSq) {
          continue;
        }
        const dist = Math.sqrt(distSq);
        const impulse = (1 - dist / radius) * intensity;
        node.energy = Math.min(1.55, node.energy + impulse * 1.4);
        node.hue = (baseHue + impulse * 160 + nodeIndex * 0.07) % 360;
      }

      const branchCount = Math.floor(4 + intensity * 3 + Math.random() * 4);
      for (let branchIndex = 0; branchIndex < branchCount; branchIndex += 1) {
        const branch = branches[branchCursor % maxBranches];
        branchCursor += 1;
        branch.active = true;
        branch.points = [];
        branch.progress = 0;
        branch.speed = 1.12 + Math.random() * 1.25;
        branch.maxLife = 0.5 + Math.random() * 0.7;
        branch.life = branch.maxLife;
        branch.hue = (baseHue + branchIndex * 20 + Math.random() * 24) % 360;
        branch.width = 1.4 + Math.random() * 2.2;

        let px = x;
        let py = y;
        let angle =
          ((Math.PI * 2) / branchCount) * branchIndex + (Math.random() - 0.5) * 0.8;
        const segmentCount = 3 + Math.floor(Math.random() * 3);

        branch.points.push({ x: px, y: py });
        for (let segment = 0; segment < segmentCount; segment += 1) {
          angle += (Math.random() - 0.5) * (0.9 + segment * 0.24);
          const length = 24 + Math.random() * 50 + intensity * 20;
          px = clamp(px + Math.cos(angle) * length, 12, width - 12);
          py = clamp(py + Math.sin(angle) * length, 12, height - 12);
          branch.points.push({ x: px, y: py });
        }
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    };

    const onPointerDown = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      ignite(x, y, 1.2);
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    resize();

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      ambientTimer += dt;
      if (ambientTimer > 1.65) {
        ambientTimer = 0;
        ignite(
          width * (0.2 + Math.random() * 0.6),
          height * (0.22 + Math.random() * 0.56),
          0.72,
        );
      }

      if (pointer.active) {
        pointerEmitTimer += dt;
        if (pointerEmitTimer > 0.11) {
          pointerEmitTimer = 0;
          ignite(pointer.x, pointer.y, 0.84);
        }
      } else {
        pointerEmitTimer = 0;
      }

      context.fillStyle = "rgba(2, 4, 10, 0.2)";
      context.fillRect(0, 0, width, height);

      const glowX = pointer.active ? pointer.x : width * 0.5;
      const glowY = pointer.active ? pointer.y : height * 0.5;
      const glow = context.createRadialGradient(glowX, glowY, 18, glowX, glowY, 260);
      glow.addColorStop(0, "rgba(66, 233, 255, 0.09)");
      glow.addColorStop(1, "rgba(66, 233, 255, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      for (let traceIndex = 0; traceIndex < maxTraces; traceIndex += 1) {
        const trace = traces[traceIndex];
        if (!trace.active) {
          continue;
        }
        trace.life -= dt * 0.46;
        if (trace.life <= 0) {
          trace.active = false;
          continue;
        }
        const alpha = (trace.life / trace.maxLife) * 0.72;
        context.strokeStyle = `hsla(${trace.hue} 88% 72% / ${alpha})`;
        context.lineWidth = trace.width;
        context.lineCap = "square";
        context.lineJoin = "miter";
        context.beginPath();
        context.moveTo(trace.points[0].x, trace.points[0].y);
        for (let i = 1; i < trace.points.length; i += 1) {
          context.lineTo(trace.points[i].x, trace.points[i].y);
        }
        context.stroke();
      }

      for (let branchIndex = 0; branchIndex < maxBranches; branchIndex += 1) {
        const branch = branches[branchIndex];
        if (!branch.active) {
          continue;
        }

        if (branch.progress < 1) {
          branch.progress = Math.min(1, branch.progress + dt * branch.speed);
        } else {
          branch.life -= dt;
          if (branch.life <= 0) {
            spawnTraceFromBranch(branch);
            branch.active = false;
            continue;
          }
        }

        const alpha = branch.progress < 1 ? 0.94 : (branch.life / branch.maxLife) * 0.9;
        context.strokeStyle = `hsla(${branch.hue} 96% 66% / ${alpha})`;
        context.lineWidth = branch.width;
        context.lineCap = "round";
        context.lineJoin = "round";
        drawPolyline(branch.points, branch.progress < 1 ? branch.progress : 1);
      }

      for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
        const node = nodes[nodeIndex];
        node.energy = Math.max(0, node.energy - dt * 0.58);
        const active = node.energy > 0.02;

        if (!active && nodeIndex % 5 !== Math.floor(now * 0.03) % 5) {
          continue;
        }

        const radius = active ? 0.7 + node.energy * 3.2 : 0.52;
        const alpha = active ? 0.22 + node.energy * 0.72 : 0.06;
        context.fillStyle = `hsla(${node.hue} 86% ${active ? 70 : 62}% / ${alpha})`;
        context.fillRect(node.x - radius * 0.5, node.y - radius * 0.5, radius, radius);
      }

      rafId = window.requestAnimationFrame(frame);
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", resize);
    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#03040a] text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_52%_52%,rgba(70,238,255,0.08),transparent_60%)]" />

      <div className="absolute left-4 top-4 z-10 flex max-w-md flex-col gap-3 border border-white/20 bg-black/60 px-4 py-4 backdrop-blur-sm">
        <p className="font-sans text-[11px] uppercase tracking-[0.11em] text-cyan-200">
          Exhibition Piece 2 / {PIECE_COUNT}
        </p>
        <h1 className="font-pixel-square text-3xl leading-none text-cyan-100 sm:text-4xl">
          Latent Bloom
        </h1>
        <p className="font-sans text-xs leading-relaxed text-white/84 sm:text-sm">
          Dormant micro-nodes awaken under your cursor, blossom into branching technicolour forms,
          and collapse into crisp geometric memory traces.
        </p>
        <PieceNavigationControls pieceId={2} />
      </div>
    </div>
  );
}

export default function PieceViewClient({ pieceId, title, tokenPool }: PieceViewClientProps) {
  if (pieceId === 1) {
    return <TokenCeilingPiece tokenPool={tokenPool} />;
  }
  if (pieceId === 2) {
    return <LatentBloomPiece />;
  }

  return <PlaceholderPiece id={pieceId} title={title} />;
}
