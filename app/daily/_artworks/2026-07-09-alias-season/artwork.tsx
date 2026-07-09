"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    alias_season_render_to_text?: () => string;
    alias_season_advance?: (steps: number) => void;
  }
}

const VB = 500;
const SNAP_R = 48;
const TOTAL_EDGES = 6;

interface SignalNode {
  id: string;
  label: string[];
  year: string;
  cx: number;
  cy: number;
}

const NODES: SignalNode[] = [
  { id: "gt", label: ["Gran Turismo"], year: "1998", cx: 118, cy: 148 },
  { id: "paus", label: ["Paus"], year: "1998", cx: 362, cy: 118 },
  { id: "acamp", label: ["A Camp"], year: "2001", cx: 388, cy: 355 },
  { id: "lgbd", label: ["Long Gone", "Before Daylight"], year: "2003", cx: 118, cy: 375 },
];

function edgeKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

const REVEALS: Record<string, string> = {
  [edgeKey("gt", "paus")]: "Peter Svensson, renamed Paus",
  [edgeKey("gt", "acamp")]: "Nina Persson, elsewhere as A Camp",
  [edgeKey("gt", "lgbd")]: "five years between, the same four hands",
  [edgeKey("paus", "acamp")]: "both away at once",
  [edgeKey("paus", "lgbd")]: "Paus dissolved into the return",
  [edgeKey("acamp", "lgbd")]: "A Camp folded into the homecoming",
};

const ALL_EDGES = Object.keys(REVEALS);

function dist2(ax: number, ay: number, bx: number, by: number): number {
  return (ax - bx) ** 2 + (ay - by) ** 2;
}

function closestNode(px: number, py: number): SignalNode | null {
  let best: SignalNode | null = null;
  let bestD = SNAP_R * SNAP_R;
  for (const n of NODES) {
    const d = dist2(px, py, n.cx, n.cy);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

export default function AliasSeason() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [connections, setConnections] = useState<Set<string>>(new Set());
  const activeFromRef = useRef<SignalNode | null>(null);
  const connectionsCountRef = useRef(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const toSVG = (clientX: number, clientY: number) => {
      const rect = svg.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * VB,
        y: ((clientY - rect.top) / rect.height) * VB,
      };
    };

    const activeLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    activeLine.setAttribute("stroke", "rgba(255,255,255,0.5)");
    activeLine.setAttribute("stroke-width", "1.5");
    activeLine.setAttribute("stroke-dasharray", "6 4");
    activeLine.style.display = "none";
    svg.appendChild(activeLine);

    const handlePointerDown = (e: PointerEvent) => {
      const { x, y } = toSVG(e.clientX, e.clientY);
      const node = closestNode(x, y);
      if (!node) return;
      activeFromRef.current = node;
      svg.setPointerCapture(e.pointerId);
      activeLine.setAttribute("x1", String(node.cx));
      activeLine.setAttribute("y1", String(node.cy));
      activeLine.setAttribute("x2", String(node.cx));
      activeLine.setAttribute("y2", String(node.cy));
      activeLine.style.display = "";
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!activeFromRef.current) return;
      const { x, y } = toSVG(e.clientX, e.clientY);
      activeLine.setAttribute("x2", String(x));
      activeLine.setAttribute("y2", String(y));
    };

    const handlePointerUp = (e: PointerEvent) => {
      const from = activeFromRef.current;
      activeFromRef.current = null;
      activeLine.style.display = "none";
      if (!from) return;
      const { x, y } = toSVG(e.clientX, e.clientY);
      const to = closestNode(x, y);
      if (!to || to.id === from.id) return;
      const key = edgeKey(from.id, to.id);
      setConnections((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        connectionsCountRef.current = next.size;
        return next;
      });
    };

    svg.addEventListener("pointerdown", handlePointerDown);
    svg.addEventListener("pointermove", handlePointerMove);
    svg.addEventListener("pointerup", handlePointerUp);
    svg.addEventListener("pointercancel", handlePointerUp);

    window.alias_season_render_to_text = () =>
      `alias-season | connections: ${connectionsCountRef.current}/${TOTAL_EDGES}`;

    window.alias_season_advance = (steps: number) => {
      const n = Math.max(0, Math.floor(Number.isFinite(steps) ? steps : 0));
      setConnections((prev) => {
        const next = new Set(prev);
        let added = 0;
        for (const key of ALL_EDGES) {
          if (added >= n) break;
          if (!next.has(key)) {
            next.add(key);
            added++;
          }
        }
        connectionsCountRef.current = next.size;
        return next;
      });
    };

    return () => {
      svg.removeEventListener("pointerdown", handlePointerDown);
      svg.removeEventListener("pointermove", handlePointerMove);
      svg.removeEventListener("pointerup", handlePointerUp);
      svg.removeEventListener("pointercancel", handlePointerUp);
      if (svg.contains(activeLine)) svg.removeChild(activeLine);
      delete window.alias_season_render_to_text;
      delete window.alias_season_advance;
    };
  }, []);

  const count = connections.size;
  const allConnected = count === TOTAL_EDGES;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB} ${VB}`}
      width="100%"
      height="100%"
      className="block touch-none select-none cursor-crosshair"
      aria-label="A night sky with four signal points marking the Cardigans' five-year inter-album gap. Trace between any two points to reveal the alias used in that interval."
    >
      <defs>
        <radialGradient id="alias-bg" cx="50%" cy="85%" r="65%">
          <stop offset="0%" stopColor={allConnected ? "#1c3d56" : "#0f1e2d"} />
          <stop offset="100%" stopColor="#04080f" />
        </radialGradient>
      </defs>

      <rect width={VB} height={VB} fill="url(#alias-bg)" />

      {NODES.flatMap((a, ai) =>
        NODES.slice(ai + 1).map((b) => {
          const key = edgeKey(a.id, b.id);
          if (!connections.has(key)) return null;
          const mx = (a.cx + b.cx) / 2;
          const my = (a.cy + b.cy) / 2;
          return (
            <g key={key}>
              <line
                x1={a.cx}
                y1={a.cy}
                x2={b.cx}
                y2={b.cy}
                stroke="rgba(255,255,255,0.28)"
                strokeWidth={1.2}
              />
              <text
                x={mx}
                y={my - 9}
                textAnchor="middle"
                fill="rgba(255,255,255,0.58)"
                fontSize={13}
                fontFamily="var(--font-geist-mono, monospace)"
              >
                {REVEALS[key]}
              </text>
            </g>
          );
        })
      )}

      {NODES.map((node) => {
        const connected = [...connections].some((k) =>
          k.split(":").includes(node.id)
        );
        const labelLineH = 17;
        const labelY =
          node.cy - (node.label.length > 1 ? 26 : 18);
        return (
          <g key={node.id}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={connected ? 7.5 : 5}
              fill="rgba(255,255,255,0.9)"
            />
            {node.label.map((line, li) => (
              <text
                key={li}
                x={node.cx}
                y={labelY + li * labelLineH}
                textAnchor="middle"
                fill="rgba(255,255,255,0.88)"
                fontSize={16}
                fontFamily="var(--font-geist-mono, monospace)"
              >
                {line}
              </text>
            ))}
            <text
              x={node.cx}
              y={node.cy + 22}
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize={12}
              fontFamily="var(--font-geist-mono, monospace)"
            >
              {node.year}
            </text>
          </g>
        );
      })}

      <text
        x={VB - 12}
        y={VB - 14}
        textAnchor="end"
        fill="rgba(255,255,255,0.28)"
        fontSize={13}
        fontFamily="var(--font-geist-mono, monospace)"
      >
        {count}/{TOTAL_EDGES}
      </text>

      {allConnected && (
        <text
          x={VB / 2}
          y={VB - 14}
          textAnchor="middle"
          fill="rgba(255,255,255,0.38)"
          fontSize={13}
          fontFamily="var(--font-geist-mono, monospace)"
        >
          long gone before daylight
        </text>
      )}

      {count === 0 && (
        <text
          x={VB / 2}
          y={VB - 14}
          textAnchor="middle"
          fill="rgba(255,255,255,0.22)"
          fontSize={13}
          fontFamily="var(--font-geist-mono, monospace)"
        >
          trace between signals
        </text>
      )}
    </svg>
  );
}
