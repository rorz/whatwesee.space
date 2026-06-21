"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";

declare global {
  interface Window {
    circulation_seam_render_to_text?: () => string;
    circulation_seam_advance?: (steps: number) => void;
  }
}

const SLOT_COUNT = 12;
const BASE_DECAY = 6;
const MAX_INTEGRITY = 100;

type State = {
  stitches: ReadonlyArray<boolean>;
  integrity: number;
  breath: number;
  cycles: number;
};

type Action =
  | { type: "PLANT"; slot: number }
  | { type: "TICK"; steps: number }
  | { type: "RESET" };

const INIT: State = {
  stitches: new Array(SLOT_COUNT).fill(false),
  integrity: 68,
  breath: 0,
  cycles: 0,
};

function countStitches(stitches: ReadonlyArray<boolean>): number {
  return stitches.reduce((sum, value) => sum + (value ? 1 : 0), 0);
}

function reduce(state: State, action: Action): State {
  if (action.type === "RESET") {
    return INIT;
  }

  if (action.type === "PLANT") {
    if (state.integrity <= 0 || state.stitches[action.slot]) {
      return state;
    }
    const stitches = [...state.stitches];
    stitches[action.slot] = true;
    const boost = 8;
    return {
      ...state,
      stitches,
      integrity: Math.min(MAX_INTEGRITY, state.integrity + boost),
    };
  }

  const steps = Math.max(0, action.steps);
  if (steps === 0) return state;

  let next = state;
  for (let i = 0; i < steps; i++) {
    const planted = countStitches(next.stitches);
    const decay = Math.max(1, BASE_DECAY - Math.floor(planted / 2));
    next = {
      ...next,
      integrity: Math.max(0, next.integrity - decay),
      breath: (next.breath + 1) % 8,
      cycles: next.cycles + 1,
    };
  }
  return next;
}

export default function CirculationSeam() {
  const [state, dispatch] = useReducer(reduce, INIT);
  const stateRef = useRef<State>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      dispatch({ type: "TICK", steps: 1 });
    }, 900);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    window.circulation_seam_render_to_text = () => {
      const current = stateRef.current;
      const planted = countStitches(current.stitches);
      const status = current.integrity > 0 ? "holding" : "ruptured";
      return `stitches=${planted}/${SLOT_COUNT} integrity=${current.integrity} cycles=${current.cycles} status=${status}`;
    };

    window.circulation_seam_advance = (steps: number) => {
      const n = Math.max(0, Math.floor(Number.isFinite(steps) ? steps : 0));
      dispatch({ type: "TICK", steps: n });
    };

    return () => {
      delete window.circulation_seam_render_to_text;
      delete window.circulation_seam_advance;
    };
  }, []);

  const planted = useMemo(() => countStitches(state.stitches), [state.stitches]);
  const lossRate = Math.max(1, BASE_DECAY - Math.floor(planted / 2));
  const seamScale = 1 + (state.breath / 7) * 0.22;
  const ruptured = state.integrity <= 0;

  return (
    <div
      className="h-full w-full"
      style={{
        background: "#f8f7f3",
        color: "#18181b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(10px, 2.4vw, 20px)",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          width: "min(100%, 560px)",
          height: "100%",
          border: "2px solid #18181b",
          background: "#ffffff",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "clamp(8px, 1.5vw, 12px)",
            borderBottom: "2px solid #18181b",
            fontSize: "clamp(9px, 1.8vw, 12px)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <span>loan card specimen</span>
          <span>{ruptured ? "void" : "active"}</span>
        </div>

        <div style={{ padding: "clamp(8px, 2vw, 16px)", display: "grid", gap: "clamp(8px, 1.8vw, 14px)" }}>
          <div style={{ display: "grid", gap: "6px" }}>
            <div style={{ fontSize: "clamp(9px, 1.9vw, 12px)" }}>integrity meter</div>
            <div style={{ border: "1px solid #18181b", height: "22px", position: "relative", background: "#f4f4f5" }}>
              <div
                style={{
                  width: `${state.integrity}%`,
                  height: "100%",
                  background: state.integrity < 35 ? "#be1e2d" : "#18181b",
                  transition: "width 140ms linear",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: "6px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "11px",
                  color: state.integrity < 35 ? "#ffffff" : "#18181b",
                }}
              >
                {state.integrity}
              </div>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #18181b",
              padding: "clamp(8px, 1.6vw, 12px)",
              display: "grid",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "clamp(9px, 1.7vw, 12px)" }}>
              <span>circulation seam</span>
              <span>loss {lossRate}/cycle</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${SLOT_COUNT}, minmax(0, 1fr))`,
                gap: "4px",
                alignItems: "center",
              }}
            >
              {state.stitches.map((isPlanted, slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => dispatch({ type: "PLANT", slot })}
                  disabled={isPlanted || ruptured}
                  aria-label={isPlanted ? `stitch ${slot + 1} planted` : `plant stitch ${slot + 1}`}
                  style={{
                    height: "clamp(16px, 3vw, 24px)",
                    border: "1px solid #18181b",
                    background: isPlanted ? "#18181b" : "#ffffff",
                    color: isPlanted ? "#ffffff" : "#18181b",
                    fontSize: "11px",
                    cursor: isPlanted || ruptured ? "default" : "pointer",
                    transform: isPlanted ? `scaleY(${seamScale})` : "scaleY(1)",
                    transition: "transform 180ms linear",
                  }}
                >
                  {isPlanted ? "x" : "·"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  const slot = state.stitches.findIndex((value) => !value);
                  if (slot >= 0) dispatch({ type: "PLANT", slot });
                }}
                disabled={ruptured || planted >= SLOT_COUNT}
                style={{
                  border: "1px solid #18181b",
                  background: "#ffffff",
                  padding: "6px 10px",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  cursor: ruptured || planted >= SLOT_COUNT ? "default" : "pointer",
                }}
              >
                plant next stitch
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "RESET" })}
                style={{
                  border: "1px solid #18181b",
                  background: "#ffffff",
                  padding: "6px 10px",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                }}
              >
                reset chart
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "2px solid #18181b",
            padding: "clamp(8px, 1.6vw, 12px)",
            display: "flex",
            justifyContent: "space-between",
            gap: "8px",
            fontSize: "clamp(9px, 1.8vw, 12px)",
            textTransform: "uppercase",
          }}
        >
          <span>planted {planted}/{SLOT_COUNT}</span>
          <span>cycle {state.cycles}</span>
          <span>{ruptured ? "seam failed" : "specimen breathing"}</span>
        </div>
      </div>
    </div>
  );
}
