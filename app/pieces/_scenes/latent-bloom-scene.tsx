"use client";

import { useEffect, useRef } from "react";
import PieceNavigationControls from "../_components/piece-navigation-controls";
import { PIECE_COUNT } from "../_lib/piece-constants";

type Vec = {
  x: number;
  y: number;
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
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

export default function LatentBloomScene() {
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
