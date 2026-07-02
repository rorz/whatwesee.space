"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    on_the_fence_render_to_text?: () => string;
    on_the_fence_advance?: (steps: number) => void;
  }
}

const MAX_BALANCE = 8;
const TILT_PER = 4.5;
const EASE = 0.07;
const FALL_EASE = 0.12;
const FALL_TARGET = 80;
const HOLD_FRAMES = 90;

type FallPhase = "balanced" | "falling-left" | "falling-right" | "fell-left" | "fell-right";

export default function OnTheFence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let displaySize = 0;
    let resizeObserver: ResizeObserver | null = null;

    let leftPresses = 0;
    let rightPresses = 0;
    let balance = 0;
    let tiltAngle = 0;
    let phase: FallPhase = "balanced";
    let holdFrames = 0;
    let pressedOnce = false;

    const fitCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const size = Math.min(rect.width, rect.height);
      displaySize = size;
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    fitCanvas();
    resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(container);

    const applyPress = (side: "left" | "right") => {
      if (phase !== "balanced") return;
      pressedOnce = true;
      if (side === "left") leftPresses++;
      else rightPresses++;
      balance = Math.max(-MAX_BALANCE, Math.min(MAX_BALANCE, leftPresses - rightPresses));
    };

    const step = () => {
      const targetTilt = balance * TILT_PER;
      if (phase === "balanced") {
        tiltAngle += (targetTilt - tiltAngle) * EASE;
        if (Math.abs(balance) >= MAX_BALANCE) {
          phase = balance < 0 ? "falling-left" : "falling-right";
          holdFrames = 0;
        }
      } else if (phase === "falling-left") {
        tiltAngle += (-FALL_TARGET - tiltAngle) * FALL_EASE;
        holdFrames++;
        if (holdFrames > 50) {
          phase = "fell-left";
          holdFrames = 0;
        }
      } else if (phase === "falling-right") {
        tiltAngle += (FALL_TARGET - tiltAngle) * FALL_EASE;
        holdFrames++;
        if (holdFrames > 50) {
          phase = "fell-right";
          holdFrames = 0;
        }
      } else {
        holdFrames++;
        if (holdFrames > HOLD_FRAMES) {
          leftPresses = 0;
          rightPresses = 0;
          balance = 0;
          tiltAngle = 0;
          phase = "balanced";
          holdFrames = 0;
          pressedOnce = false;
        }
      }
    };

    const draw = () => {
      const S = displaySize;
      const cx = S / 2;
      const cy = S / 2;

      ctx.fillStyle = "#1355d1";
      ctx.fillRect(0, 0, cx, S);
      ctx.fillStyle = "#d41c28";
      ctx.fillRect(cx, 0, cx, S);

      ctx.save();
      ctx.globalAlpha = 0.11;
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${S * 0.52}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("A", cx * 0.5, cy);
      ctx.fillText("B", cx + cx * 0.5, cy);
      ctx.globalAlpha = 1;
      ctx.restore();

      ctx.font = `bold ${S * 0.11}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(String(leftPresses), cx * 0.5, S * 0.1);
      ctx.fillText(String(rightPresses), cx + cx * 0.5, S * 0.1);

      if (!pressedOnce) {
        ctx.font = `${S * 0.048}px monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillText("PRESS", cx * 0.5, S * 0.78);
        ctx.fillText("PRESS", cx + cx * 0.5, S * 0.78);
      }

      ctx.save();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, S);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      const postW = Math.max(6, S * 0.022);
      const postH = S * 0.32;
      ctx.fillStyle = "#c8aa72";
      ctx.fillRect(cx - postW / 2, cy, postW, postH);
      ctx.strokeStyle = "#a08040";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - postW / 2, cy, postW, postH);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((tiltAngle * Math.PI) / 180);

      const railW = S * 0.76;
      const railH = Math.max(6, S * 0.034);

      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = "#000";
      ctx.fillRect(-railW / 2 + 3, -railH / 2 + 4, railW, railH);
      ctx.globalAlpha = 1;
      ctx.restore();

      ctx.fillStyle = "#f5eed6";
      ctx.fillRect(-railW / 2, -railH / 2, railW, railH);
      ctx.strokeStyle = "#c8aa72";
      ctx.lineWidth = Math.max(1, S * 0.004);
      ctx.strokeRect(-railW / 2, -railH / 2, railW, railH);

      ctx.strokeStyle = "rgba(180,150,90,0.28)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 5; i++) {
        const lx = -railW / 2 + (railW / 6) * i;
        ctx.beginPath();
        ctx.moveTo(lx, -railH / 2);
        ctx.lineTo(lx, railH / 2);
        ctx.stroke();
      }

      const u = S * 0.017;
      const terryY = -railH / 2;
      const lean = (-tiltAngle * 0.28 * Math.PI) / 180;

      ctx.save();
      ctx.translate(0, terryY);
      ctx.rotate(lean);

      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(-2.8 * u, 0, 1.8 * u, 3.6 * u);
      ctx.fillRect(1 * u, 0, 1.8 * u, 3.6 * u);

      ctx.fillStyle = "#f5d800";
      ctx.fillRect(-2.5 * u, -5.5 * u, 5 * u, 5.5 * u);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = Math.max(1, S * 0.003);
      ctx.strokeRect(-2.5 * u, -5.5 * u, 5 * u, 5.5 * u);

      ctx.fillStyle = "#f5c84a";
      ctx.beginPath();
      ctx.arc(0, -8.2 * u, 2.8 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(-0.9 * u, -8.7 * u, 0.42 * u, 0, Math.PI * 2);
      ctx.arc(0.9 * u, -8.7 * u, 0.42 * u, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f5c84a";
      ctx.fillRect(-7 * u, -5 * u, 4.5 * u, 1.6 * u);
      ctx.fillRect(2.5 * u, -5 * u, 4.5 * u, 1.6 * u);
      ctx.strokeStyle = "#333";
      ctx.strokeRect(-7 * u, -5 * u, 4.5 * u, 1.6 * u);
      ctx.strokeRect(2.5 * u, -5 * u, 4.5 * u, 1.6 * u);

      ctx.restore();
      ctx.restore();

      if (phase === "fell-left" || phase === "fell-right") {
        const winner = phase === "fell-left" ? "A" : "B";
        ctx.fillStyle = "rgba(0,0,0,0.52)";
        ctx.fillRect(0, cy - S * 0.14, S, S * 0.28);
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${S * 0.1}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`SIDE ${winner} WINS`, cx, cy);
      }
    };

    const loop = () => {
      step();
      draw();
      rafId = window.requestAnimationFrame(loop);
    };

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      applyPress(x < rect.width / 2 ? "left" : "right");
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    window.on_the_fence_render_to_text = () =>
      `On the Fence | L:${leftPresses} R:${rightPresses} balance:${balance} tilt:${tiltAngle.toFixed(1)}deg phase:${phase}`;

    window.on_the_fence_advance = (steps: number) => {
      for (let i = 0; i < steps; i++) step();
      draw();
    };

    loop();

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      delete window.on_the_fence_render_to_text;
      delete window.on_the_fence_advance;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full touch-none select-none"
      aria-label="A fence balanced across two gang territories: blue Side A on the left and red Side B on the right. Click either half to add weight from that territory. The fence tilts toward the heavier side. Press until Terry falls."
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-pointer"
      />
    </div>
  );
}
