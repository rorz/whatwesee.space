"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    specimen_teether_render_to_text?: () => string;
    specimen_teether_advance?: (steps: number) => void;
  }
}

type Model = {
  tick: number;
  charge: number;
  openness: number;
  totalShake: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createModel(): Model {
  return {
    tick: 0,
    charge: 0,
    openness: 0,
    totalShake: 0,
  };
}

export default function SpecimenTeether() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef(0);
  const modelRef = useRef<Model>(createModel());
  const draggingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const stepModel = (steps: number) => {
      const model = modelRef.current;
      for (let i = 0; i < steps; i += 1) {
        model.tick += 1;
        model.charge *= 0.965;
        if (model.charge > 24) {
          model.openness = clamp(model.openness + 0.012 + model.charge / 8000, 0, 1);
        } else {
          model.openness = clamp(model.openness - 0.018, 0, 1);
        }
      }
    };

    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const size = sizeRef.current;
      if (!ctx || size === 0) return;

      const model = modelRef.current;
      const t = model.tick / 60;
      const chargeRatio = clamp(model.charge / 90, 0, 1);
      const openRatio = model.openness;
      const awake = clamp(Math.floor((model.totalShake + openRatio * 180) / 120), 0, 6);
      const crawlX = Math.sin(t * 0.58) * size * 0.04;
      const crawlY = Math.sin(t * 0.31) * size * 0.012;
      const jitter = chargeRatio * size * 0.01;
      const bodyX = size * 0.5 + crawlX + Math.sin(t * 18) * jitter;
      const bodyY = size * 0.54 + crawlY + Math.cos(t * 15) * jitter * 0.7;
      const bodyW = size * 0.43;
      const bodyH = size * 0.5;
      const lensRadius = size * (0.086 + chargeRatio * 0.01);
      const footLift = Math.sin(t * 2.4) * size * 0.01;

      ctx.clearRect(0, 0, size, size);

      const wall = ctx.createLinearGradient(0, 0, 0, size);
      wall.addColorStop(0, "#f1e2c8");
      wall.addColorStop(0.55, "#d7b07f");
      wall.addColorStop(1, "#9a6b3f");
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = "rgba(99, 60, 31, 0.16)";
      ctx.fillRect(0, size * 0.76, size, size * 0.24);

      ctx.fillStyle = "rgba(73, 44, 22, 0.22)";
      ctx.beginPath();
      ctx.ellipse(bodyX, size * 0.84, size * 0.28, size * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = Math.max(2, size * 0.01);
      ctx.strokeStyle = "#6f4b28";
      ctx.beginPath();
      ctx.moveTo(bodyX - bodyW * 0.1, bodyY - bodyH * 0.52);
      ctx.quadraticCurveTo(bodyX, bodyY - bodyH * 0.72, bodyX + bodyW * 0.16, bodyY - bodyH * 0.48);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bodyX + bodyW * 0.18, bodyY - bodyH * 0.49, size * 0.035, -Math.PI * 0.2, Math.PI * 1.3);
      ctx.stroke();

      ctx.fillStyle = "#8f6a3d";
      ctx.fillRect(bodyX - bodyW * 0.22, bodyY + bodyH * 0.4 - footLift, bodyW * 0.12, bodyH * 0.08);
      ctx.fillRect(bodyX + bodyW * 0.08, bodyY + bodyH * 0.4 + footLift, bodyW * 0.12, bodyH * 0.08);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(bodyX - bodyW * 0.33, bodyY - bodyH * 0.3);
      ctx.lineTo(bodyX - bodyW * 0.14, bodyY - bodyH * 0.48);
      ctx.lineTo(bodyX + bodyW * 0.16, bodyY - bodyH * 0.46);
      ctx.lineTo(bodyX + bodyW * 0.33, bodyY - bodyH * 0.15);
      ctx.lineTo(bodyX + bodyW * 0.29, bodyY + bodyH * 0.26);
      ctx.lineTo(bodyX + bodyW * 0.02, bodyY + bodyH * 0.47);
      ctx.lineTo(bodyX - bodyW * 0.3, bodyY + bodyH * 0.2);
      ctx.closePath();
      ctx.clip();

      const shell = ctx.createLinearGradient(bodyX - bodyW * 0.35, bodyY - bodyH * 0.5, bodyX + bodyW * 0.35, bodyY + bodyH * 0.45);
      shell.addColorStop(0, "#e8ca97");
      shell.addColorStop(0.28, "#b4874e");
      shell.addColorStop(0.7, "#80512e");
      shell.addColorStop(1, "#5a341d");
      ctx.fillStyle = shell;
      ctx.fillRect(bodyX - bodyW * 0.4, bodyY - bodyH * 0.56, bodyW * 0.8, bodyH * 1.1);

      for (let index = 0; index < 22; index += 1) {
        const px = bodyX - bodyW * 0.3 + ((index * 29) % 100) / 100 * bodyW * 0.58;
        const py = bodyY - bodyH * 0.34 + ((index * 43) % 100) / 100 * bodyH * 0.7;
        const radius = size * (0.007 + (index % 4) * 0.002);
        ctx.fillStyle = index % 3 === 0 ? "rgba(255, 233, 195, 0.26)" : "rgba(92, 55, 29, 0.17)";
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.strokeStyle = "rgba(71, 40, 20, 0.58)";
      ctx.lineWidth = Math.max(1.2, size * 0.004);
      ctx.beginPath();
      ctx.moveTo(bodyX - bodyW * 0.12, bodyY - bodyH * 0.3);
      ctx.lineTo(bodyX - bodyW * 0.24, bodyY - bodyH * 0.04);
      ctx.lineTo(bodyX - bodyW * 0.1, bodyY + bodyH * 0.24);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bodyX + bodyW * 0.15, bodyY - bodyH * 0.2);
      ctx.lineTo(bodyX + bodyW * 0.03, bodyY + bodyH * 0.07);
      ctx.lineTo(bodyX + bodyW * 0.14, bodyY + bodyH * 0.24);
      ctx.stroke();

      ctx.fillStyle = chargeRatio > 0.7 ? "#a82410" : "#6d2b18";
      ctx.beginPath();
      ctx.arc(bodyX - bodyW * 0.23, bodyY - bodyH * 0.17, lensRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = chargeRatio > 0.45 ? "#ffbd4a" : "#d98831";
      ctx.beginPath();
      ctx.arc(bodyX - bodyW * 0.23, bodyY - bodyH * 0.17, lensRadius * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 245, 224, 0.52)";
      ctx.beginPath();
      ctx.arc(bodyX - bodyW * 0.26, bodyY - bodyH * 0.22, lensRadius * 0.24, 0, Math.PI * 2);
      ctx.fill();

      const seamY = bodyY + bodyH * 0.07;
      const mouthHeight = size * (0.008 + openRatio * 0.12);
      ctx.fillStyle = "#2b180d";
      ctx.beginPath();
      ctx.ellipse(bodyX + bodyW * 0.02, seamY, bodyW * 0.22, mouthHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      if (openRatio > 0.02) {
        for (let index = 0; index < 6; index += 1) {
          const crystalX = bodyX - bodyW * 0.16 + index * bodyW * 0.064;
          const crystalH = size * (0.025 + (index % 2) * 0.014 + openRatio * 0.02);
          ctx.fillStyle = ["#e7dfcb", "#d2c0a0", "#9fb6a3", "#c9944a", "#e3d2af", "#7c9b8d"][index];
          ctx.beginPath();
          ctx.moveTo(crystalX, seamY - mouthHeight * 0.55);
          ctx.lineTo(crystalX + bodyW * 0.02, seamY - crystalH);
          ctx.lineTo(crystalX + bodyW * 0.04, seamY - mouthHeight * 0.55);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.strokeStyle = "#8d662f";
      ctx.lineWidth = Math.max(2.2, size * 0.01);
      ctx.beginPath();
      ctx.moveTo(bodyX - bodyW * 0.24, seamY - bodyH * 0.03);
      ctx.quadraticCurveTo(bodyX + bodyW * 0.03, seamY - bodyH * 0.07 - mouthHeight * 0.4, bodyX + bodyW * 0.27, seamY + bodyH * 0.01);
      ctx.stroke();

      for (let index = 0; index < 4; index += 1) {
        const dripX = bodyX - bodyW * 0.08 + index * bodyW * 0.09;
        const drip = size * (0.02 + ((model.tick + index * 11) % 27) / 27 * 0.02 + openRatio * 0.01);
        ctx.strokeStyle = "rgba(210, 168, 87, 0.9)";
        ctx.lineWidth = Math.max(2, size * 0.006);
        ctx.beginPath();
        ctx.moveTo(dripX, seamY - size * 0.01);
        ctx.lineTo(dripX, seamY + drip);
        ctx.stroke();
        ctx.fillStyle = "rgba(244, 206, 116, 0.92)";
        ctx.beginPath();
        ctx.arc(dripX, seamY + drip, size * 0.008, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#2d381f";
      ctx.fillRect(bodyX - bodyW * 0.03, bodyY - bodyH * 0.01, bodyW * 0.28, bodyH * 0.12);
      ctx.fillStyle = "#7bc071";
      ctx.fillRect(bodyX - bodyW * 0.005, bodyY + bodyH * 0.01, bodyW * 0.23 * Math.max(0.18, awake / 6), bodyH * 0.04);
      ctx.strokeStyle = "rgba(233, 219, 183, 0.7)";
      ctx.lineWidth = Math.max(1.3, size * 0.004);
      ctx.strokeRect(bodyX - bodyW * 0.03, bodyY - bodyH * 0.01, bodyW * 0.28, bodyH * 0.12);
      ctx.fillStyle = "#efe6ce";
      ctx.font = `${Math.max(9, size * 0.026)}px var(--font-geist-mono), monospace`;
      ctx.textAlign = "left";
      ctx.fillText(`awake ${awake}`, bodyX - bodyW * 0.015, bodyY + bodyH * 0.075);

      ctx.fillStyle = "rgba(71, 39, 19, 0.8)";
      ctx.font = `${Math.max(9, size * 0.024)}px var(--font-geist-mono), monospace`;
      ctx.fillText("shake the specimen until it confesses", size * 0.09, size * 0.91);
      ctx.fillText(`charge ${Math.round(model.charge).toString().padStart(2, "0")}`, size * 0.09, size * 0.13);
      ctx.fillText(`jaw ${Math.round(openRatio * 100)}%`, size * 0.72, size * 0.13);
    };

    drawRef.current = draw;

    const loop = () => {
      stepModel(1);
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    draw();
    rafRef.current = requestAnimationFrame(loop);

    window.specimen_teether_render_to_text = () => {
      const model = modelRef.current;
      const awake = clamp(Math.floor((model.totalShake + model.openness * 180) / 120), 0, 6);
      return `specimen-teether|charge:${Math.round(model.charge)}|open:${model.openness.toFixed(2)}|awake:${awake}|shake:${Math.round(model.totalShake)}`;
    };

    window.specimen_teether_advance = (steps: number) => {
      const safeSteps = Math.max(0, Math.floor(steps));
      stepModel(safeSteps);
      draw();
    };

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      delete window.specimen_teether_render_to_text;
      delete window.specimen_teether_advance;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const width = container.clientWidth;
      sizeRef.current = width;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(width * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${width}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      drawRef.current?.();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onPointerUp = () => {
      draggingRef.current = false;
      lastPointRef.current = null;
    };

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#c89d67",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "grab" }}
        onPointerDown={(event) => {
          draggingRef.current = true;
          lastPointRef.current = { x: event.clientX, y: event.clientY };
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            draggingRef.current = true;
          }
        }}
        onPointerMove={(event) => {
          if (!draggingRef.current || !lastPointRef.current) return;
          const dx = event.clientX - lastPointRef.current.x;
          const dy = event.clientY - lastPointRef.current.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0) {
            const model = modelRef.current;
            model.charge = clamp(model.charge + Math.min(18, distance * 0.28), 0, 100);
            model.totalShake = clamp(model.totalShake + distance, 0, 9999);
            drawRef.current?.();
          }
          lastPointRef.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          draggingRef.current = false;
          lastPointRef.current = null;
          try {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          } catch {
            draggingRef.current = false;
          }
        }}
      />
    </div>
  );
}
