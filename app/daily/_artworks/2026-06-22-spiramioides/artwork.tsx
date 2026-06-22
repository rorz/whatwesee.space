"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    spiramioides_render_to_text?: () => string;
    spiramioides_advance?: (steps: number) => void;
  }
}

const TRAIL_LEN = 300;
const SPIRAL_DECAY = 0.997;
const SPIRAL_DTHETA = 0.04;
const RESET_R = 3.5;
const START_R = 43;

interface Vec2 {
  x: number;
  y: number;
}

export default function Spiramioides() {
  const svgRef = useRef<SVGSVGElement>(null);
  const trailRef = useRef<SVGPolylineElement>(null);
  const mothGroupRef = useRef<SVGGElement>(null);
  const lightGroupRef = useRef<SVGGElement>(null);
  const rafRef = useRef<number>(0);

  const stateRef = useRef({
    lightX: 50,
    lightY: 50,
    mothTheta: Math.PI * 0.7,
    mothR: START_R,
    trail: [] as Vec2[],
    dragging: false,
    capturedId: null as number | null,
    lapCount: 0,
  });

  useEffect(() => {
    if (!svgRef.current || !trailRef.current || !mothGroupRef.current || !lightGroupRef.current) return;

    const s = stateRef.current;

    function getMothXY(): Vec2 {
      return {
        x: s.lightX + s.mothR * Math.cos(s.mothTheta),
        y: s.lightY + s.mothR * Math.sin(s.mothTheta),
      };
    }

    function step() {
      s.mothTheta += SPIRAL_DTHETA;
      s.mothR *= SPIRAL_DECAY;

      const pos = getMothXY();
      s.trail.push({ x: pos.x, y: pos.y });
      if (s.trail.length > TRAIL_LEN) s.trail.shift();

      if (s.mothR < RESET_R) {
        s.lapCount++;
        s.mothTheta = (s.mothTheta + Math.PI * 0.83) % (2 * Math.PI);
        s.mothR = START_R;
        s.trail = [];
      }
    }

    function render() {
      const trailEl = trailRef.current;
      const mothEl = mothGroupRef.current;
      const lightEl = lightGroupRef.current;
      if (!trailEl || !mothEl || !lightEl) return;

      const pos = getMothXY();

      if (s.trail.length > 1) {
        const pts = s.trail.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
        trailEl.setAttribute("points", pts);
      } else {
        trailEl.setAttribute("points", "");
      }

      const dx = s.lightX - pos.x;
      const dy = s.lightY - pos.y;
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      mothEl.setAttribute(
        "transform",
        `translate(${pos.x.toFixed(2)},${pos.y.toFixed(2)}) rotate(${angleDeg.toFixed(1)})`,
      );

      lightEl.setAttribute(
        "transform",
        `translate(${s.lightX.toFixed(2)},${s.lightY.toFixed(2)})`,
      );
    }

    function toSVGPoint(clientX: number, clientY: number): Vec2 {
      const svgEl = svgRef.current;
      if (!svgEl) return { x: 50, y: 50 };
      const ctm = svgEl.getScreenCTM();
      if (!ctm) return { x: 50, y: 50 };
      const pt = svgEl.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const svgPt = pt.matrixTransform(ctm.inverse());
      return { x: svgPt.x, y: svgPt.y };
    }

    const onPointerDown = (e: PointerEvent) => {
      const pt = toSVGPoint(e.clientX, e.clientY);
      const dx = pt.x - s.lightX;
      const dy = pt.y - s.lightY;
      if (Math.sqrt(dx * dx + dy * dy) < 10) {
        s.dragging = true;
        s.capturedId = e.pointerId;
        svgRef.current?.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!s.dragging || s.capturedId !== e.pointerId) return;
      const pt = toSVGPoint(e.clientX, e.clientY);
      const newLX = Math.max(3, Math.min(97, pt.x));
      const newLY = Math.max(3, Math.min(97, pt.y));

      const moth = getMothXY();

      s.lightX = newLX;
      s.lightY = newLY;

      const ndx = moth.x - newLX;
      const ndy = moth.y - newLY;
      const nr = Math.sqrt(ndx * ndx + ndy * ndy);
      if (nr > 0) {
        s.mothTheta = Math.atan2(ndy, ndx);
        s.mothR = Math.min(nr, START_R);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (s.capturedId === e.pointerId) {
        s.dragging = false;
        s.capturedId = null;
      }
    };

    const svgNode = svgRef.current;
    svgNode.addEventListener("pointerdown", onPointerDown);
    svgNode.addEventListener("pointermove", onPointerMove);
    svgNode.addEventListener("pointerup", onPointerUp);
    svgNode.addEventListener("pointercancel", onPointerUp);

    const loop = () => {
      step();
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    window.spiramioides_render_to_text = () =>
      `r=${s.mothR.toFixed(1)} theta=${s.mothTheta.toFixed(2)} laps=${s.lapCount}`;

    window.spiramioides_advance = (steps: number) => {
      const n = Math.max(0, Math.floor(Number.isFinite(steps) ? steps : 0));
      for (let i = 0; i < n; i++) step();
      render();
    };

    return () => {
      cancelAnimationFrame(rafRef.current);
      svgNode.removeEventListener("pointerdown", onPointerDown);
      svgNode.removeEventListener("pointermove", onPointerMove);
      svgNode.removeEventListener("pointerup", onPointerUp);
      svgNode.removeEventListener("pointercancel", onPointerUp);
      delete window.spiramioides_render_to_text;
      delete window.spiramioides_advance;
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      style={{ touchAction: "none", display: "block", cursor: "crosshair" }}
    >
      <defs>
        <radialGradient id="spi-lamp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8d0" stopOpacity="0.88" />
          <stop offset="18%" stopColor="#f0b840" stopOpacity="0.65" />
          <stop offset="50%" stopColor="#c07820" stopOpacity="0.28" />
          <stop offset="82%" stopColor="#a05010" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#a05010" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="100" height="100" fill="#0a0814" />

      <polyline
        ref={trailRef}
        points=""
        fill="none"
        stroke="#c87820"
        strokeWidth="0.32"
        strokeOpacity="0.52"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <g ref={lightGroupRef} transform="translate(50,50)">
        <circle r="20" fill="url(#spi-lamp-glow)" />
        <circle r="2" fill="#fffde8" fillOpacity="0.92" />
        <circle r="0.7" fill="#ffffff" />
      </g>

      <g ref={mothGroupRef} transform="translate(7,84)">
        <path
          d="M 1.5,0 C 1,-2.2 -2.8,-3.8 -4.5,-2.6 C -6,-1.6 -5.5,0.4 -3.2,1.1 C -1.5,1.6 0,0.9 1.5,0 Z"
          fill="#c8b478"
          fillOpacity="0.9"
        />
        <path
          d="M 1.5,0 C 1,2.2 -2.8,3.8 -4.5,2.6 C -6,1.6 -5.5,-0.4 -3.2,-1.1 C -1.5,-1.6 0,-0.9 1.5,0 Z"
          fill="#c8b478"
          fillOpacity="0.9"
        />
        <path
          d="M -1.8,0 C -2.4,-1.4 -4.2,-2 -5,-0.7 C -5.4,0.2 -4.2,0.7 -1.8,0 Z"
          fill="#9a7840"
          fillOpacity="0.82"
        />
        <path
          d="M -1.8,0 C -2.4,1.4 -4.2,2 -5,0.7 C -5.4,-0.2 -4.2,-0.7 -1.8,0 Z"
          fill="#9a7840"
          fillOpacity="0.82"
        />
        <ellipse rx="2.1" ry="0.55" fill="#6a4c28" />
        <circle cx="1.6" cy="0" r="0.65" fill="#4a3018" />
      </g>
    </svg>
  );
}
