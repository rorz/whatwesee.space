"use client";
import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    eighteen_claims_render_to_text?: () => string;
    eighteen_claims_advance?: (steps: number) => void;
  }
}

const COLS = 7;
const ROWS = 6;
const TOTAL = 18;

const MINERAL: readonly string[] = [
  "#14b850",
  "#cc1e90",
  "#1e4ede",
  "#e8c200",
  "#de3450",
  "#7a28e0",
];

function rng(n: number): number {
  return ((Math.sin(n * 127.1 + 31.4) * 43758.5453) % 1 + 1) % 1;
}

type Cell = { type: number; claimed: boolean; fade: number };

function makeBoard(): Cell[] {
  return Array.from({ length: ROWS * COLS }, (_, i) => ({
    type: Math.floor(rng(i * 3 + 7) * 6),
    claimed: false,
    fade: 1,
  }));
}

function cellNeighbors(i: number): number[] {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  const ns: number[] = [];
  if (r > 0) ns.push(i - COLS);
  if (r < ROWS - 1) ns.push(i + COLS);
  if (c > 0) ns.push(i - 1);
  if (c < COLS - 1) ns.push(i + 1);
  return ns;
}

export default function EighteenClaims() {
  const [cells, setCells] = useState<Cell[]>(makeBoard);
  const [stampsLeft, setStampsLeft] = useState(TOTAL);
  const [done, setDone] = useState(false);

  const cellsRef = useRef<Cell[]>(cells);
  const stampsRef = useRef(TOTAL);
  const doneRef = useRef(false);
  const rafRef = useRef(0);
  const tickRef = useRef(0);

  const plant = useCallback((i: number) => {
    if (doneRef.current || stampsRef.current <= 0 || cellsRef.current[i].claimed) return;
    const next = cellsRef.current.slice();
    next[i] = { ...next[i], claimed: true, fade: 1 };
    cellsRef.current = next;
    setCells(next);
    stampsRef.current -= 1;
    setStampsLeft(stampsRef.current);
    if (stampsRef.current === 0) {
      doneRef.current = true;
      setDone(true);
    }
  }, []);

  useEffect(() => {
    const loop = (t: number) => {
      if (!doneRef.current && t - tickRef.current > 500) {
        tickRef.current = t;
        const cur = cellsRef.current;
        let dirty = false;
        const nxt: Cell[] = cur.map((cell, i) => {
          if (!cell.claimed) return cell;
          const cn = cellNeighbors(i).filter((n) => cur[n].claimed).length;
          if (cn > 0) return cell;
          dirty = true;
          const f = cell.fade - 0.25;
          return f <= 0 ? { ...cell, claimed: false, fade: 1 } : { ...cell, fade: f };
        });
        if (dirty) {
          cellsRef.current = nxt;
          setCells(nxt);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    window.eighteen_claims_render_to_text = () => {
      const held = cellsRef.current.filter((c) => c.claimed).length;
      return `left=${stampsRef.current} held=${held}/${ROWS * COLS}`;
    };

    window.eighteen_claims_advance = (steps: number) => {
      const n = Math.max(0, Number.isFinite(steps) ? Math.floor(steps) : 0);
      for (let s = 0; s < n && stampsRef.current > 0; s++) {
        const free: number[] = [];
        cellsRef.current.forEach((c, i) => {
          if (!c.claimed) free.push(i);
        });
        if (!free.length) break;
        const idx = free[Math.floor(free.length / 2)];
        const next = cellsRef.current.slice();
        next[idx] = { ...next[idx], claimed: true, fade: 1 };
        cellsRef.current = next;
        stampsRef.current -= 1;
      }
      setCells([...cellsRef.current]);
      setStampsLeft(stampsRef.current);
      if (stampsRef.current <= 0) {
        doneRef.current = true;
        setDone(true);
      }
    };

    return () => {
      cancelAnimationFrame(rafRef.current);
      delete window.eighteen_claims_render_to_text;
      delete window.eighteen_claims_advance;
    };
  }, []);

  const PAD = 1.2;
  const METER_H = 18;
  const GUTTER = 0.7;
  const BX = PAD;
  const BY = METER_H + 1;
  const TW = 100 - 2 * PAD;
  const TH = 100 - BY - PAD;
  const CW = (TW - (COLS - 1) * GUTTER) / COLS;
  const CH = (TH - (ROWS - 1) * GUTTER) / ROWS;
  const SEAL_R = Math.min(CW, CH) * 0.19;
  const SEAL_INNER = Math.min(CW, CH) * 0.09;

  const held = cells.filter((c) => c.claimed).length;

  return (
    <div
      className="relative w-full h-full select-none touch-none"
      aria-label="Eighteen Claims: plant 18 wax stamps on the mineral survey grid; isolated claims dissolve back into the rock."
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          .ec-cell { transition: filter 0.15s; }
          .ec-cell:hover { filter: brightness(1.35); }
        `}</style>

        <rect width="100" height="100" fill="#0d0f1c" />

        <rect x="0" y="0" width="100" height={METER_H} fill="#1c0404" />
        <line x1="0" y1={METER_H} x2="100" y2={METER_H} stroke="#ff1a00" strokeWidth="0.35" />

        <text
          x="50"
          y={METER_H - 3.5}
          textAnchor="middle"
          fontSize="13"
          fontFamily="monospace, 'Courier New', Courier"
          fontWeight="900"
          fill={stampsLeft === 0 ? "#444" : "#ff1a00"}
          letterSpacing="1"
        >
          {String(stampsLeft).padStart(2, "0")}
        </text>
        <text
          x="50"
          y={METER_H - 0.5}
          textAnchor="middle"
          fontSize="2.2"
          fontFamily="monospace, 'Courier New', Courier"
          fill="#661100"
          letterSpacing="0.5"
        >
          STAMPS REMAINING
        </text>

        {cells.map((cell, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const x = BX + col * (CW + GUTTER);
          const y = BY + row * (CH + GUTTER);
          const base = MINERAL[cell.type];
          const clickable = !cell.claimed && !done && stampsLeft > 0;

          return (
            <g
              key={i}
              className={clickable ? "ec-cell" : undefined}
              onClick={() => plant(i)}
              style={{ cursor: clickable ? "crosshair" : "default" }}
            >
              <rect x={x} y={y} width={CW} height={CH} fill={base} />
              {cell.claimed && (
                <>
                  <rect
                    x={x}
                    y={y}
                    width={CW}
                    height={CH}
                    fill="#c83000"
                    fillOpacity={cell.fade * 0.78}
                  />
                  <rect
                    x={x + 0.4}
                    y={y + 0.4}
                    width={CW - 0.8}
                    height={CH - 0.8}
                    fill="none"
                    stroke="white"
                    strokeWidth="0.7"
                    strokeDasharray="1.1 0.9"
                    strokeOpacity={cell.fade * 0.9}
                  />
                  <circle
                    cx={x + CW / 2}
                    cy={y + CH / 2}
                    r={SEAL_R}
                    fill="#ffcc00"
                    fillOpacity={cell.fade * 0.92}
                  />
                  <circle
                    cx={x + CW / 2}
                    cy={y + CH / 2}
                    r={SEAL_INNER}
                    fill="#ff6600"
                    fillOpacity={cell.fade}
                  />
                </>
              )}
            </g>
          );
        })}

        {done && (
          <>
            <rect x="15" y="43" width="70" height="15" fill="#1c0404" rx="0.5" />
            <text
              x="50"
              y="50"
              textAnchor="middle"
              fontSize="4.5"
              fontFamily="monospace, 'Courier New', Courier"
              fontWeight="900"
              fill="#ff1a00"
            >
              SURVEY CLOSED
            </text>
            <text
              x="50"
              y="56"
              textAnchor="middle"
              fontSize="3"
              fontFamily="monospace, 'Courier New', Courier"
              fill="#cc4400"
            >
              {held} / {ROWS * COLS} CELLS HELD
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
