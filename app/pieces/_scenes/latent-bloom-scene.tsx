"use client";

import { useEffect, useRef } from "react";
import MobileControlsPane from "../_components/mobile-controls-pane";
import PieceNavigationControls from "../_components/piece-navigation-controls";

type Vec2 = {
  x: number;
  y: number;
};

type Branch = {
  active: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  angle: number;
  speed: number;
  thickness: number;
  travelled: number;
  maxLength: number;
  depth: number;
  hue: number;
  sat: number;
  light: number;
  life: number;
  maxLife: number;
  turn: number;
  wigglePhase: number;
  points: Vec2[];
  nextSplit: number;
  splitBudget: number;
};

type BranchTrace = {
  active: boolean;
  points: Vec2[];
  life: number;
  maxLife: number;
  hue: number;
  sat: number;
  light: number;
  lineWidth: number;
};

type Blossom = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  sat: number;
  light: number;
};

type PaperDot = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  phase: number;
};

type SpawnBranchOptions = {
  angle: number;
  speed: number;
  thickness: number;
  maxLength: number;
  depth: number;
  hue: number;
  sat: number;
  light: number;
  life: number;
  splitBudget: number;
};

type LatentBloomStateSummary = {
  piece: number;
  title: string;
  coordinateSystem: string;
  activeBranches: number;
  activeTraces: number;
  activeBlossoms: number;
  canopyPulse: number;
  pointer: {
    active: boolean;
    x: number | null;
    y: number | null;
  };
  sampleTips: Array<{ x: number; y: number }>;
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => Promise<void>;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function hslaColor(hue: number, sat: number, light: number, alpha: number): string {
  const h = ((hue % 360) + 360) % 360;
  return `hsla(${h.toFixed(1)}, ${sat.toFixed(1)}%, ${light.toFixed(1)}%, ${alpha.toFixed(3)})`;
}

function angleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function emptyBranch(): Branch {
  return {
    active: false,
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    angle: 0,
    speed: 0,
    thickness: 0,
    travelled: 0,
    maxLength: 0,
    depth: 0,
    hue: 0,
    sat: 0,
    light: 0,
    life: 0,
    maxLife: 0,
    turn: 0,
    wigglePhase: 0,
    points: [],
    nextSplit: 0,
    splitBudget: 0,
  };
}

function emptyTrace(): BranchTrace {
  return {
    active: false,
    points: [],
    life: 0,
    maxLife: 0,
    hue: 0,
    sat: 0,
    light: 0,
    lineWidth: 0,
  };
}

function emptyBlossom(): Blossom {
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
    sat: 0,
    light: 0,
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

    const maxBranches = 560;
    const maxTraces = 220;
    const maxBlossoms = 420;

    const branches = Array.from({ length: maxBranches }, emptyBranch);
    const traces = Array.from({ length: maxTraces }, emptyTrace);
    const blossoms = Array.from({ length: maxBlossoms }, emptyBlossom);
    const paperDots: PaperDot[] = [];

    let branchCursor = 0;
    let traceCursor = 0;
    let blossomCursor = 0;

    const pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false, energy: 0 };

    let ambientTimer = 0;
    let pointerSproutTimer = 0;
    let simulationTime = 0;
    let bgParallaxX = 0;
    let bgParallaxY = 0;
    let rafId = 0;
    let lastTime = performance.now();

    let latestState: LatentBloomStateSummary = {
      piece: 2,
      title: "Latent Bloom",
      coordinateSystem: "origin at top-left; x increases right; y increases downward; units in px",
      activeBranches: 0,
      activeTraces: 0,
      activeBlossoms: 0,
      canopyPulse: 0,
      pointer: { active: false, x: null, y: null },
      sampleTips: [],
    };

    const renderText = () => JSON.stringify(latestState);

    const spawnBranch = (x: number, y: number, options: SpawnBranchOptions) => {
      const branch = branches[branchCursor % maxBranches];
      branchCursor += 1;

      branch.active = true;
      branch.x = x;
      branch.y = y;
      branch.prevX = x;
      branch.prevY = y;
      branch.angle = options.angle;
      branch.speed = options.speed;
      branch.thickness = options.thickness;
      branch.travelled = 0;
      branch.maxLength = options.maxLength;
      branch.depth = options.depth;
      branch.hue = options.hue;
      branch.sat = options.sat;
      branch.light = options.light;
      branch.life = options.life;
      branch.maxLife = options.life;
      branch.turn = 0;
      branch.wigglePhase = Math.random() * Math.PI * 2;
      branch.points = [{ x, y }];
      branch.nextSplit = 16 + Math.random() * 34;
      branch.splitBudget = options.splitBudget;
    };

    const spawnTrace = (points: Vec2[], hue: number, sat: number, light: number, width: number) => {
      if (points.length < 2) {
        return;
      }

      const trace = traces[traceCursor % maxTraces];
      traceCursor += 1;

      trace.active = true;
      trace.points = points.map((point) => ({
        x: Math.round(point.x / 2) * 2,
        y: Math.round(point.y / 2) * 2,
      }));
      trace.life = 4.6 + Math.random() * 3.2;
      trace.maxLife = trace.life;
      trace.hue = hue + (Math.random() - 0.5) * 16;
      trace.sat = clamp(sat - 18, 30, 90);
      trace.light = clamp(light + 14, 20, 84);
      trace.lineWidth = Math.max(0.45, width * 0.46);
    };

    const spawnBlossoms = (x: number, y: number, hue: number, power: number) => {
      const count = Math.floor(4 + power * 10 + Math.random() * 8);
      for (let index = 0; index < count; index += 1) {
        const blossom = blossoms[blossomCursor % maxBlossoms];
        blossomCursor += 1;

        const angle = Math.random() * Math.PI * 2;
        const speed = 12 + Math.random() * (34 + power * 24);

        blossom.active = true;
        blossom.x = x;
        blossom.y = y;
        blossom.vx = Math.cos(angle) * speed;
        blossom.vy = Math.sin(angle) * speed - 8;
        blossom.size = 0.8 + Math.random() * (2 + power * 1.4);
        blossom.life = 0.4 + Math.random() * (0.8 + power * 0.45);
        blossom.maxLife = blossom.life;
        blossom.hue = hue + (Math.random() - 0.5) * 28;
        blossom.sat = 76 + Math.random() * 20;
        blossom.light = 48 + Math.random() * 28;
      }
    };

    const retireBranch = (branch: Branch, bloomPower: number) => {
      spawnTrace(branch.points, branch.hue, branch.sat, branch.light, branch.thickness);
      spawnBlossoms(branch.x, branch.y, branch.hue, bloomPower);
      branch.active = false;
      branch.points = [];
    };

    const sprout = (x: number, y: number, intensity: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      const yBias = clamp(y / Math.max(1, height), 0, 1);
      const baseAngle = -Math.PI / 2 + (yBias - 0.5) * 0.5;
      const fan = 0.2 + intensity * 0.72;
      const trunkCount = Math.floor(2 + intensity * 4 + Math.random() * 2);
      const baseHue = 58 + seededNoise(simulationTime * 0.9 + x * 0.014 + y * 0.011) * 156;

      for (let index = 0; index < trunkCount; index += 1) {
        const lane = trunkCount <= 1 ? 0 : index / (trunkCount - 1) - 0.5;
        const angle = baseAngle + lane * fan + (Math.random() - 0.5) * 0.24;
        const speed = 62 + Math.random() * 68 + intensity * 54;
        const thickness = 2 + Math.random() * (2.8 + intensity * 2.2);
        const maxLength = 56 + Math.random() * (84 + intensity * 120);
        const life = (0.86 + Math.random() * (0.72 + intensity * 0.58)) * 5;

        spawnBranch(x, y, {
          angle,
          speed,
          thickness,
          maxLength,
          depth: 0,
          hue: baseHue + lane * 18,
          sat: 56 + Math.random() * 30,
          light: 18 + Math.random() * 20,
          life,
          splitBudget: 2 + Math.floor(intensity * 3) + Math.floor(Math.random() * 2),
        });
      }

      if (intensity > 0.95) {
        spawnBlossoms(
          x + (Math.random() - 0.5) * width * 0.02,
          y + (Math.random() - 0.5) * height * 0.02,
          baseHue + 60,
          0.5,
        );
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = false;

      context.fillStyle = "rgb(246 240 222)";
      context.fillRect(0, 0, width, height);

      paperDots.length = 0;
      const dotCount = Math.floor(clamp((width * height) / 9000, 160, 620));
      for (let index = 0; index < dotCount; index += 1) {
        const seed = index * 17.1 + width * 0.013 + height * 0.019;
        paperDots.push({
          x: Math.floor(seededNoise(seed + 0.9) * width),
          y: Math.floor(seededNoise(seed + 2.1) * height),
          size: seededNoise(seed + 3.7) > 0.86 ? 2 : 1,
          alpha: 0.015 + seededNoise(seed + 5.3) * 0.04,
          speed: 0.25 + seededNoise(seed + 7.4) * 0.9,
          phase: seededNoise(seed + 9.8) * Math.PI * 2,
        });
      }
    };

    const simulateAndRender = (dtSeconds: number) => {
      const dt = clamp(dtSeconds, 0.001, 0.045);
      simulationTime += dt;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      pointer.energy = Math.max(0, pointer.energy - dt * 0.68);

      ambientTimer += dt;
      if (ambientTimer > 0.39) {
        ambientTimer = 0;
        sprout(width * (0.08 + Math.random() * 0.84), height * (0.66 + Math.random() * 0.28), 0.56);
      }

      if (pointer.active) {
        pointerSproutTimer += dt * (1 + pointer.energy * 2.4);
        if (pointerSproutTimer > 0.12) {
          pointerSproutTimer = 0;
          sprout(pointer.x, pointer.y, 0.38 + pointer.energy * 0.78);
        }
      } else {
        pointerSproutTimer = 0;
      }

      context.fillStyle = "rgba(246, 240, 222, 0.12)";
      context.fillRect(0, 0, width, height);

      const targetParallaxX = pointer.active ? (pointer.x / Math.max(1, width) - 0.5) * 54 : 0;
      const targetParallaxY = pointer.active ? (pointer.y / Math.max(1, height) - 0.5) * 34 : 0;
      const parallaxEase = clamp(dt * 2.3, 0, 1);
      bgParallaxX += (targetParallaxX - bgParallaxX) * parallaxEase;
      bgParallaxY += (targetParallaxY - bgParallaxY) * parallaxEase;

      const farBlue = context.createRadialGradient(
        width * 0.5 - bgParallaxX * 0.66,
        height * 0.38 - bgParallaxY * 0.66,
        18,
        width * 0.5 - bgParallaxX * 0.66,
        height * 0.38 - bgParallaxY * 0.66,
        Math.max(width, height) * 0.86,
      );
      farBlue.addColorStop(0, "rgba(58, 93, 168, 0.16)");
      farBlue.addColorStop(0.58, "rgba(74, 118, 192, 0.08)");
      farBlue.addColorStop(1, "rgba(31, 57, 108, 0)");
      context.fillStyle = farBlue;
      context.fillRect(0, 0, width, height);

      const horizonBlue = context.createLinearGradient(
        0,
        -bgParallaxY * 0.42,
        0,
        height - bgParallaxY * 0.28,
      );
      horizonBlue.addColorStop(0, "rgba(52, 90, 170, 0.08)");
      horizonBlue.addColorStop(0.42, "rgba(39, 73, 146, 0.03)");
      horizonBlue.addColorStop(1, "rgba(24, 44, 89, 0)");
      context.fillStyle = horizonBlue;
      context.fillRect(0, 0, width, height);

      context.fillStyle = "rgb(27 25 21)";
      for (let index = 0; index < paperDots.length; index += 1) {
        const dot = paperDots[index];
        const shimmer = 0.6 + 0.4 * Math.sin(simulationTime * dot.speed + dot.phase);
        context.globalAlpha = dot.alpha * shimmer;
        context.fillRect(dot.x, dot.y, dot.size, dot.size);
      }
      context.globalAlpha = 1;

      const canopyPulse = clamp(pointer.energy * 1.2, 0, 1.4);
      const glowX = pointer.active ? pointer.x : width * 0.5;
      const glowY = pointer.active ? pointer.y : height * 0.62;
      const glow = context.createRadialGradient(glowX, glowY, 24, glowX, glowY, Math.max(width, height) * 0.44);
      glow.addColorStop(0, `rgba(108, 164, 106, ${(0.04 + canopyPulse * 0.08).toFixed(3)})`);
      glow.addColorStop(1, "rgba(108, 164, 106, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      let activeTraceCount = 0;
      for (let index = 0; index < maxTraces; index += 1) {
        const trace = traces[index];
        if (!trace.active) {
          continue;
        }

        trace.life -= dt * 0.24;
        if (trace.life <= 0) {
          trace.active = false;
          continue;
        }

        const alpha = Math.pow(trace.life / trace.maxLife, 1.35) * 0.34;
        context.strokeStyle = hslaColor(trace.hue, trace.sat, trace.light, alpha);
        context.lineWidth = trace.lineWidth;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.beginPath();
        context.moveTo(trace.points[0]?.x ?? 0, trace.points[0]?.y ?? 0);
        for (let pointIndex = 1; pointIndex < trace.points.length; pointIndex += 1) {
          const point = trace.points[pointIndex];
          context.lineTo(point.x, point.y);
        }
        context.stroke();
        activeTraceCount += 1;
      }

      let activeBranchCount = 0;
      const sampleTips: Array<{ x: number; y: number }> = [];

      for (let index = 0; index < maxBranches; index += 1) {
        const branch = branches[index];
        if (!branch.active) {
          continue;
        }

        branch.life -= dt * (0.12 + branch.depth * 0.05);
        if (branch.life <= 0) {
          retireBranch(branch, 0.22);
          continue;
        }

        const wander =
          Math.sin(simulationTime * (1.4 + branch.depth * 0.18) + branch.wigglePhase) * 0.14 +
          Math.cos(simulationTime * (1.1 + branch.depth * 0.12) + branch.wigglePhase * 0.7) * 0.08;

        branch.turn +=
          (seededNoise(branch.wigglePhase + simulationTime * (0.92 + branch.depth * 0.17)) - 0.5) *
          dt *
          (1.2 + branch.depth * 0.4);
        branch.turn *= Math.exp(-dt * 1.5);

        if (pointer.active) {
          const dx = pointer.x - branch.x;
          const dy = pointer.y - branch.y;
          const distSq = dx * dx + dy * dy;
          const radius = 230 + pointer.energy * 240;
          const radiusSq = radius * radius;

          if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq) + 0.0001;
            const influence = 1 - dist / radius;
            const target = Math.atan2(dy, dx);
            branch.angle += angleDelta(branch.angle, target) * influence * dt * (0.95 + pointer.energy * 1.6);
            branch.life = Math.min(branch.maxLife, branch.life + dt * influence * (0.3 + pointer.energy));
            branch.speed += dt * influence * (8 + pointer.energy * 28);
          }
        }

        branch.speed = clamp(branch.speed, 32, 188);
        branch.angle += (branch.turn + wander) * dt * (2.2 + branch.depth * 0.45);

        const step = branch.speed * dt;
        branch.prevX = branch.x;
        branch.prevY = branch.y;
        branch.x += Math.cos(branch.angle) * step;
        branch.y += Math.sin(branch.angle) * step;
        branch.travelled += step;

        const lastPoint = branch.points[branch.points.length - 1];
        if (!lastPoint || Math.hypot(branch.x - lastPoint.x, branch.y - lastPoint.y) > 6) {
          branch.points.push({ x: branch.x, y: branch.y });
        }

        const vitality = clamp(branch.life / branch.maxLife, 0, 1);
        const alpha = clamp(0.18 + vitality * 0.68, 0.1, 1);
        const hueWave = branch.hue + Math.sin(simulationTime * 0.8 + branch.wigglePhase) * 10;

        context.strokeStyle = hslaColor(hueWave, branch.sat, branch.light, alpha);
        context.lineWidth = Math.max(0.34, branch.thickness);
        context.lineCap = "round";
        context.lineJoin = "round";
        context.beginPath();
        context.moveTo(branch.prevX, branch.prevY);
        context.lineTo(branch.x, branch.y);
        context.stroke();

        branch.thickness = Math.max(0.16, branch.thickness - dt * (0.26 + branch.depth * 0.12));

        if (branch.splitBudget > 0 && branch.depth < 6 && branch.travelled >= branch.nextSplit) {
          const childCount = Math.random() > 0.38 ? 2 : 1;
          for (let child = 0; child < childCount; child += 1) {
            const polarity = childCount === 1 ? (Math.random() > 0.5 ? 1 : -1) : child === 0 ? -1 : 1;
            const divergence = polarity * (0.28 + Math.random() * 0.4);

            spawnBranch(branch.x, branch.y, {
              angle: branch.angle + divergence + (Math.random() - 0.5) * 0.2,
              speed: branch.speed * (0.76 + Math.random() * 0.2),
              thickness: branch.thickness * (0.62 + Math.random() * 0.2),
              maxLength: branch.maxLength * (0.52 + Math.random() * 0.3),
              depth: branch.depth + 1,
              hue: branch.hue + polarity * (10 + Math.random() * 18),
              sat: clamp(branch.sat + (Math.random() - 0.5) * 10, 35, 92),
              light: clamp(branch.light + Math.random() * 8, 12, 72),
              life: branch.life * (0.88 + Math.random() * 0.26),
              splitBudget: Math.max(0, branch.splitBudget - 1 - Math.floor(Math.random() * 2)),
            });
          }

          spawnBlossoms(branch.x, branch.y, branch.hue + (Math.random() - 0.5) * 24, 0.22);
          branch.splitBudget = Math.max(0, branch.splitBudget - childCount);
          branch.nextSplit += 18 + Math.random() * 38;
        }

        const outOfBounds =
          branch.x < -84 || branch.x > width + 84 || branch.y < -84 || branch.y > height + 84;

        if (
          branch.travelled >= branch.maxLength ||
          branch.thickness <= 0.25 ||
          outOfBounds ||
          branch.life <= 0
        ) {
          retireBranch(branch, 0.34 + branch.depth * 0.05);
          continue;
        }

        activeBranchCount += 1;
        if (sampleTips.length < 6) {
          sampleTips.push({ x: Number(branch.x.toFixed(1)), y: Number(branch.y.toFixed(1)) });
        }
      }

      let activeBlossomCount = 0;
      for (let index = 0; index < maxBlossoms; index += 1) {
        const blossom = blossoms[index];
        if (!blossom.active) {
          continue;
        }

        blossom.life -= dt;
        if (blossom.life <= 0) {
          blossom.active = false;
          continue;
        }

        blossom.x += blossom.vx * dt;
        blossom.y += blossom.vy * dt;
        blossom.vy += 24 * dt;
        blossom.vx *= Math.exp(-dt * 2.4);
        blossom.size = Math.max(0.22, blossom.size - dt * 1.2);

        const alpha = clamp(blossom.life / blossom.maxLife, 0, 1);
        const coreAlpha = alpha * 0.88;
        context.fillStyle = hslaColor(blossom.hue, blossom.sat, blossom.light, coreAlpha);

        const size = blossom.size;
        context.fillRect(blossom.x - size * 0.5, blossom.y - 0.5, size, 1);
        context.fillRect(blossom.x - 0.5, blossom.y - size * 0.5, 1, size);

        if (size > 1.2) {
          context.fillRect(blossom.x - size * 0.25, blossom.y - size * 0.25, size * 0.5, size * 0.5);
        }

        activeBlossomCount += 1;
      }

      latestState = {
        piece: 2,
        title: "Latent Bloom",
        coordinateSystem: "origin at top-left; x increases right; y increases downward; units in px",
        activeBranches: activeBranchCount,
        activeTraces: activeTraceCount,
        activeBlossoms: activeBlossomCount,
        canopyPulse: Number(canopyPulse.toFixed(3)),
        pointer: {
          active: pointer.active,
          x: pointer.active ? Number(pointer.x.toFixed(1)) : null,
          y: pointer.active ? Number(pointer.y.toFixed(1)) : null,
        },
        sampleTips,
      };

      context.globalAlpha = 1;
    };

    const advanceHook = async (ms: number) => {
      const bounded = clamp(ms, 1, 2000);
      const steps = Math.max(1, Math.round(bounded / (1000 / 60)));
      const dt = bounded / steps / 1000;

      for (let stepIndex = 0; stepIndex < steps; stepIndex += 1) {
        simulateAndRender(dt);
      }
    };

    window.render_game_to_text = renderText;
    window.advanceTime = advanceHook;

    resize();
    simulateAndRender(1 / 60);

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;

      pointer.vx = x - pointer.x;
      pointer.vy = y - pointer.y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.energy = clamp(pointer.energy + Math.hypot(pointer.vx, pointer.vy) * 0.003, 0, 1.2);
    };

    const onPointerDown = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
      pointer.energy = clamp(pointer.energy + 0.5, 0, 1.2);
      sprout(pointer.x, pointer.y, 1.18);
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        pointer.active = false;
      }
    };

    const onPointerCancel = () => {
      pointer.active = false;
    };

    const onResize = () => {
      resize();
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", onResize);

    const frame = (now: number) => {
      const dt = Math.min(0.045, (now - lastTime) / 1000);
      lastTime = now;
      simulateAndRender(dt);
      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);

      if (window.render_game_to_text === renderText) {
        delete window.render_game_to_text;
      }
      if (window.advanceTime === advanceHook) {
        delete window.advanceTime;
      }
    };
  }, []);

  return (
    <div className="relative min-h-[100svh] h-[100dvh] w-full overflow-hidden bg-[#f6f0de] text-[#11110f]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_40%,rgba(125,171,102,0.12),transparent_58%)]" />

      <MobileControlsPane
        rootClassName="absolute left-4 top-4 z-10 w-[min(92vw,28rem)]"
        panelClassName="relative flex flex-col gap-3 border border-black/20 bg-white/70 px-4 py-4 backdrop-blur-sm"
      >
        <PieceNavigationControls pieceId={6} className="mt-0" hideArtistCard hidePieceGrid />
        <h1 className="font-pixel-square text-3xl leading-none text-emerald-900 sm:text-4xl">
          Latent Bloom
        </h1>
        <p className="font-sans text-xs leading-relaxed text-black/78 sm:text-sm">
          Pointer input plants growth seeds, and movement bends branch trajectories as canopies and
          blooms expand over time. The growth feels responsive and unexpectedly tender.
        </p>
        <PieceNavigationControls pieceId={6} hideQuickLinks />
      </MobileControlsPane>
    </div>
  );
}
