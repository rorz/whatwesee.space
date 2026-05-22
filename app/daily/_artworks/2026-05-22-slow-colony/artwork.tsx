"use client";

import { useEffect, useRef } from "react";

/**
 * Slow Colony — Kwame Asante
 *
 * SVG lichen-growth simulation. Each click plants a colony at that point.
 * Each colony spawns concentric rings at intervals; rings grow outward.
 * The outermost ring in any colony is always the oldest — it has grown
 * the furthest. Color and weight increase with age: pale/thin at center,
 * saturated/thick at the edge.
 *
 * Medium: SVG + requestAnimationFrame (direct DOM manipulation, no React
 * re-renders in the animation loop).
 */

declare global {
  interface Window {
    slow_colony_render_to_text?: () => string;
    slow_colony_advance?: (steps: number) => void;
  }
}

const VIEWBOX = 100;
const RING_MAX_RADIUS = 44;
const RING_GROW_RATE = 0.04; // viewBox units per frame
const RING_SPAWN_INTERVAL = 120; // frames (~2 s at 60 fps)
const RING_SPACING = RING_GROW_RATE * RING_SPAWN_INTERVAL; // 4.8 units between rings at steady state
const RING_MAX_PER_COLONY = 7;
const MAX_COLONIES = 12;

// Color lerp: young (inner, just spawned) → old (outer, long-established)
const COLOR_YOUNG = [196, 208, 138] as const; // pale yellow-green
const COLOR_OLD = [58, 86, 48] as const; // deep sage

const SVG_NS = "http://www.w3.org/2000/svg";

function lerpColor(t: number): string {
  const r = Math.round(COLOR_YOUNG[0] + (COLOR_OLD[0] - COLOR_YOUNG[0]) * t);
  const g = Math.round(COLOR_YOUNG[1] + (COLOR_OLD[1] - COLOR_YOUNG[1]) * t);
  const b = Math.round(COLOR_YOUNG[2] + (COLOR_OLD[2] - COLOR_YOUNG[2]) * t);
  return `rgb(${r},${g},${b})`;
}

type Ring = {
  el: SVGCircleElement;
  r: number;
  maxR: number;
};

type Colony = {
  cx: number;
  cy: number;
  rings: Ring[];
  spawnTimer: number;
};

export default function SlowColony() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const groupRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const group = groupRef.current;
    if (!svg || !group) return;

    const colonies: Colony[] = [];
    let rafId = 0;

    const addRing = (colony: Colony): void => {
      if (colony.rings.length >= RING_MAX_PER_COLONY) return;
      const ringIndex = colony.rings.length;
      // Each successive ring has a smaller max radius so they stay spaced apart at steady state
      const maxR = Math.max(6, RING_MAX_RADIUS - ringIndex * RING_SPACING);
      const el = document.createElementNS(SVG_NS, "circle");
      el.setAttribute("cx", colony.cx.toFixed(2));
      el.setAttribute("cy", colony.cy.toFixed(2));
      el.setAttribute("r", "0");
      el.setAttribute("fill", "none");
      el.setAttribute("vector-effect", "non-scaling-stroke");
      group.appendChild(el);
      colony.rings.push({ el, r: 0, maxR });
    };

    const addColony = (cx: number, cy: number): void => {
      if (colonies.length >= MAX_COLONIES) return;
      const colony: Colony = { cx, cy, rings: [], spawnTimer: 0 };
      addRing(colony);
      colonies.push(colony);
    };

    const stepOnce = (): void => {
      for (const colony of colonies) {
        for (const ring of colony.rings) {
          if (ring.r < ring.maxR) {
            ring.r = Math.min(ring.maxR, ring.r + RING_GROW_RATE);
          }
          // t = 0 (newest/innermost) → 1 (oldest/outermost, at max radius)
          const t = ring.r / RING_MAX_RADIUS;
          ring.el.setAttribute("r", ring.r.toFixed(2));
          ring.el.setAttribute("stroke", lerpColor(t));
          ring.el.setAttribute("stroke-width", (0.6 + t * 1.4).toFixed(2));
          ring.el.setAttribute("stroke-opacity", (0.2 + t * 0.65).toFixed(2));
        }
        colony.spawnTimer += 1;
        if (colony.spawnTimer >= RING_SPAWN_INTERVAL) {
          colony.spawnTimer = 0;
          addRing(colony);
        }
      }
    };

    const loop = (): void => {
      stepOnce();
      rafId = window.requestAnimationFrame(loop);
    };

    const toViewBox = (clientX: number, clientY: number): [number, number] => {
      const rect = svg.getBoundingClientRect();
      return [
        Math.max(0, Math.min(VIEWBOX, ((clientX - rect.left) / rect.width) * VIEWBOX)),
        Math.max(0, Math.min(VIEWBOX, ((clientY - rect.top) / rect.height) * VIEWBOX)),
      ];
    };

    const onPointerDown = (e: PointerEvent): void => {
      e.preventDefault();
      const [cx, cy] = toViewBox(e.clientX, e.clientY);
      addColony(cx, cy);
    };

    svg.addEventListener("pointerdown", onPointerDown);

    // Pre-seed three colonies and fast-forward ~6 s so they are visible on load
    addColony(31, 37);
    addColony(66, 60);
    addColony(49, 74);
    for (let i = 0; i < 400; i++) stepOnce();

    window.slow_colony_render_to_text = () => {
      const totalRings = colonies.reduce((n, c) => n + c.rings.length, 0);
      const maxR =
        totalRings > 0
          ? Math.max(...colonies.flatMap((c) => c.rings.map((ring) => ring.r)))
          : 0;
      return `Slow Colony | colonies:${colonies.length} rings:${totalRings} max-r:${maxR.toFixed(1)}`;
    };

    window.slow_colony_advance = (steps: number): void => {
      for (let i = 0; i < steps; i++) stepOnce();
    };

    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
      svg.removeEventListener("pointerdown", onPointerDown);
      delete window.slow_colony_render_to_text;
      delete window.slow_colony_advance;
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full touch-none select-none cursor-crosshair"
      style={{ background: "#9da89a" }}
      aria-label="A stone-gray surface. Click anywhere to plant a lichen colony. Concentric rings grow outward from each point; the outermost ring is always the oldest."
    >
      <g ref={groupRef} />
    </svg>
  );
}
