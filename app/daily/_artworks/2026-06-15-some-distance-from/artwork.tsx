"use client";

import { useEffect, useRef, useReducer } from "react";

type Point = { x: number; y: number };

const VB = 100;

const STATION: Point = { x: 55, y: 49 };
const VILLAGE: Point = { x: 29, y: 28 };
const FAWLER: Point = { x: 67, y: 63 };
const RAIL = { x1: 4, y1: 63, x2: 96, y2: 37 };
const ROAD = { x1: 49, y1: 31, x2: 52, y2: 71 };

const METRES_PER_UNIT = 30;
const MAX_HISTORY = 7;

function svgPt(e: React.PointerEvent<SVGSVGElement>, el: SVGSVGElement): Point {
  const r = el.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * VB,
    y: ((e.clientY - r.top) / r.height) * VB,
  };
}

function deflect(raw: Point): Point {
  const vd = Math.hypot(VILLAGE.x - raw.x, VILLAGE.y - raw.y);
  const strength = Math.max(0, 1 - vd / 38) * 9;
  const dx = FAWLER.x - raw.x;
  const dy = FAWLER.y - raw.y;
  const fd = Math.hypot(dx, dy) + 0.001;
  return { x: raw.x + (dx / fd) * strength, y: raw.y + (dy / fd) * strength };
}

function closestToVillage(trace: Point[]): number {
  return Math.min(...trace.map((p) => Math.hypot(VILLAGE.x - p.x, VILLAGE.y - p.y)));
}

function ptsStr(pts: Point[]): string {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

type State = {
  traces: Point[][];
  active: Point[];
  dragging: boolean;
  bestMetres: number | null;
  attempts: number;
};

type Action =
  | { type: "START"; pt: Point }
  | { type: "MOVE"; pt: Point }
  | { type: "END" };

const INIT: State = {
  traces: [],
  active: [],
  dragging: false,
  bestMetres: null,
  attempts: 0,
};

function reduce(s: State, a: Action): State {
  if (a.type === "START") {
    const d = Math.hypot(STATION.x - a.pt.x, STATION.y - a.pt.y);
    if (d > 10) return s;
    return { ...s, dragging: true, active: [deflect(a.pt)] };
  }
  if (a.type === "MOVE") {
    if (!s.dragging) return s;
    const p = deflect(a.pt);
    const last = s.active[s.active.length - 1];
    if (last && Math.hypot(p.x - last.x, p.y - last.y) < 0.8) return s;
    return { ...s, active: [...s.active, p] };
  }
  if (a.type === "END") {
    if (!s.dragging) return s;
    if (s.active.length <= 2) return { ...s, dragging: false, active: [] };
    const metres = Math.round(closestToVillage(s.active) * METRES_PER_UNIT);
    const best =
      s.bestMetres === null || metres < s.bestMetres ? metres : s.bestMetres;
    return {
      dragging: false,
      active: [],
      traces: [...s.traces.slice(-MAX_HISTORY + 1), s.active],
      bestMetres: best,
      attempts: s.attempts + 1,
    };
  }
  return s;
}

declare global {
  interface Window {
    some_distance_from_render_to_text?: () => string;
    some_distance_from_advance?: (steps: number) => void;
  }
}

export default function SomeDistanceFrom() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [state, dispatch] = useReducer(reduce, INIT);
  const bestMetresRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    bestMetresRef.current = state.bestMetres;
    attemptsRef.current = state.attempts;
  });

  useEffect(() => {
    window.some_distance_from_render_to_text = () => {
      const best = bestMetresRef.current;
      return best === null
        ? "attempt 0; closest: —"
        : `attempt ${attemptsRef.current}; closest: ${best} m from Finstock`;
    };
    window.some_distance_from_advance = () => {};
    return () => {
      delete window.some_distance_from_render_to_text;
      delete window.some_distance_from_advance;
    };
  }, []);

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current) return;
    dispatch({ type: "START", pt: svgPt(e, svgRef.current) });
  }
  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current) return;
    dispatch({ type: "MOVE", pt: svgPt(e, svgRef.current) });
  }
  function onEnd() {
    dispatch({ type: "END" });
  }

  const { traces, active, dragging, bestMetres, attempts } = state;
  const numTraces = traces.length;

  const railDx = RAIL.x2 - RAIL.x1;
  const railDy = RAIL.y2 - RAIL.y1;
  const railLen = Math.hypot(railDx, railDy);
  const perpX = -railDy / railLen;
  const perpY = railDx / railLen;
  const sleepers = Array.from({ length: 19 }, (_, i) => {
    const t = (i + 0.5) / 19;
    return {
      cx: RAIL.x1 + t * railDx,
      cy: RAIL.y1 + t * railDy,
    };
  });

  return (
    <div className="w-full h-full bg-[#f5f0d8] select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        className="w-full h-full touch-none"
        style={{ cursor: dragging ? "crosshair" : "default" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onEnd}
        onPointerLeave={onEnd}
        onPointerCancel={onEnd}
      >
        <defs>
          <pattern id="sdgrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#d5ccaa" strokeWidth="0.2" />
          </pattern>
        </defs>

        <rect width="100" height="100" fill="url(#sdgrid)" />

        <line
          x1={ROAD.x1}
          y1={ROAD.y1}
          x2={ROAD.x2}
          y2={ROAD.y2}
          stroke="#daa010"
          strokeWidth="1"
          strokeDasharray="2,1.2"
        />
        <text x="34" y="74" fontSize="2.6" fill="#b08800" fontFamily="monospace">
          CHARLBURY RD
        </text>

        <line x1={RAIL.x1} y1={RAIL.y1} x2={RAIL.x2} y2={RAIL.y2} stroke="#c8372d" strokeWidth="2" />
        {sleepers.map((sl, i) => (
          <line
            key={i}
            x1={sl.cx + perpX * 2.2}
            y1={sl.cy + perpY * 2.2}
            x2={sl.cx - perpX * 2.2}
            y2={sl.cy - perpY * 2.2}
            stroke="#c8372d"
            strokeWidth="0.6"
          />
        ))}

        {traces.map((tr, i) => (
          <polyline
            key={i}
            points={ptsStr(tr)}
            fill="none"
            stroke="#2b4c8c"
            strokeWidth="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.12 + (i / Math.max(numTraces - 1, 1)) * 0.22}
          />
        ))}

        {active.length > 1 && (
          <polyline
            points={ptsStr(active)}
            fill="none"
            stroke="#2b4c8c"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.65"
          />
        )}

        <circle cx={FAWLER.x} cy={FAWLER.y} r="2.2" fill="#999" stroke="#777" strokeWidth="0.4" />
        <text x={FAWLER.x + 3} y={FAWLER.y + 1.2} fontSize="3" fill="#777" fontFamily="monospace">
          FAWLER
        </text>

        <circle cx={VILLAGE.x} cy={VILLAGE.y} r="3.2" fill="none" stroke="#2b4c8c" strokeWidth="1.1" />
        <circle cx={VILLAGE.x} cy={VILLAGE.y} r="1.4" fill="#2b4c8c" />
        <text
          x={VILLAGE.x}
          y={VILLAGE.y - 5.5}
          fontSize="3.2"
          fill="#2b4c8c"
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor="middle"
        >
          FINSTOCK
        </text>

        <rect
          x={STATION.x - 4.5}
          y={STATION.y - 2}
          width="9"
          height="4"
          rx="0.5"
          fill="white"
          stroke="#c8372d"
          strokeWidth="0.9"
        />
        <text
          x={STATION.x}
          y={STATION.y + 1}
          fontSize="2.4"
          fill="#c8372d"
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor="middle"
        >
          STN
        </text>
        <text
          x={STATION.x}
          y={STATION.y + 7.2}
          fontSize="3"
          fill="#c8372d"
          fontFamily="monospace"
          textAnchor="middle"
        >
          FINSTOCK
        </text>

        {attempts === 0 && !dragging && (
          <text
            x={STATION.x}
            y={STATION.y + 12.5}
            fontSize="2.6"
            fill="#c8372d"
            fontFamily="monospace"
            textAnchor="middle"
            opacity="0.5"
          >
            ← trace from here
          </text>
        )}

        <text
          x="50"
          y="8"
          fontSize="2.2"
          fill="#888"
          fontFamily="monospace"
          textAnchor="middle"
          opacity="0.75"
        >
          ★ FINSTOCK STN — serving FINSTOCK (some distance from Finstock)
        </text>

        <rect
          x="2"
          y="88.5"
          width="96"
          height="9"
          rx="0.8"
          fill="white"
          fillOpacity="0.88"
          stroke="#c8372d"
          strokeWidth="0.5"
        />
        <text
          x="50"
          y="95"
          fontSize="3.5"
          fill="#c8372d"
          fontFamily="monospace"
          textAnchor="middle"
          fontWeight="bold"
        >
          {bestMetres === null
            ? "closest: — m from FINSTOCK  |  0 attempts"
            : `closest: ${bestMetres} m from FINSTOCK  |  ${attempts} attempts`}
        </text>
      </svg>
    </div>
  );
}
