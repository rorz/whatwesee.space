"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    injunction_ribbon_render_to_text?: () => string;
    injunction_ribbon_advance?: (steps: number) => void;
  }
}

type Checkpoint = {
  id: string;
  label: string;
  x: number;
  y: number;
};

const checkpoints: Checkpoint[] = [
  { id: "dawn-filing", label: "DAWN FILING", x: 12, y: 74 },
  { id: "noon-objection", label: "NOON OBJECTION", x: 33, y: 42 },
  { id: "dusk-appeal", label: "DUSK APPEAL", x: 57, y: 62 },
  { id: "night-order", label: "NIGHT ORDER", x: 82, y: 31 },
];

const nodeRadius = 3.8;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointDistance(leftX: number, leftY: number, rightX: number, rightY: number) {
  const dx = leftX - rightX;
  const dy = leftY - rightY;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function InjunctionRibbon() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const traceRef = useRef<Array<{ x: number; y: number }>>([]);
  const armedRef = useRef(false);
  const stageRef = useRef(0);
  const pulseRef = useRef(0);
  const rafRef = useRef(0);
  const tracingRef = useRef(false);

  const [trace, setTrace] = useState<Array<{ x: number; y: number }>>([]);
  const [stage, setStage] = useState(0);
  const [armed, setArmed] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    traceRef.current = trace;
  }, [trace]);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    armedRef.current = armed;
  }, [armed]);

  useEffect(() => {
    pulseRef.current = pulse;
  }, [pulse]);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver(() => {
      node.style.setProperty("--injunction-ribbon-size", `${Math.round(node.clientWidth)}px`);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const tick = () => {
      if (!mounted) {
        return;
      }
      setPulse((value) => (value + 1) % 360);
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      mounted = false;
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    window.injunction_ribbon_render_to_text = () => {
      const state = armedRef.current ? "sealed" : stageRef.current >= checkpoints.length ? "armed" : "tracing";
      return `Injunction Ribbon | state:${state} | stage:${stageRef.current}/${checkpoints.length} | points:${traceRef.current.length} | pulse:${pulseRef.current}`;
    };

    window.injunction_ribbon_advance = (steps: number) => {
      const delta = Math.max(0, Math.floor(steps));
      setPulse((value) => {
        const next = (value + delta) % 360;
        pulseRef.current = next;
        return next;
      });
    };

    return () => {
      delete window.injunction_ribbon_render_to_text;
      delete window.injunction_ribbon_advance;
    };
  }, []);

  const activeCheckpoint = stage < checkpoints.length ? checkpoints[stage] : null;
  const traceString = useMemo(() => trace.map((point) => `${point.x},${point.y}`).join(" "), [trace]);

  const toLocalPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    return { x, y };
  };

  const appendPoint = (point: { x: number; y: number }) => {
    setTrace((current) => {
      const next = [...current, point];
      return next.slice(-260);
    });

    if (!activeCheckpoint) {
      return;
    }

    if (pointDistance(point.x, point.y, activeCheckpoint.x, activeCheckpoint.y) <= nodeRadius + 1.1) {
      setStage((current) => Math.min(checkpoints.length, current + 1));
    }
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    tracingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    appendPoint(toLocalPoint(event));
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!tracingRef.current || armed) {
      return;
    }
    appendPoint(toLocalPoint(event));
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    tracingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const armButtonReady = stage >= checkpoints.length && !armed;

  const handleConsequence = () => {
    if (armButtonReady) {
      setArmed(true);
      return;
    }

    setArmed(false);
    setStage(0);
    setTrace([]);
  };

  return (
    <div ref={wrapperRef} className="relative grid h-full w-full grid-cols-[1fr_auto] overflow-hidden bg-[#08080a] text-[#dfffea]">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        role="img"
        aria-label="A fluorescent textile timeline where visitors trace a legal weather route before sealing the order"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <rect width="100" height="100" fill="#08080a" />
        <rect x="3" y="5" width="82" height="90" rx="3" fill="#0d1017" stroke="#1eff9a" strokeWidth="0.8" />

        {[14, 28, 42, 56, 70].map((x) => (
          <line key={x} x1={x} y1={10} x2={x} y2={90} stroke="#164a39" strokeWidth="0.4" />
        ))}

        {checkpoints.slice(0, -1).map((checkpoint, index) => {
          const next = checkpoints[index + 1];
          const glow = 0.6 + Math.sin((pulse + index * 55) / 24) * 0.18;
          return (
            <line
              key={`${checkpoint.id}-${next.id}`}
              x1={checkpoint.x}
              y1={checkpoint.y}
              x2={next.x}
              y2={next.y}
              stroke="#ff3fd1"
              strokeWidth={2.2}
              opacity={glow}
              strokeLinecap="round"
            />
          );
        })}

        {trace.length > 1 && <polyline points={traceString} fill="none" stroke="#19f0ff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />}

        {checkpoints.map((checkpoint, index) => {
          const reached = stage > index || armed;
          const isTarget = stage === index && !armed;
          return (
            <g key={checkpoint.id}>
              <circle
                cx={checkpoint.x}
                cy={checkpoint.y}
                r={isTarget ? nodeRadius + 0.9 : nodeRadius}
                fill={reached ? "#1eff9a" : "#1f2736"}
                stroke={isTarget ? "#fff869" : "#98a2b8"}
                strokeWidth={0.6}
              />
              <text
                x={checkpoint.x + 2.2}
                y={checkpoint.y - 4.6}
                fill="#d6e1ff"
                fontSize="2"
                letterSpacing="0.2"
                fontFamily="var(--font-geist-mono), monospace"
              >
                {checkpoint.label}
              </text>
            </g>
          );
        })}

        <text x="7" y="14" fill="#f7ff8f" fontSize="3.2" letterSpacing="0.48" fontFamily="var(--font-geist-mono), monospace">
          WEATHER INJUNCTION TIMELINE
        </text>
        <text x="7" y="19" fill="#9cfad8" fontSize="2.1" letterSpacing="0.24" fontFamily="var(--font-geist-mono), monospace">
          TRACE EVERY CHECKPOINT BEFORE THE CITY SIGNS
        </text>
      </svg>

      <div className="flex h-full w-[145px] flex-col border-l border-[#1eff9a]/40 bg-[#0b121d] p-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#dfffea]">
        <div className="mb-2 border border-[#1eff9a]/55 bg-[#112131] px-2 py-1 text-[9px]">
          console: weather legal
        </div>

        <div className="space-y-1 border border-[#22475f] bg-[#0e1a28] p-2 text-[9px]">
          <div>stage {String(Math.min(stage, checkpoints.length)).padStart(2, "0")}/04</div>
          <div>trace pts {String(trace.length).padStart(3, "0")}</div>
          <div>status {armed ? "SEALED" : armButtonReady ? "ARMED" : "TRACE"}</div>
        </div>

        <div className="mt-2 border border-[#ff3fd1]/60 bg-[#271027] p-2 text-[9px] text-[#ffd7f4]">
          caution lamp
          <div
            className="mt-1 h-4 w-full rounded-full"
            style={{
              background: armButtonReady || armed ? "#fff869" : "#402b44",
              boxShadow: armButtonReady || armed ? "0 0 12px #fff869" : "none",
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleConsequence}
          className="mt-auto border border-[#fff869] bg-[#4a1017] px-2 py-3 text-[10px] font-bold tracking-[0.2em] text-[#fff4d1] transition hover:bg-[#651721]"
        >
          {armButtonReady ? "SEAL ORDER" : armed ? "RESET ORDER" : "NOT READY"}
        </button>
      </div>
    </div>
  );
}
