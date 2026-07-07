"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    the_billing_conflict_render_to_text?: () => string;
    the_billing_conflict_advance?: (steps: number) => void;
  }
}

const VIEWBOX = 100;

interface Tradition {
  readonly heading: string;
  readonly venue: string;
  readonly billing: string;
  readonly freqBase: number;
  readonly amps: readonly number[];
  readonly speed: number;
  readonly bgFill: string;
  readonly strokeColor: string;
  readonly textColor: string;
  readonly venueColor: string;
}

const LITURGY: Tradition = {
  heading: "Shacharit",
  venue: "CONGREGATION BETH ISRAEL",
  billing: "weekdays · 7:15 a.m. · no charge",
  freqBase: 1.1,
  amps: [1.0, 0.16, 0.04],
  speed: 0.009,
  bgFill: "#f4e6c0",
  strokeColor: "#223062",
  textColor: "#1a2850",
  venueColor: "#5a3c10",
};

const CARNEGIE: Tradition = {
  heading: "The Voice",
  venue: "CARNEGIE HALL",
  billing: "friday · 7:30 p.m. · sold out",
  freqBase: 2.6,
  amps: [1.0, 0.68, 0.44, 0.22, 0.10],
  speed: 0.032,
  bgFill: "#e8d0a0",
  strokeColor: "#5e1018",
  textColor: "#4a0c14",
  venueColor: "#5a3c10",
};

function buildPath(
  tradition: Tradition,
  xStart: number,
  xEnd: number,
  phase: number,
): string {
  const { freqBase, amps } = tradition;
  const totalAmp = amps.reduce((s, a) => s + a, 0);
  const cy = VIEWBOX * 0.5;
  const amplitude = VIEWBOX * 0.14;
  const n = 120;
  const panelWidth = xEnd - xStart;
  if (panelWidth < 0.5) return "";

  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const localFrac = i / n;
    const x = xStart + localFrac * panelWidth;
    let y = 0;
    for (let k = 0; k < amps.length; k++) {
      y += amps[k] * Math.sin(freqBase * (k + 1) * localFrac * 2 * Math.PI + phase);
    }
    const yn = cy + (y / totalAmp) * amplitude;
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${yn.toFixed(2)}`);
  }
  return pts.join(" ");
}

export default function TheBillingConflict() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const stateRef = useRef({
    split: 0.5,
    liturgyPhase: 0,
    carnegiePhase: 0,
    dragging: false,
    captureId: null as number | null,
    steps: 0,
  });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const s = stateRef.current;

    const leftBg = svg.querySelector<SVGRectElement>("#bc-lb")!;
    const rightBg = svg.querySelector<SVGRectElement>("#bc-rb")!;
    const liturgyPath = svg.querySelector<SVGPathElement>("#bc-lw")!;
    const carnegiePath = svg.querySelector<SVGPathElement>("#bc-rw")!;
    const divLine = svg.querySelector<SVGLineElement>("#bc-div")!;
    const divHandle = svg.querySelector<SVGRectElement>("#bc-dh")!;
    const leftGroup = svg.querySelector<SVGGElement>("#bc-lg")!;
    const rightGroup = svg.querySelector<SVGGElement>("#bc-rg")!;

    let rafId = 0;

    function toSVGX(clientX: number): number {
      const rect = svg!.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * VIEWBOX;
    }

    function updateDOM() {
      const splitX = s.split * VIEWBOX;

      leftBg.setAttribute("width", splitX.toFixed(2));
      rightBg.setAttribute("x", splitX.toFixed(2));
      rightBg.setAttribute("width", (VIEWBOX - splitX).toFixed(2));

      divLine.setAttribute("x1", splitX.toFixed(2));
      divLine.setAttribute("x2", splitX.toFixed(2));
      divHandle.setAttribute("x", (splitX - 2).toFixed(2));

      const leftCx = splitX / 2;
      leftGroup.setAttribute("transform", `translate(${leftCx.toFixed(2)},0)`);
      const rightCx = splitX + (VIEWBOX - splitX) / 2;
      rightGroup.setAttribute("transform", `translate(${rightCx.toFixed(2)},0)`);

      liturgyPath.setAttribute("d", buildPath(LITURGY, 0, splitX, s.liturgyPhase));
      carnegiePath.setAttribute("d", buildPath(CARNEGIE, splitX, VIEWBOX, s.carnegiePhase));
    }

    function advance(steps: number) {
      for (let i = 0; i < steps; i++) {
        s.liturgyPhase += LITURGY.speed;
        s.carnegiePhase += CARNEGIE.speed;
        s.steps++;
      }
    }

    const loop = () => {
      advance(1);
      updateDOM();
      rafId = window.requestAnimationFrame(loop);
    };

    const onPointerDown = (e: PointerEvent) => {
      const px = toSVGX(e.clientX);
      const divPx = s.split * VIEWBOX;
      if (Math.abs(px - divPx) < 5) {
        s.dragging = true;
        s.captureId = e.pointerId;
        svg.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!s.dragging || s.captureId !== e.pointerId) return;
      const px = toSVGX(e.clientX);
      s.split = Math.max(0.08, Math.min(0.92, px / VIEWBOX));
    };

    const onPointerUp = (e: PointerEvent) => {
      if (s.captureId === e.pointerId) {
        s.dragging = false;
        s.captureId = null;
      }
    };

    svg.addEventListener("pointerdown", onPointerDown);
    svg.addEventListener("pointermove", onPointerMove);
    svg.addEventListener("pointerup", onPointerUp);
    svg.addEventListener("pointercancel", onPointerUp);

    window.the_billing_conflict_render_to_text = () =>
      `The Billing Conflict | split: ${(s.split * 100).toFixed(0)}% liturgy | liturgyPhase: ${s.liturgyPhase.toFixed(2)} | steps: ${s.steps}`;

    window.the_billing_conflict_advance = (steps: number) => {
      advance(Math.max(0, Math.floor(steps)));
      updateDOM();
    };

    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
      svg.removeEventListener("pointerdown", onPointerDown);
      svg.removeEventListener("pointermove", onPointerMove);
      svg.removeEventListener("pointerup", onPointerUp);
      svg.removeEventListener("pointercancel", onPointerUp);
      delete window.the_billing_conflict_render_to_text;
      delete window.the_billing_conflict_advance;
    };
  }, []);

  const V = VIEWBOX;
  const initSplit = V * 0.5;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${V} ${V}`}
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      style={{ touchAction: "none", cursor: "ew-resize" }}
      aria-label="A split-screen voice comparison instrument. Drag the centre divider to adjust the balance between Shacharit (morning prayer) and Carnegie Hall opera. Each side shows a waveform in its own harmonic character."
    >
      <defs>
        <clipPath id="bc-clip-left">
          <rect id="bc-clip-lr" x="0" y="0" width={initSplit} height={V} />
        </clipPath>
        <clipPath id="bc-clip-right">
          <rect id="bc-clip-rr" x={initSplit} y="0" width={V - initSplit} height={V} />
        </clipPath>
      </defs>

      {/* Panel backgrounds */}
      <rect id="bc-lb" x="0" y="0" width={initSplit} height={V} fill={LITURGY.bgFill} />
      <rect id="bc-rb" x={initSplit} y="0" width={V - initSplit} height={V} fill={CARNEGIE.bgFill} />

      {/* Left panel label group — centred within left panel */}
      <g id="bc-lg" transform={`translate(${initSplit / 2},0)`}>
        <text
          y="14"
          textAnchor="middle"
          fontSize="6.8"
          fontWeight="600"
          fill={LITURGY.textColor}
          fontFamily="'Geist Sans', sans-serif"
        >
          {LITURGY.heading}
        </text>
        <text
          y="20.5"
          textAnchor="middle"
          fontSize="3.2"
          letterSpacing="0.5"
          fill={LITURGY.venueColor}
          fontFamily="'Geist Sans', sans-serif"
        >
          {LITURGY.venue}
        </text>
        <text
          y="25.5"
          textAnchor="middle"
          fontSize="2.8"
          fill={LITURGY.venueColor}
          fillOpacity="0.7"
          fontFamily="'Geist Sans', sans-serif"
        >
          {LITURGY.billing}
        </text>
      </g>

      {/* Right panel label group — centred within right panel */}
      <g id="bc-rg" transform={`translate(${initSplit + (V - initSplit) / 2},0)`}>
        <text
          y="14"
          textAnchor="middle"
          fontSize="6.8"
          fontWeight="600"
          fontStyle="italic"
          fill={CARNEGIE.textColor}
          fontFamily="'Geist Sans', sans-serif"
        >
          {CARNEGIE.heading}
        </text>
        <text
          y="20.5"
          textAnchor="middle"
          fontSize="3.2"
          letterSpacing="0.5"
          fill={CARNEGIE.venueColor}
          fontFamily="'Geist Sans', sans-serif"
        >
          {CARNEGIE.venue}
        </text>
        <text
          y="25.5"
          textAnchor="middle"
          fontSize="2.8"
          fill={CARNEGIE.venueColor}
          fillOpacity="0.7"
          fontFamily="'Geist Sans', sans-serif"
        >
          {CARNEGIE.billing}
        </text>
      </g>

      {/* Waveforms */}
      <path
        id="bc-lw"
        fill="none"
        stroke={LITURGY.strokeColor}
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        id="bc-rw"
        fill="none"
        stroke={CARNEGIE.strokeColor}
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom credit line */}
      <text
        x={V / 2}
        y={V - 4}
        textAnchor="middle"
        fontSize="2.4"
        fill="#7a5c20"
        fillOpacity="0.6"
        fontFamily="'Geist Sans', sans-serif"
      >
        drag the divider · neither bends
      </text>

      {/* Divider line */}
      <line
        id="bc-div"
        x1={initSplit}
        y1="0"
        x2={initSplit}
        y2={V}
        stroke="#8b6020"
        strokeWidth="0.6"
      />

      {/* Draggable handle zone (wider hit target) */}
      <rect
        id="bc-dh"
        x={initSplit - 2}
        y="0"
        width="4"
        height={V}
        fill="transparent"
        style={{ cursor: "ew-resize" }}
      />
    </svg>
  );
}
