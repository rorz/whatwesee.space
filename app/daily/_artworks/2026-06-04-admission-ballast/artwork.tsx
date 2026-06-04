"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    admission_ballast_render_to_text?: () => string;
    admission_ballast_advance?: (steps: number) => void;
  }
}

const LANE_Y = [35, 41, 47, 53, 59, 65] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function AdmissionBallast() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tracingRef = useRef(false);

  const [laneProgress, setLaneProgress] = useState(() => LANE_Y.map(() => 0));
  const [phase, setPhase] = useState(0);

  const progressRef = useRef(laneProgress);
  useEffect(() => {
    progressRef.current = laneProgress;
  }, [laneProgress]);

  const admittedRows = useMemo(() => laneProgress.filter((value) => value >= 0.999).length, [laneProgress]);
  const spillLevel = useMemo(
    () => laneProgress.reduce((sum, value, index) => sum + value * (index + 1), 0) / 12,
    [laneProgress],
  );

  const warningCode = (admittedRows * 17 + phase * 3) % 100;

  const updateFromPointer = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    if (x < 0.18 || x > 0.82 || y < 0.18 || y > 0.8) {
      return;
    }

    const next = [...progressRef.current];
    let changed = false;

    LANE_Y.forEach((lane, index) => {
      const laneY = lane / 100;
      if (Math.abs(y - laneY) > 0.045) return;
      const normalized = clamp((x - 0.22) / 0.56, 0, 1);
      if (normalized > next[index]) {
        next[index] = normalized;
        changed = true;
      }
    });

    if (changed) {
      setLaneProgress(next);
    }
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    tracingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX, event.clientY);
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!tracingRef.current) return;
    updateFromPointer(event.clientX, event.clientY);
  };

  const onPointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    tracingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  useEffect(() => {
    window.admission_ballast_render_to_text = () =>
      `admission-ballast|rows:${admittedRows}|spill:${spillLevel.toFixed(2)}|warning:${warningCode.toString().padStart(2, "0")}`;

    window.admission_ballast_advance = (steps: number) => {
      const safe = Math.max(0, Math.floor(steps));
      if (safe === 0) return;
      setPhase((value) => value + safe);
    };

    return () => {
      delete window.admission_ballast_render_to_text;
      delete window.admission_ballast_advance;
    };
  }, [admittedRows, spillLevel, warningCode]);

  return (
    <div
      className="grid h-full w-full grid-rows-[auto_1fr_auto] overflow-hidden border-4 border-[#11408f] bg-[#d9e4ef] text-[#13253f]"
      style={{ fontFamily: "var(--font-geist-mono), monospace", touchAction: "none" }}
    >
      <header className="flex items-center justify-between border-b-2 border-[#11408f] bg-[#1f5fc6] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#e7f1ff]">
        <span>Emergency Broadcast • Homeroom Admission</span>
        <span>WARD {warningCode.toString().padStart(2, "0")}</span>
      </header>

      <div className="relative overflow-hidden bg-[#d9e4ef] p-2">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="h-full w-full"
          role="img"
          aria-label="School bell with traceable ballast seams"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ cursor: "crosshair" }}
        >
          <rect x="0" y="0" width="100" height="100" fill="#d9e4ef" />
          {[12, 24, 36, 48, 60, 72, 84].map((x) => (
            <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#b4c8de" strokeWidth="0.8" />
          ))}
          {[18, 30, 42, 54, 66, 78, 90].map((y) => (
            <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#b4c8de" strokeWidth="0.8" />
          ))}

          <g transform={`rotate(${Math.sin(phase * 0.2) * 2.2} 50 60)`}>
            <path d="M22 23 Q50 8 78 23 L72 75 Q50 90 28 75 Z" fill="#3f6db5" stroke="#0d2b67" strokeWidth="1.6" />
            <path d="M28 75 Q50 86 72 75 L77 80 Q50 97 23 80 Z" fill="#2a4d8f" stroke="#0d2b67" strokeWidth="1.2" />
            <circle cx="50" cy="79" r="4.6" fill="#f0c035" stroke="#8f6111" strokeWidth="1" />

            {LANE_Y.map((lane, index) => {
              const progress = laneProgress[index] ?? 0;
              const endX = 24 + 52 * progress;
              return (
                <g key={lane}>
                  <line x1="24" y1={lane} x2="76" y2={lane} stroke="#15346a" strokeWidth="1.4" opacity="0.35" />
                  <line x1="24" y1={lane} x2={endX} y2={lane} stroke="#3ff0cc" strokeWidth="2.2" strokeLinecap="round" />
                  {progress >= 0.999 && <circle cx="79" cy={lane} r="1.7" fill="#ffe56a" stroke="#a26f00" strokeWidth="0.6" />}
                </g>
              );
            })}
          </g>

          {laneProgress.map((progress, index) => (
            <circle
              key={`spill-${LANE_Y[index]}`}
              cx={25 + (index % 3) * 18 + ((phase + index * 7) % 5)}
              cy={84 + (index % 2) * 4 + Math.max(0, (1 - progress) * 5)}
              r={1.2 + progress * 1.7}
              fill={progress > 0.5 ? "#ffcd31" : "#8fb6ea"}
              opacity={0.8}
            />
          ))}

          <text x="10" y="11" fill="#19407f" fontSize="4" letterSpacing="0.6">
            THEY&#39;RE MADE OUT OF WEIGHTS
          </text>
        </svg>
      </div>

      <footer className="grid grid-cols-2 gap-2 border-t-2 border-[#11408f] bg-[#bdd0e6] px-2 py-2 text-[10px] uppercase tracking-[0.08em]">
        <div className="border border-[#1e4f99] bg-[#dfeaf8] px-2 py-1">Rows admitted: {admittedRows}/6</div>
        <div className="border border-[#1e4f99] bg-[#dfeaf8] px-2 py-1">Spill index: {spillLevel.toFixed(2)}</div>
      </footer>
    </div>
  );
}
