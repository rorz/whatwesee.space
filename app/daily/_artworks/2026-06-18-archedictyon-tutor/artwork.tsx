"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    archedictyon_tutor_render_to_text?: () => string;
    archedictyon_tutor_advance?: (steps: number) => void;
  }
}

type CardSpec = {
  label: string;
  anchor: number;
  bias: readonly [number, number, number];
  tolerance: number;
  notch?: boolean;
};

type Point = {
  x: number;
  y: number;
};

const TRACK_LABELS = ["rib", "cross", "tail"] as const;
const HANDLE_COLORS = ["#bf4b2c", "#d1a02b", "#5f8f8f"] as const;
const PERFECT = [0.78, 0.34, 0.67] as const;
const INITIAL = [0.22, 0.86, 0.18] as const;
const CARDS: readonly CardSpec[] = [
  { label: "archedictyon", anchor: 0.08, bias: [0, 0, 0], tolerance: 0.18 },
  { label: "mayfly", anchor: 0.24, bias: [0.14, -0.2, 0.24], tolerance: 0.26 },
  { label: "dragonfly", anchor: 0.39, bias: [0.22, 0.3, -0.12], tolerance: 0.22 },
  { label: "moth", anchor: 0.54, bias: [-0.18, 0.28, 0.22], tolerance: 0.24, notch: true },
  { label: "beetle", anchor: 0.71, bias: [-0.26, -0.08, 0.1], tolerance: 0.2 },
  { label: "fly", anchor: 0.86, bias: [-0.06, -0.28, -0.22], tolerance: 0.18 },
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getError(values: readonly number[]): number {
  return values.reduce((sum, value, index) => sum + Math.abs(value - PERFECT[index]), 0) / values.length;
}

function getVerdict(error: number, tolerance: number): string {
  if (error < tolerance * 0.42) return "ADMIT";
  if (error < tolerance * 0.78) return "NEAR";
  return "COPY";
}

function countAdmitted(values: readonly number[]): number {
  return CARDS.slice(1).reduce((count, card) => {
    const shifted = values.map((value, index) => clamp01(value + card.bias[index] * 0.18));
    return count + (getVerdict(getError(shifted), card.tolerance) === "ADMIT" ? 1 : 0);
  }, 0);
}

function getCanvasPoint(canvas: HTMLCanvasElement, event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function buildWingPath(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  side: 1 | -1,
  values: readonly number[],
): void {
  const spread = mix(0.18, 0.38, values[0]);
  const rib = mix(0.18, 0.34, values[1]);
  const tail = mix(0.56, 0.84, values[2]);
  const topX = centerX + side * width * (0.18 + spread * 0.55);
  const midX = centerX + side * width * (0.1 + spread * 0.34);
  const tailX = centerX + side * width * (0.05 + spread * 0.14);
  const topY = centerY - height * (0.5 + rib * 0.28);
  const midY = centerY - height * (0.08 + rib * 0.08);
  const tailY = centerY + height * tail * 0.46;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - height * 0.46);
  ctx.quadraticCurveTo(centerX + side * width * 0.08, centerY - height * 0.54, topX, topY);
  ctx.quadraticCurveTo(centerX + side * width * 0.2, centerY - height * 0.12, midX, midY);
  ctx.quadraticCurveTo(centerX + side * width * 0.15, centerY + height * 0.34, tailX, tailY);
  ctx.quadraticCurveTo(centerX + side * width * 0.02, centerY + height * 0.4, centerX, centerY + height * 0.46);
  ctx.closePath();
}

function drawWingCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  values: readonly number[],
  label: string,
  verdict: string | null,
  stampLift: number,
  notch: boolean,
): void {
  const notchDepth = notch ? width * 0.12 : 0;
  const right = x + width;
  const bottom = y + height;
  const radius = height * 0.16;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(right - radius, y);
  ctx.quadraticCurveTo(right, y, right, y + radius);
  if (notch) {
    ctx.lineTo(right, y + height * 0.38);
    ctx.lineTo(right - notchDepth, y + height * 0.5);
    ctx.lineTo(right, y + height * 0.62);
  }
  ctx.lineTo(right, bottom - radius);
  ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
  ctx.lineTo(x + radius, bottom);
  ctx.quadraticCurveTo(x, bottom, x, bottom - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = "#ece2cb";
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, height * 0.03);
  ctx.strokeStyle = "#201711";
  ctx.stroke();

  const centerX = x + width * 0.46;
  const centerY = y + height * 0.56;
  const wingWidth = width * 0.31;
  const wingHeight = height * 0.7;

  ctx.save();
  buildWingPath(ctx, centerX, centerY, wingWidth, wingHeight, -1, values);
  ctx.fillStyle = "#f5edd8";
  ctx.fill();
  ctx.strokeStyle = "#2d231d";
  ctx.lineWidth = Math.max(1, height * 0.024);
  ctx.stroke();
  buildWingPath(ctx, centerX, centerY, wingWidth, wingHeight, 1, values);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#473830";
  ctx.lineWidth = Math.max(1, height * 0.018);
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - wingHeight * 0.44);
  ctx.lineTo(centerX, centerY + wingHeight * 0.45);
  ctx.stroke();

  const crossVeins = 3 + Math.round(values[1] * 3);
  for (const side of [-1, 1] as const) {
    for (let vein = 0; vein < 4; vein += 1) {
      const stemY = centerY - wingHeight * 0.34 + vein * wingHeight * 0.23;
      const reach = mix(0.32, 0.86, (vein + 1) / 4);
      const spread = mix(0.18, 0.38, values[0]);
      const edgeX = centerX + side * wingWidth * (0.14 + spread * 0.82 * reach);
      const edgeY = stemY - wingHeight * 0.15 + vein * wingHeight * 0.02;
      ctx.beginPath();
      ctx.moveTo(centerX, stemY);
      ctx.lineTo(edgeX, edgeY);
      ctx.stroke();
    }
    for (let cross = 0; cross < crossVeins; cross += 1) {
      const t = (cross + 1) / (crossVeins + 1);
      const spread = mix(0.18, 0.38, values[0]);
      const leftX = centerX + side * wingWidth * (0.14 + spread * 0.24 + t * wingWidth * 0.004);
      const rightX = centerX + side * wingWidth * (0.22 + spread * 0.56 + t * wingWidth * 0.002);
      const y0 = centerY - wingHeight * 0.3 + t * wingHeight * 0.52;
      ctx.beginPath();
      ctx.moveTo(leftX, y0);
      ctx.lineTo(rightX, y0 - wingHeight * 0.04 * (1 - t));
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.fillStyle = "#231913";
  ctx.font = `${Math.max(10, height * 0.16)}px monospace`;
  ctx.textBaseline = "top";
  ctx.fillText(label, x + width * 0.06, y + height * 0.1);

  if (verdict) {
    ctx.save();
    ctx.translate(x + width * 0.78, y + height * 0.66 - stampLift);
    ctx.rotate(-0.16 + stampLift * 0.008);
    ctx.fillStyle = verdict === "ADMIT" ? "#4d8a52" : verdict === "NEAR" ? "#d1892a" : "#bf4b2c";
    ctx.strokeStyle = "#5c2011";
    ctx.lineWidth = Math.max(1.5, height * 0.028);
    ctx.fillRect(-width * 0.1, -height * 0.12, width * 0.22, height * 0.18);
    ctx.strokeRect(-width * 0.1, -height * 0.12, width * 0.22, height * 0.18);
    ctx.fillStyle = "#f8f0de";
    ctx.font = `bold ${Math.max(10, height * 0.14)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(verdict, 0, -height * 0.03);
    ctx.restore();
  }
}

export default function ArchedictyonTutor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const desiredRef = useRef<number[]>([...INITIAL]);
  const currentRef = useRef<number[]>([...INITIAL]);
  const velocityRef = useRef<number[]>([0, 0, 0]);
  const draggingRef = useRef<number | null>(null);
  const rafRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let size = 0;
    let resizeObserver: ResizeObserver | null = null;

    const fitCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      size = Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(size * dpr));
      canvas.height = Math.max(1, Math.floor(size * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const getTrackGeometry = () => {
      const x = size * 0.14;
      const top = size * 0.18;
      const bottom = size * 0.84;
      return { x, top, bottom };
    };

    const getHandleCenter = (index: number): Point => {
      const { x, top, bottom } = getTrackGeometry();
      const lane = size * 0.085;
      return {
        x: x + index * lane,
        y: mix(bottom, top, desiredRef.current[index]),
      };
    };

    const setHandleValue = (index: number, y: number) => {
      const { top, bottom } = getTrackGeometry();
      desiredRef.current[index] = clamp01((bottom - y) / (bottom - top));
    };

    const draw = () => {
      const current = currentRef.current;
      const frame = frameRef.current;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#0f0d0a";
      ctx.fillRect(0, 0, size, size);

      const track = getTrackGeometry();
      ctx.strokeStyle = "#54493c";
      ctx.lineWidth = Math.max(2, size * 0.006);
      ctx.beginPath();
      ctx.moveTo(size * 0.22, size * 0.06);
      ctx.lineTo(size * 0.76, size * 0.95);
      ctx.stroke();

      ctx.fillStyle = "#cabca0";
      ctx.font = `${Math.max(10, size * 0.026)}px monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("archedictyon tutor", size * 0.06, size * 0.05);

      for (let index = 0; index < TRACK_LABELS.length; index += 1) {
        const handle = getHandleCenter(index);
        ctx.strokeStyle = "#7a6f60";
        ctx.lineWidth = Math.max(3, size * 0.008);
        ctx.beginPath();
        ctx.moveTo(handle.x, track.top);
        ctx.lineTo(handle.x, track.bottom);
        ctx.stroke();

        ctx.fillStyle = "#cabca0";
        ctx.font = `${Math.max(9, size * 0.024)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(TRACK_LABELS[index], handle.x, track.bottom + size * 0.02);

        ctx.fillStyle = HANDLE_COLORS[index];
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, size * 0.028, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1e1712";
        ctx.lineWidth = Math.max(2, size * 0.006);
        ctx.stroke();

        ctx.fillStyle = "#f8f0de";
        ctx.font = `bold ${Math.max(9, size * 0.022)}px monospace`;
        ctx.fillText(String(Math.round(desiredRef.current[index] * 9) + 1), handle.x, handle.y - size * 0.011);
      }

      CARDS.forEach((card, index) => {
        const cardWidth = size * (index === 0 ? 0.4 : 0.46);
        const cardHeight = size * (index === 0 ? 0.11 : 0.12);
        const t = card.anchor;
        const cardX = mix(size * 0.24, size * 0.52, t) + Math.sin(frame * 0.03 + index * 0.9) * size * 0.008;
        const cardY = mix(size * 0.08, size * 0.84, t) - cardHeight * 0.5;
        const shifted = current.map((value, axis) => clamp01(value + card.bias[axis] * 0.18));
        const error = getError(shifted);
        const verdict = index === 0 ? null : getVerdict(error, card.tolerance);
        const stampLift = index === 0 ? 0 : Math.max(0, error - card.tolerance * 0.42) * size * 0.24;
        drawWingCard(ctx, cardX, cardY, cardWidth, cardHeight, shifted, card.label, verdict, stampLift, Boolean(card.notch));
      });

      ctx.fillStyle = "#cabca0";
      ctx.font = `${Math.max(9, size * 0.023)}px monospace`;
      ctx.textAlign = "left";
      ctx.fillText("tune the ancestor", size * 0.06, size * 0.91);
    };

    const step = () => {
      const current = currentRef.current;
      const velocity = velocityRef.current;
      const target = desiredRef.current;
      for (let index = 0; index < current.length; index += 1) {
        const diff = target[index] - current[index];
        velocity[index] = velocity[index] * 0.74 + diff * 0.18;
        current[index] = clamp01(current[index] + velocity[index]);
        if (Math.abs(diff) < 0.0005 && Math.abs(velocity[index]) < 0.0005) {
          current[index] = target[index];
          velocity[index] = 0;
        }
      }
      frameRef.current += 1;
    };

    const loop = () => {
      step();
      draw();
      rafRef.current = window.requestAnimationFrame(loop);
    };

    const handlePointerDown = (event: PointerEvent) => {
      event.preventDefault();
      const point = getCanvasPoint(canvas, event);
      let closestIndex = -1;
      let closestDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < TRACK_LABELS.length; index += 1) {
        const handle = getHandleCenter(index);
        const distance = Math.hypot(point.x - handle.x, point.y - handle.y);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
      if (closestIndex === -1 || closestDistance > size * 0.08) return;
      draggingRef.current = closestIndex;
      setHandleValue(closestIndex, point.y);
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const dragging = draggingRef.current;
      if (dragging === null) return;
      const point = getCanvasPoint(canvas, event);
      setHandleValue(dragging, point.y);
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (draggingRef.current === null) return;
      draggingRef.current = null;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    fitCanvas();
    resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(canvas);

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerEnd);
    canvas.addEventListener("pointercancel", handlePointerEnd);

    window.archedictyon_tutor_render_to_text = () => {
      const current = currentRef.current;
      return `rib ${current[0].toFixed(2)} | cross ${current[1].toFixed(2)} | tail ${current[2].toFixed(2)} | admitted ${countAdmitted(current)}/5`;
    };
    window.archedictyon_tutor_advance = (steps: number) => {
      for (let index = 0; index < steps; index += 1) {
        step();
      }
      draw();
    };

    draw();
    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafRef.current);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerEnd);
      canvas.removeEventListener("pointercancel", handlePointerEnd);
      delete window.archedictyon_tutor_render_to_text;
      delete window.archedictyon_tutor_advance;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full touch-none select-none"
      aria-label="A black timeline of insect wings. Drag the three lesson pegs to tune the ancestor at the top and watch the descendant wings below correct themselves."
    />
  );
}
