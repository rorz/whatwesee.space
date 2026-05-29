"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    storm_loom_tribunal_render_to_text?: () => string;
    storm_loom_tribunal_advance?: (steps: number) => void;
  }
}

type TracePoint = {
  x: number;
  y: number;
};

type TracePath = {
  id: number;
  points: TracePoint[];
};

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

function pointerToPoint(event: React.PointerEvent<HTMLDivElement>): TracePoint {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
}

export default function StormLoomTribunal() {
  const [paths, setPaths] = useState<TracePath[]>([]);
  const [activePath, setActivePath] = useState<TracePath | null>(null);
  const [pulse, setPulse] = useState(0);
  const [verdictCount, setVerdictCount] = useState(0);

  const pathsRef = useRef<TracePath[]>([]);
  const pulseRef = useRef(0);
  const verdictRef = useRef(0);
  const pathIdRef = useRef(0);

  useEffect(() => {
    pathsRef.current = paths;
  }, [paths]);

  useEffect(() => {
    pulseRef.current = pulse;
  }, [pulse]);

  useEffect(() => {
    verdictRef.current = verdictCount;
  }, [verdictCount]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPulse((current) => (current + 1) % 480);
    }, 70);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    window.storm_loom_tribunal_render_to_text = () => {
      const stitches = pathsRef.current.reduce((sum, path) => sum + path.points.length, 0);
      return `Storm Loom Tribunal | traces:${pathsRef.current.length} | stitches:${stitches} | verdicts:${verdictRef.current} | pulse:${pulseRef.current}`;
    };

    window.storm_loom_tribunal_advance = (steps: number) => {
      const delta = Math.max(0, Math.floor(steps));
      setPulse((current) => {
        const next = (current + delta) % 480;
        pulseRef.current = next;
        return next;
      });
    };

    return () => {
      delete window.storm_loom_tribunal_render_to_text;
      delete window.storm_loom_tribunal_advance;
    };
  }, []);

  const stitchCount = useMemo(() => {
    return paths.reduce((sum, path) => sum + path.points.length, 0) + (activePath?.points.length ?? 0);
  }, [activePath, paths]);

  const stormPressure = Math.min(99, Math.floor(stitchCount / 3) + verdictCount * 12);

  const finalizePath = () => {
    if (!activePath || activePath.points.length < 2) {
      setActivePath(null);
      return;
    }

    setPaths((current) => [...current.slice(-17), activePath]);
    setActivePath(null);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerToPoint(event);
    pathIdRef.current += 1;
    setActivePath({ id: pathIdRef.current, points: [point] });
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activePath) {
      return;
    }

    const point = pointerToPoint(event);
    setActivePath((current) => {
      if (!current) {
        return current;
      }
      const previous = current.points[current.points.length - 1];
      const dx = previous.x - point.x;
      const dy = previous.y - point.y;
      if (dx * dx + dy * dy < 3.2) {
        return current;
      }
      return { ...current, points: [...current.points.slice(-45), point] };
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finalizePath();
  };

  const onConvictStorm = () => {
    if (stitchCount < 9) {
      return;
    }

    setVerdictCount((count) => count + 1);
    setPaths((current) => current.slice(-12));
  };

  return (
    <div className="h-full w-full bg-[#130e1e] p-2 text-[#f6ff95] sm:p-3">
      <div className="grid h-full w-full grid-cols-[1.22fr_0.78fr] gap-2 rounded-[0.9rem] border border-[#d5ff00]/55 bg-[#09060f] p-2 sm:gap-3 sm:p-3">
        <div
          className="relative overflow-hidden rounded-[0.7rem] border border-[#d5ff00]/70 bg-[#1a1330]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="img"
          aria-label="A fluorescent textile loom where traced seams feed a severe weather tribunal"
        >
          <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="storm-loom-warp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ccff00" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#7cb300" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#1a1330" />
            {Array.from({ length: 15 }).map((_, index) => {
              const x = 6 + index * 6.3;
              const jitter = Math.sin((pulse + index * 12) / 20) * 0.8;
              return <line key={`warp-${x}`} x1={x} y1="0" x2={x + jitter} y2="100" stroke="url(#storm-loom-warp)" strokeWidth="0.85" opacity="0.66" />;
            })}
            {Array.from({ length: 11 }).map((_, index) => {
              const y = 10 + index * 8;
              const boil = Math.sin((pulse + index * 18) / 22) * 1.2;
              return <line key={`weft-${y}`} x1="0" y1={y + boil} x2="100" y2={y - boil * 0.5} stroke="#c2ff48" strokeWidth="0.62" opacity="0.45" />;
            })}

            {paths.map((path) => (
              <polyline
                key={path.id}
                points={path.points.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="none"
                stroke="#f7ff9f"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {activePath ? (
              <polyline
                points={activePath.points.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            <rect x="2.5" y="2.5" width="95" height="95" fill="none" stroke="#d5ff00" strokeWidth="0.7" opacity="0.8" />
            <text x="5" y="9" fill="#efff83" fontSize="3.3" letterSpacing="0.28" fontFamily="var(--font-geist-mono), monospace">
              TRACE THE STORM SEAMS
            </text>
          </svg>
        </div>

        <div className="flex min-h-0 flex-col gap-2 rounded-[0.7rem] border border-[#d5ff00]/60 bg-[#130f24] p-2 font-mono text-[10px] tracking-[0.08em] sm:p-3 sm:text-[11px]">
          <div className="border border-[#d5ff00]/50 bg-[#09070f] p-2 uppercase text-[#f7ff9f]">
            <div className="flex items-center justify-between">
              <span>weather console</span>
              <span>{String(verdictCount).padStart(2, "0")}</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden bg-[#241a3f]">
              <div className="h-full bg-[#d5ff00] transition-[width] duration-200" style={{ width: `${stormPressure}%` }} />
            </div>
            <div className="mt-1 text-[9px] text-[#deef88]">pressure {String(stormPressure).padStart(2, "0")}/99</div>
          </div>

          <button
            type="button"
            onClick={onConvictStorm}
            className="border border-[#d5ff00] bg-[#e1ff00] px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1a1028] transition hover:bg-[#f0ff6a] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={stitchCount < 9}
          >
            convict storm
          </button>

          <div className="flex-1 border border-[#bde54f]/40 bg-[#0d0b18] p-2 text-[#d9ee8f]">
            <div>trace count: {String(paths.length + (activePath ? 1 : 0)).padStart(2, "0")}</div>
            <div>stitches: {String(stitchCount).padStart(3, "0")}</div>
            <div>button lock: {stitchCount < 9 ? "collect evidence" : "ready"}</div>
            <div className="mt-2 h-[40%] min-h-12 bg-[#21163c] p-1">
              <div
                className="h-full w-full bg-[repeating-linear-gradient(180deg,#e7ff5d_0px,#e7ff5d_2px,transparent_2px,transparent_5px)]"
                style={{ transform: `translateY(${(pulse % 18) - 9}px)`, opacity: 0.3 + Math.min(0.64, verdictCount * 0.1) }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
