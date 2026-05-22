"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    platform_rubbing_render_to_text?: () => string;
    platform_rubbing_advance?: (steps: number) => void;
  }
}

const routes = [
  { name: "NOON LOOP", color: "#ffcc00", path: "M 7 72 C 22 26, 43 21, 52 54 S 80 91, 93 35" },
  { name: "CIVIC TEETH", color: "#00d5ff", path: "M 9 24 C 26 68, 41 69, 54 31 S 75 16, 91 77" },
  { name: "PLATFORM 0", color: "#ff3b5c", path: "M 6 48 C 24 42, 34 88, 51 63 S 72 23, 94 52" },
  { name: "LATE SAINT", color: "#42ff6b", path: "M 14 90 C 28 53, 38 37, 51 43 S 77 64, 86 9" },
];

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export default function PlatformRubbing() {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef(false);
  const signalRef = useRef({ x: 50, y: 50 });
  const phaseRef = useRef(0);
  const [signal, setSignal] = useState({ x: 50, y: 50 });
  const [phase, setPhase] = useState(0);

  const tiles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => ({
        left: 6 + ((index * 23) % 86),
        top: 7 + ((index * 37) % 82),
        width: 7 + (index % 5) * 2.2,
        color: routes[index % routes.length].color,
        label: `${String((index * 7) % 99).padStart(2, "0")}`,
      })),
    [],
  );

  useEffect(() => {
    let rafId = 0;

    const step = (boost = 1) => {
      phaseRef.current += 0.018 * boost;
      if (Math.floor(phaseRef.current * 60) % 2 === 0) {
        setPhase(phaseRef.current);
      }
    };

    const loop = () => {
      step();
      rafId = window.requestAnimationFrame(loop);
    };

    window.platform_rubbing_render_to_text = () =>
      `Platform Rubbing | signal:${signalRef.current.x.toFixed(1)},${signalRef.current.y.toFixed(1)} | phase:${phaseRef.current.toFixed(2)}`;

    window.platform_rubbing_advance = (steps: number) => {
      for (let i = 0; i < steps; i += 1) {
        step(2.5);
      }
      setPhase(phaseRef.current);
      setSignal({ ...signalRef.current });
    };

    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
      delete window.platform_rubbing_render_to_text;
      delete window.platform_rubbing_advance;
    };
  }, []);

  const moveSignal = (clientX: number, clientY: number) => {
    const el = surfaceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 5, 95),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 5, 95),
    };
    signalRef.current = next;
    phaseRef.current += 0.2;
    setSignal(next);
    setPhase(phaseRef.current);
  };

  return (
    <div
      ref={surfaceRef}
      className="relative h-full w-full touch-none select-none overflow-hidden bg-[#080b0f]"
      onPointerDown={(event) => {
        dragRef.current = true;
        moveSignal(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (!dragRef.current) return;
        moveSignal(event.clientX, event.clientY);
      }}
      onPointerUp={() => {
        dragRef.current = false;
      }}
      onPointerCancel={() => {
        dragRef.current = false;
      }}
      onPointerLeave={() => {
        dragRef.current = false;
      }}
      aria-label="A metallic transit map with a signal puck that reroutes the board when dragged."
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,213,255,0.14), transparent 31%), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 18px), linear-gradient(135deg, #10151b, #050608)",
        }}
      />

      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="img" aria-hidden>
        <rect x="4" y="4" width="92" height="92" fill="none" stroke="#d7dde6" strokeWidth="1.2" opacity="0.34" />
        <rect x="8" y="8" width="84" height="84" fill="none" stroke="#3b4554" strokeWidth="0.7" />
        {routes.map((route, index) => {
          const intensity = 0.48 + Math.sin(phase * 2.2 + index + signal.x * 0.03) * 0.16;
          return (
            <g key={route.name}>
              <path d={route.path} fill="none" stroke="#030407" strokeWidth="8.5" strokeLinecap="round" />
              <path
                d={route.path}
                fill="none"
                stroke={route.color}
                strokeWidth={3.4 + intensity * 1.4}
                strokeLinecap="round"
                strokeDasharray={`${8 + index * 2} ${6 + index}`}
                strokeDashoffset={-(phase * 42 + index * 7)}
                opacity={0.76 + intensity * 0.2}
              />
            </g>
          );
        })}
        <circle cx={signal.x} cy={signal.y} r="9.5" fill="#f4f7fb" opacity="0.92" />
        <circle cx={signal.x} cy={signal.y} r="6.2" fill="#ff3b5c" />
        <circle cx={signal.x} cy={signal.y} r="13.5" fill="none" stroke="#ffcc00" strokeWidth="1.4" strokeDasharray="2 2" />
      </svg>

      {tiles.map((tile, index) => {
        const dx = tile.left - signal.x;
        const dy = tile.top - signal.y;
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / 52);
        return (
          <div
            key={`${tile.label}-${index}`}
            className="absolute flex items-center justify-center border border-white/20 bg-[#111821] font-mono text-[clamp(0.46rem,1.5vw,0.78rem)] font-black text-white shadow-[0_0_18px_rgba(0,0,0,0.55)]"
            style={{
              left: `${tile.left}%`,
              top: `${tile.top}%`,
              width: `${tile.width}%`,
              height: "5.4%",
              color: near > 0.4 ? "#050608" : "#eef3f8",
              background: near > 0.4 ? tile.color : "#111821",
              transform: `translate(-50%, -50%) rotate(${Math.sin(phase + index) * 9 + near * 15}deg) scale(${1 + near * 0.18})`,
              boxShadow: near > 0.4 ? `0 0 ${16 + near * 32}px ${tile.color}` : "0 0 18px rgba(0,0,0,0.55)",
              zIndex: near > 0.4 ? 5 : 2,
            }}
          >
            {tile.label}
          </div>
        );
      })}

      <div className="absolute left-[5%] right-[5%] top-[5%] grid grid-cols-4 gap-[1.5%]">
        {routes.map((route, index) => (
          <div
            key={route.name}
            className="truncate border border-white/20 bg-[#030407] px-[3%] py-[4%] text-center font-mono text-[clamp(0.44rem,1.4vw,0.76rem)] font-black uppercase"
            style={{
              color: route.color,
              transform: `translateY(${Math.sin(phase * 1.8 + index) * 5}px)`,
            }}
          >
            {route.name}
          </div>
        ))}
      </div>
    </div>
  );
}
