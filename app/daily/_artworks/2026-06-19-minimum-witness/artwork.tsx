"use client";

import { useReducer, useRef, useEffect, useState, useCallback } from "react";

// DFA over {A, B} recognizing strings containing both A and B
// State complexity: 4 states minimum (Myhill-Nerode theorem)
// q0: INITIAL   — seen nothing
// q1: SAW A     — seen A but not B
// q2: SAW B     — seen B but not A
// q3: ACCEPTED  — seen both A and B
const TRANSITIONS = [
  [1, 2], // q0: A->q1, B->q2
  [1, 3], // q1: A->q1 (jam), B->q3
  [3, 2], // q2: A->q3, B->q2 (jam)
  [3, 3], // q3: A->q3 (jam), B->q3 (jam)
] as const;

const ACCEPTING = [false, false, false, true] as const;
const STATE_LABEL_SUB = ["\u2080", "\u2081", "\u2082", "\u2083"] as const;
const STATE_NAME = ["INITIAL", "SAW  A", "SAW  B", "ACCEPTED"] as const;

type S = 0 | 1 | 2 | 3;
type MachineState = { current: S; tape: string; steps: number };
type Action = { sym: 0 | 1 } | { reset: true };

function reduce(state: MachineState, action: Action): MachineState {
  if ("reset" in action) return { current: 0, tape: "", steps: 0 };
  const next = TRANSITIONS[state.current][action.sym] as S;
  return {
    current: next,
    tape: (state.tape + (action.sym === 0 ? "A" : "B")).slice(-22),
    steps: state.steps + 1,
  };
}

const INIT: MachineState = { current: 0, tape: "", steps: 0 };

declare global {
  interface Window {
    minimum_witness_render_to_text?: () => string;
    minimum_witness_advance?: (steps: number) => void;
  }
}

export default function MinimumWitness() {
  const [machine, dispatch] = useReducer(reduce, INIT);
  const [jamCell, setJamCell] = useState<S | null>(null);
  const jamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const machineRef = useRef<MachineState>(INIT);

  useEffect(() => {
    machineRef.current = machine;
  });

  const press = useCallback((sym: 0 | 1) => {
    const { current } = machineRef.current;
    const next = TRANSITIONS[current][sym] as S;
    dispatch({ sym });
    if (next === current) {
      if (jamTimerRef.current) clearTimeout(jamTimerRef.current);
      setJamCell(next);
      jamTimerRef.current = setTimeout(() => setJamCell(null), 400);
    } else {
      setJamCell(null);
    }
  }, []);

  useEffect(() => {
    window.minimum_witness_render_to_text = () => {
      const { current, tape, steps } = machineRef.current;
      return `MinimumWitness | q=q${current} ${STATE_NAME[current].trim()} | tape="${tape}" | steps=${steps} | accepted=${ACCEPTING[current]}`;
    };
    window.minimum_witness_advance = (n: number) => {
      for (let i = 0; i < n; i++) {
        dispatch({ sym: (i % 2 === 0 ? 0 : 1) as 0 | 1 });
      }
    };
    return () => {
      delete window.minimum_witness_render_to_text;
      delete window.minimum_witness_advance;
      if (jamTimerRef.current) clearTimeout(jamTimerRef.current);
    };
  }, []);

  const { current, tape } = machine;

  return (
    <div
      className="h-full w-full flex flex-col font-mono select-none overflow-hidden"
      style={{ background: "#f5f0e8" }}
    >
      <div
        className="flex items-baseline justify-between shrink-0"
        style={{
          padding: "clamp(5px,1.4vw,11px) clamp(8px,2.5vw,18px)",
          borderBottom: "1.5px solid #2a2016",
        }}
      >
        <span
          className="uppercase tracking-[0.18em] leading-none"
          style={{ fontSize: "clamp(7px,1.5vw,11px)", color: "#5a4d34" }}
        >
          Minimum Witness
        </span>
        <span
          className="uppercase tracking-[0.18em] font-bold leading-none"
          style={{
            fontSize: "clamp(7px,1.5vw,11px)",
            color: ACCEPTING[current] ? "#c4a020" : "#2a2016",
          }}
        >
          {ACCEPTING[current] ? "ACCEPTED" : `q${current} RUNNING`}
        </span>
      </div>

      <div
        className="grid grid-cols-2 flex-1 min-h-0"
        style={{ gap: "1.5px", padding: "1.5px", background: "#2a2016" }}
      >
        {([0, 1, 2, 3] as const).map((s) => {
          const isActive = current === s;
          const isJamming = jamCell === s;
          const isAccept = ACCEPTING[s];

          return (
            <div
              key={s}
              className={`flex flex-col justify-between overflow-hidden${isJamming ? " wws-machine-jam" : ""}`}
              style={{
                padding: "clamp(6px,2vw,16px)",
                background: isActive ? "#2a2016" : "#f5f0e8",
                color: isActive ? "#f5f0e8" : "#2a2016",
              }}
            >
              <div className="flex items-start justify-between">
                <span
                  className="leading-none tracking-tight font-bold"
                  style={{ fontSize: "clamp(24px,6.5vw,54px)" }}
                >
                  {"q"}
                  <span style={{ fontSize: "clamp(16px,4.5vw,38px)" }}>
                    {STATE_LABEL_SUB[s]}
                  </span>
                </span>
                {isAccept && (
                  <span
                    className="leading-none"
                    style={{
                      fontSize: "clamp(11px,2.8vw,22px)",
                      marginTop: "0.1em",
                      color: isActive ? "#c4a020" : "#8a7040",
                    }}
                  >
                    {"○"}
                  </span>
                )}
              </div>
              <div>
                <div
                  className="uppercase tracking-[0.18em] leading-none"
                  style={{
                    fontSize: "clamp(6px,1.1vw,9px)",
                    color: isActive ? "#c4a020" : "#8a7040",
                    minHeight: "1.3em",
                    marginBottom: "0.35em",
                  }}
                >
                  {isActive ? "current" : ""}
                </div>
                <div
                  className="uppercase tracking-[0.15em] leading-tight"
                  style={{ fontSize: "clamp(7px,1.6vw,12px)" }}
                >
                  {STATE_NAME[s]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="shrink-0 overflow-hidden"
        style={{ borderTop: "1.5px solid #2a2016" }}
      >
        <div
          className="flex items-center overflow-hidden"
          style={{
            gap: "clamp(1px,0.4vw,3px)",
            padding: "clamp(3px,0.8vw,6px) clamp(6px,1.5vw,12px)",
          }}
        >
          {tape.length === 0 ? (
            <span
              className="uppercase tracking-[0.18em]"
              style={{ fontSize: "clamp(6px,1.2vw,9px)", color: "#8a7040" }}
            >
              no input
            </span>
          ) : (
            tape.split("").map((ch, i) => (
              <span
                key={i}
                className="leading-none font-bold"
                style={{
                  fontSize: "clamp(8px,1.6vw,12px)",
                  color: i === tape.length - 1 ? "#2a2016" : "#b09a6a",
                }}
              >
                {ch}
              </span>
            ))
          )}
        </div>
      </div>

      <div
        className="shrink-0 flex"
        style={{ borderTop: "1.5px solid #2a2016" }}
      >
        {(["A", "B"] as const).map((sym, i) => (
          <button
            key={sym}
            onClick={() => press(i as 0 | 1)}
            className="flex-1 font-bold leading-none"
            style={{
              padding: "clamp(8px,2.5vw,20px) 0",
              fontSize: "clamp(16px,5vw,38px)",
              letterSpacing: "0.05em",
              borderRight: "1.5px solid #2a2016",
              background: "#f5f0e8",
              color: "#2a2016",
              transition: "background 80ms, color 80ms",
            }}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#2a2016";
              (e.currentTarget as HTMLButtonElement).style.color = "#c4a020";
            }}
            onPointerUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f5f0e8";
              (e.currentTarget as HTMLButtonElement).style.color = "#2a2016";
            }}
            onPointerLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f5f0e8";
              (e.currentTarget as HTMLButtonElement).style.color = "#2a2016";
            }}
            aria-label={`Send symbol ${sym} to the automaton`}
          >
            {sym}
          </button>
        ))}
        <button
          onClick={() => dispatch({ reset: true })}
          className="flex-1 font-bold leading-none uppercase"
          style={{
            padding: "clamp(8px,2.5vw,20px) 0",
            fontSize: "clamp(7px,1.4vw,10px)",
            letterSpacing: "0.18em",
            background: "#f5f0e8",
            color: "#8a7040",
            transition: "background 80ms, color 80ms",
          }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#e8e0d0";
            (e.currentTarget as HTMLButtonElement).style.color = "#2a2016";
          }}
          onPointerUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#f5f0e8";
            (e.currentTarget as HTMLButtonElement).style.color = "#8a7040";
          }}
          onPointerLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#f5f0e8";
            (e.currentTarget as HTMLButtonElement).style.color = "#8a7040";
          }}
          aria-label="Reset the automaton to its initial state"
        >
          reset
        </button>
      </div>
    </div>
  );
}
