"use client";

import { useEffect, useRef, useReducer } from "react";

const COLS = 20;
const ROWS = 18;
const TOTAL = COLS * ROWS;
const TARGET = 347;

const BLOCK_COLORS = [
  "#2563eb",
  "#e63c1e",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
  "#0d9488",
  "#b45309",
];

function getNeighbors(i: number): number[] {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const ns: number[] = [];
  if (col > 0) ns.push(i - 1);
  if (col < COLS - 1) ns.push(i + 1);
  if (row > 0) ns.push(i - COLS);
  if (row < ROWS - 1) ns.push(i + COLS);
  return ns;
}

function computeComponents(planted: ReadonlyArray<boolean>): ReadonlyArray<number | null> {
  const comp: (number | null)[] = new Array(TOTAL).fill(null);
  let id = 0;
  for (let start = 0; start < TOTAL; start++) {
    if (!planted[start] || comp[start] !== null) continue;
    const queue: number[] = [start];
    comp[start] = id;
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const n of getNeighbors(cur)) {
        if (planted[n] && comp[n] === null) {
          comp[n] = id;
          queue.push(n);
        }
      }
    }
    id++;
  }
  return comp;
}

type State = {
  planted: ReadonlyArray<boolean>;
  count: number;
};

type Action = { type: "PLANT"; index: number } | { type: "ADVANCE"; steps: number };

const INIT: State = {
  planted: new Array(TOTAL).fill(false),
  count: 0,
};

function reduce(s: State, a: Action): State {
  if (a.type === "PLANT") {
    if (s.planted[a.index]) return s;
    const next = [...s.planted];
    next[a.index] = true;
    return { planted: next, count: s.count + 1 };
  }
  if (a.type === "ADVANCE") {
    const next = [...s.planted];
    let count = s.count;
    let remaining = a.steps;
    for (let i = 0; i < TOTAL && remaining > 0; i++) {
      if (!next[i]) {
        next[i] = true;
        count++;
        remaining--;
      }
    }
    return { planted: next, count };
  }
  return s;
}

declare global {
  interface Window {
    unincorporated_render_to_text?: () => string;
    unincorporated_advance?: (steps: number) => void;
  }
}

export default function Unincorporated() {
  const [state, dispatch] = useReducer(reduce, INIT);
  const stateRef = useRef<State>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    window.unincorporated_render_to_text = () => {
      const { count } = stateRef.current;
      const pct = Math.round((count / TARGET) * 100);
      return `population ${count} / ${TARGET} (${pct}%) | ZIP 47851 | unincorporated`;
    };
    window.unincorporated_advance = (steps: number) => {
      dispatch({ type: "ADVANCE", steps });
    };
    return () => {
      delete window.unincorporated_render_to_text;
      delete window.unincorporated_advance;
    };
  }, []);

  const components = computeComponents(state.planted);
  const { count, planted } = state;
  const reached = count >= TARGET;

  return (
    <div
      className="w-full h-full flex flex-col select-none"
      style={{ background: "#1c1a12", fontFamily: "monospace" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          gap: "2px",
          padding: "8px",
          flex: 1,
          minHeight: 0,
        }}
      >
        {planted.map((isPlanted, i) => {
          const compId = components[i];
          const bg =
            isPlanted && compId !== null
              ? BLOCK_COLORS[compId % BLOCK_COLORS.length]
              : "#f0e8d0";
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              aria-label={isPlanted ? `lot ${i + 1} occupied` : `plant on lot ${i + 1}`}
              onClick={() => dispatch({ type: "PLANT", index: i })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  dispatch({ type: "PLANT", index: i });
                }
              }}
              style={{
                background: bg,
                cursor: isPlanted ? "default" : "pointer",
                borderRadius: "1px",
                transition: "background 0.12s",
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          padding: "5px 10px",
          fontSize: "clamp(8px, 1.8vw, 12px)",
          background: "#1c1a12",
          color: reached ? "#65a30d" : "#f0e8d0",
          display: "flex",
          justifyContent: "space-between",
          flexShrink: 0,
          borderTop: "2px solid #f0e8d0",
        }}
      >
        <span>population {count} / {TARGET}</span>
        <span>ZIP 47851</span>
        <span>{reached ? "census confirmed" : "no incorporation on record"}</span>
      </div>
    </div>
  );
}
