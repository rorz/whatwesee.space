"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    by_marriage_render_to_text?: () => string;
    by_marriage_advance?: (steps: number) => void;
  }
}

const VB = 400;
const BADGE_W = 148;
const BADGE_H = 36;
const BADGE_GAP = 72;
const BADGE_Y0 = 90;
const LX = 10;
const RX = VB - 10 - BADGE_W; // 242
const CX = VB / 2; // 200
const LEG_N = 8;
const LEG_L = 22;
const ORANGE = "#ff6700";
const SHIELD_Y0 = 48;
const SHIELD_H = BADGE_Y0 + 3 * BADGE_GAP + BADGE_H + 22 - SHIELD_Y0; // ~316

const BADGES = [
  { id: "austria", label: "Archduchess of Austria" },
  { id: "bohemia", label: "Princess of Bohemia" },
  { id: "hungary", label: "Princess of Hungary" },
  { id: "tuscany", label: "Princess of Tuscany" },
] as const;

type BadgeId = (typeof BADGES)[number]["id"];
type Side = "habsburg" | "wurttemberg";

function slotX(side: Side): number {
  return side === "habsburg" ? LX : RX;
}

function slotY(i: number): number {
  return BADGE_Y0 + i * BADGE_GAP;
}

function shieldD(x: number, w: number, y0: number, h: number): string {
  const mid = x + w / 2;
  return [
    `M ${x} ${y0}`,
    `L ${x + w} ${y0}`,
    `L ${x + w} ${y0 + h * 0.72}`,
    `Q ${x + w} ${y0 + h} ${mid} ${y0 + h}`,
    `Q ${x} ${y0 + h} ${x} ${y0 + h * 0.72}`,
    `Z`,
  ].join(" ");
}

const SHIELD_W = BADGE_W + 20;

export default function ByMarriage() {
  const svgRef = useRef<SVGSVGElement>(null);

  // Canonical state in refs (stable for closures)
  const sidesRef = useRef<Record<BadgeId, Side>>({
    austria: "habsburg",
    bohemia: "habsburg",
    hungary: "habsburg",
    tuscany: "habsburg",
  });
  const dragRef = useRef<{
    id: BadgeId;
    svgX: number;
    svgY: number;
    lastX: number;
    crossed: boolean;
  } | null>(null);
  const morphRafs = useRef<Partial<Record<BadgeId, number>>>({});
  const morphProgs = useRef<Partial<Record<BadgeId, number>>>({});
  const completeRef = useRef(false);

  // React state (triggers re-renders)
  const [sidesState, setSidesState] = useState<Record<BadgeId, Side>>({
    austria: "habsburg",
    bohemia: "habsburg",
    hungary: "habsburg",
    tuscany: "habsburg",
  });
  const [morphState, setMorphState] = useState<Partial<Record<BadgeId, number>>>({});
  const [dragState, setDragState] = useState<{ id: BadgeId; svgX: number; svgY: number } | null>(null);
  const [complete, setComplete] = useState(false);

  function toSVG(clientX: number, clientY: number): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const r = pt.matrixTransform(ctm.inverse());
    return { x: r.x, y: r.y };
  }

  function startMorph(id: BadgeId) {
    const existing = morphRafs.current[id];
    if (existing !== undefined) cancelAnimationFrame(existing);
    morphProgs.current[id] = 0;
    let extending = true;

    const step = () => {
      const cur = morphProgs.current[id] ?? 0;
      let next: number;
      if (extending) {
        next = Math.min(1, cur + 0.07);
        if (next >= 1) extending = false;
      } else {
        next = Math.max(0, cur - 0.05);
      }
      morphProgs.current[id] = next;
      setMorphState((prev) => ({ ...prev, [id]: next }));

      if (next > 0 || extending) {
        morphRafs.current[id] = requestAnimationFrame(step);
      } else {
        delete morphRafs.current[id];
        delete morphProgs.current[id];
        setMorphState((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
      }
    };

    morphRafs.current[id] = requestAnimationFrame(step);
  }

  function onBadgeDown(e: React.MouseEvent | React.TouchEvent, id: BadgeId) {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const { x, y } = toSVG(clientX, clientY);
    dragRef.current = { id, svgX: x, svgY: y, lastX: x, crossed: false };
    setDragState({ id, svgX: x, svgY: y });
  }

  useEffect(() => {
    const rafs = morphRafs.current;

    function onMove(e: MouseEvent | TouchEvent) {
      const d = dragRef.current;
      if (!d) return;
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const svg = svgRef.current;
      if (!svg) return;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const r = pt.matrixTransform(ctm.inverse());
      const x = r.x;
      const y = r.y;

      const wasLeft = d.lastX < CX;
      const isLeft = x < CX;
      if (wasLeft !== isLeft) {
        startMorph(d.id);
      }

      d.lastX = x;
      d.svgX = x;
      d.svgY = y;
      setDragState({ id: d.id, svgX: x, svgY: y });
    }

    function onUp() {
      const d = dragRef.current;
      if (!d) return;
      const newSide: Side = d.svgX > CX ? "wurttemberg" : "habsburg";
      sidesRef.current = { ...sidesRef.current, [d.id]: newSide };
      const allDone = (Object.values(sidesRef.current) as Side[]).every((s) => s === "wurttemberg");
      completeRef.current = allDone;
      setSidesState({ ...sidesRef.current });
      setComplete(allDone);
      dragRef.current = null;
      setDragState(null);
    }

    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      (Object.values(rafs) as number[]).forEach((rafId) => cancelAnimationFrame(rafId));
    };
  }, []);

  useEffect(() => {
    window.by_marriage_render_to_text = () => {
      const n = (Object.values(sidesRef.current) as Side[]).filter((s) => s === "wurttemberg").length;
      return `by-marriage:transferred=${n}/4,complete=${completeRef.current}`;
    };
    window.by_marriage_advance = (steps: number) => {
      const n = Math.max(0, Number.isFinite(steps) ? Math.floor(steps) : 0);
      let moved = 0;
      const next = { ...sidesRef.current };
      for (const b of BADGES) {
        if (next[b.id] === "habsburg" && moved < n) {
          next[b.id] = "wurttemberg";
          moved++;
        }
      }
      sidesRef.current = next;
      const allDone = (Object.values(next) as Side[]).every((s) => s === "wurttemberg");
      completeRef.current = allDone;
      setSidesState({ ...next });
      setComplete(allDone);
    };
    return () => {
      delete window.by_marriage_render_to_text;
      delete window.by_marriage_advance;
    };
  }, []);

  // SVG rendering helpers
  function renderLegs(cx: number, cy: number, progress: number) {
    if (progress <= 0) return null;
    return Array.from({ length: LEG_N }, (_, i) => {
      const angle = (i * Math.PI * 2) / LEG_N;
      const kinkAngle = angle + (i % 2 === 0 ? 0.4 : -0.4);
      const kinkDist = LEG_L * 0.5 * progress;
      const tipDist = LEG_L * progress;
      const kx = cx + Math.cos(kinkAngle) * kinkDist;
      const ky = cy + Math.sin(kinkAngle) * kinkDist;
      const tx = cx + Math.cos(angle) * tipDist;
      const ty = cy + Math.sin(angle) * tipDist;
      return (
        <polyline
          key={i}
          points={`${cx.toFixed(2)},${cy.toFixed(2)} ${kx.toFixed(2)},${ky.toFixed(2)} ${tx.toFixed(2)},${ty.toFixed(2)}`}
          stroke={ORANGE}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={progress * 0.9}
        />
      );
    });
  }

  const draggingId = dragState?.id ?? null;
  const nonDragBadges = BADGES.filter((b) => b.id !== draggingId);
  const dragBadge = draggingId ? BADGES.find((b) => b.id === draggingId) : null;

  function badgeElement(badge: (typeof BADGES)[number], index: number) {
    const isDragging = dragState?.id === badge.id;
    const side = sidesState[badge.id];
    const transferred = side === "wurttemberg";

    let bx: number, by: number;
    if (isDragging && dragState) {
      bx = dragState.svgX - BADGE_W / 2;
      by = dragState.svgY - BADGE_H / 2;
    } else {
      bx = slotX(side);
      by = slotY(index);
    }

    const cx = bx + BADGE_W / 2;
    const cy = by + BADGE_H / 2;
    const legs = morphState[badge.id] ?? 0;

    return (
      <g
        key={badge.id}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={(e) => onBadgeDown(e, badge.id)}
        onTouchStart={(e) => onBadgeDown(e, badge.id)}
      >
        {renderLegs(cx, cy, legs)}
        <rect
          x={bx}
          y={by}
          width={BADGE_W}
          height={BADGE_H}
          rx="2"
          fill={transferred && !isDragging ? ORANGE : "#ffffff"}
          stroke={ORANGE}
          strokeWidth={isDragging ? "2" : "1.5"}
        />
        <text
          x={cx}
          y={cy + 4.5}
          textAnchor="middle"
          fontSize="10"
          fontFamily="'Geist Sans', ui-sans-serif, sans-serif"
          fill={transferred && !isDragging ? "#ffffff" : "#1a1a1a"}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {badge.label}
        </text>
      </g>
    );
  }

  return (
    <div className="w-full h-full select-none touch-none" style={{ background: "#ffffff" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        width="100%"
        height="100%"
        style={{ display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={VB} height={VB} fill="#ffffff" />

        {/* Habsburg shield */}
        <path
          d={shieldD(LX - 10, SHIELD_W, SHIELD_Y0, SHIELD_H)}
          fill="none"
          stroke={ORANGE}
          strokeWidth="1"
          opacity={0.3}
        />
        {/* Württemberg shield */}
        <path
          d={shieldD(RX - 10, SHIELD_W, SHIELD_Y0, SHIELD_H)}
          fill="none"
          stroke={ORANGE}
          strokeWidth={complete ? "2" : "1"}
          opacity={complete ? 0.9 : 0.3}
        />

        {/* Column headers */}
        <text
          x={LX + BADGE_W / 2}
          y={34}
          textAnchor="middle"
          fontSize="7"
          fontFamily="'Geist Sans', ui-sans-serif, sans-serif"
          fill="#c0c0c0"
          letterSpacing="1.5"
        >
          HABSBURG-LORRAINE
        </text>
        <text
          x={RX + BADGE_W / 2}
          y={34}
          textAnchor="middle"
          fontSize="7"
          fontFamily="'Geist Sans', ui-sans-serif, sans-serif"
          fill="#c0c0c0"
          letterSpacing="1.5"
        >
          WÜRTTEMBERG
        </text>

        {/* Center transfer line */}
        <line
          x1={CX}
          y1={SHIELD_Y0}
          x2={CX}
          y2={VB - 44}
          stroke={ORANGE}
          strokeWidth="0.8"
          strokeDasharray="4 7"
          opacity={0.2}
        />

        {/* Ghost slots — Württemberg side */}
        {BADGES.map((badge, i) => {
          const placed = sidesState[badge.id] === "wurttemberg" && dragState?.id !== badge.id;
          if (placed) return null;
          return (
            <rect
              key={`ghost-w-${badge.id}`}
              x={RX}
              y={slotY(i)}
              width={BADGE_W}
              height={BADGE_H}
              rx="2"
              fill="none"
              stroke={ORANGE}
              strokeWidth="1"
              strokeDasharray="5 4"
              opacity={0.22}
            />
          );
        })}

        {/* Non-dragged badges first */}
        {nonDragBadges.map((badge) => {
          const i = BADGES.findIndex((b) => b.id === badge.id);
          return badgeElement(badge, i);
        })}

        {/* Dragged badge on top */}
        {dragBadge && badgeElement(dragBadge, BADGES.findIndex((b) => b.id === dragBadge.id))}

        {/* Completion text */}
        {complete && (
          <text
            x={CX}
            y={VB - 18}
            textAnchor="middle"
            fontSize="13"
            fontFamily="'Geist Sans', ui-sans-serif, sans-serif"
            fill={ORANGE}
            letterSpacing="4"
            fontWeight="600"
          >
            DURCH HEIRAT
          </text>
        )}

        {/* Footer */}
        <text
          x={CX}
          y={VB - 5}
          textAnchor="middle"
          fontSize="6.5"
          fontFamily="'Geist Sans', ui-sans-serif, sans-serif"
          fill="#e0e0e0"
          letterSpacing="1"
        >
          LENA HIRSCH · WIEN · 2026
        </text>
      </svg>
    </div>
  );
}
