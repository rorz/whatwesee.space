"use client";
import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    suave_form_render_to_text?: () => string;
    suave_form_advance?: (steps: number) => void;
  }
}

const COLS = 3;
const ROWS = 6;
const TOTAL = COLS * ROWS;
const SR_IDX = 10;
const CORRECT_INTERVAL = 2200;
const FLICKER_INTERVAL = 900;

const HORSE_NAMES: readonly string[] = [
  "NIGHTCAP", "IRONBELL", "SOLSTICE",
  "DRUMLINE", "MARBURG",  "COLDFRONT",
  "TIDEWALL", "GARRISON", "HALFPIPE",
  "MUDLARK",  "SR \u2605", "PALAEMON",
  "FOXHOUND", "SALTERN",  "BRAMBLEBY",
  "INKFALL",  "DUSTWALK", "FARPOST",
];

const CELL_COLORS: readonly string[] = [
  "#cc2200", "#cc2200", "#cc2200",
  "#cc2200", "#cc2200", "#cc2200",
  "#1144bb", "#1144bb", "#1144bb",
  "#1144bb", "#1438cc", "#1144bb",
  "#c8a000", "#c8a000", "#c8a000",
  "#c8a000", "#c8a000", "#c8a000",
];

// Base odds × 10 (21 = 2.1x favourite for SR)
const BASE_ODDS: readonly number[] = [
  580, 420, 310,
  250, 190, 150,
  120,  95,  75,
   55,  21,  45,
   68,  89, 110,
  145, 200, 280,
];

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function getNeighbors(idx: number): number[] {
  const c = idx % COLS;
  const r = Math.floor(idx / COLS);
  const ns: number[] = [];
  if (r > 0) ns.push(idx - COLS);
  if (r < ROWS - 1) ns.push(idx + COLS);
  if (c > 0) ns.push(idx - 1);
  if (c < COLS - 1) ns.push(idx + 1);
  return ns;
}

function formatOdds(raw: number): string {
  return (raw / 10).toFixed(1);
}

type DisplayState = {
  odds: readonly number[];
  bouncing: readonly number[];
  flickerDigit: readonly string[];
  collisions: number;
};

export default function SuaveForm() {
  const oddsRef = useRef<number[]>([...BASE_ODDS]);
  const bounceRef = useRef<number[]>(new Array(TOTAL).fill(0));
  const flickerDigitRef = useRef<string[]>(new Array(TOTAL).fill(""));
  const collisionsRef = useRef(0);
  const rafRef = useRef(0);
  const lastCorrectRef = useRef(0);
  const lastFlickerRef = useRef(0);

  const [display, setDisplay] = useState<DisplayState>({
    odds: [...BASE_ODDS],
    bouncing: new Array(TOTAL).fill(0),
    flickerDigit: new Array(TOTAL).fill(""),
    collisions: 0,
  });

  const syncDisplay = useCallback(() => {
    setDisplay({
      odds: [...oddsRef.current],
      bouncing: [...bounceRef.current],
      flickerDigit: [...flickerDigitRef.current],
      collisions: collisionsRef.current,
    });
  }, []);

  const applyCorrection = useCallback(() => {
    const odds = oddsRef.current;
    const next = odds.map((v, i) => {
      const base = BASE_ODDS[i];
      const pullStrength = i === SR_IDX ? 0.4 : 0.12;
      return Math.round(clamp(v + (base - v) * pullStrength, 10, 999));
    });
    oddsRef.current = next;
  }, []);

  const collideCell = useCallback((idx: number) => {
    const odds = oddsRef.current.slice();
    const neighbors = getNeighbors(idx);
    const push = Math.round(odds[idx] * 0.3);
    const perNeighbor = neighbors.length > 0 ? Math.round(push / neighbors.length) : 0;
    odds[idx] = clamp(odds[idx] - push + 15, 10, 999);
    for (const n of neighbors) {
      odds[n] = clamp(odds[n] + perNeighbor, 10, 999);
    }
    oddsRef.current = odds;
    bounceRef.current = bounceRef.current.map((v, i) => (i === idx ? 1 : v));
    collisionsRef.current += 1;
    syncDisplay();
  }, [syncDisplay]);

  useEffect(() => {
    const loop = (t: number) => {
      let dirty = false;

      if (t - lastCorrectRef.current > CORRECT_INTERVAL) {
        lastCorrectRef.current = t;
        applyCorrection();
        dirty = true;
      }

      if (t - lastFlickerRef.current > FLICKER_INTERVAL) {
        lastFlickerRef.current = t;
        const next = flickerDigitRef.current.map(() =>
          Math.random() < 0.08 ? String(Math.floor(Math.random() * 10)) : ""
        );
        flickerDigitRef.current = next;
        dirty = true;
      }

      const anyBouncing = bounceRef.current.some((v) => v > 0);
      if (anyBouncing) {
        bounceRef.current = bounceRef.current.map((v) =>
          v > 0 ? Math.max(0, v - 0.08) : 0
        );
        dirty = true;
      }

      if (dirty) syncDisplay();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    window.suave_form_render_to_text = () => {
      const srOdds = formatOdds(oddsRef.current[SR_IDX]);
      const srIsFav = oddsRef.current[SR_IDX] <= Math.min(...oddsRef.current);
      return `sr=${srOdds} favourite=${srIsFav} collisions=${collisionsRef.current}`;
    };

    window.suave_form_advance = (steps: number) => {
      const n = Math.max(0, Number.isFinite(steps) ? Math.floor(steps) : 0);
      for (let s = 0; s < n; s++) {
        applyCorrection();
      }
      syncDisplay();
    };

    return () => {
      cancelAnimationFrame(rafRef.current);
      delete window.suave_form_render_to_text;
      delete window.suave_form_advance;
    };
  }, [applyCorrection, syncDisplay]);

  const PAD = 0.5;
  const HEADER_H = 9;
  const FOOTER_H = 8;
  const GRID_Y = HEADER_H + PAD;
  const GRID_H = 100 - GRID_Y - FOOTER_H;
  const GAP = 0.4;
  const CW = (100 - 2 * PAD - (COLS - 1) * GAP) / COLS;
  const CH = (GRID_H - (ROWS - 1) * GAP) / ROWS;

  return (
    <div
      className="relative w-full h-full select-none touch-none"
      aria-label="Suave Form: collide horse entries on the Japan Cup 2019 tote board. Suave Richard always becomes the favourite."
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" fill="#f0ede4" />

        <rect x="0" y="0" width="100" height={HEADER_H} fill="#1a1a1a" />
        <text
          x="50"
          y={HEADER_H - 5.2}
          textAnchor="middle"
          fontSize="3.8"
          fontFamily="'Courier New', Courier, monospace"
          fontWeight="900"
          fill="#f0ede4"
          letterSpacing="0.5"
        >
          JAPAN CUP 2019
        </text>
        <text
          x="50"
          y={HEADER_H - 1.2}
          textAnchor="middle"
          fontSize="2.2"
          fontFamily="'Courier New', Courier, monospace"
          fill="#888"
          letterSpacing="0.8"
        >
          FINAL TOTE · CLICK TO COLLIDE
        </text>

        {Array.from({ length: TOTAL }, (_, idx) => {
          const col = idx % COLS;
          const row = Math.floor(idx / COLS);
          const cx = PAD + col * (CW + GAP);
          const cy = GRID_Y + row * (CH + GAP);
          const baseColor = CELL_COLORS[idx];
          const bounce = display.bouncing[idx];
          const flickerDigit = display.flickerDigit[idx];
          const rawOdds = display.odds[idx];
          const oddsStr = flickerDigit
            ? formatOdds(rawOdds).replace(/\d/, flickerDigit)
            : formatOdds(rawOdds);
          const isSR = idx === SR_IDX;
          const isYellow = idx >= 12;

          const tx = bounce * (col === 0 ? 1.4 : col === 2 ? -1.4 : 0);
          const ty = bounce * (row === 0 ? 1.4 : row === ROWS - 1 ? -1.4 : 0);

          return (
            <g
              key={idx}
              onClick={() => collideCell(idx)}
              style={{ cursor: "crosshair" }}
              transform={`translate(${tx},${ty})`}
            >
              <rect
                x={cx}
                y={cy}
                width={CW}
                height={CH}
                fill={baseColor}
                stroke={isSR ? "#f0ede4" : "none"}
                strokeWidth={isSR ? 0.6 : 0}
              />
              {isSR && (
                <rect
                  x={cx + 0.4}
                  y={cy + 0.4}
                  width={CW - 0.8}
                  height={CH - 0.8}
                  fill="none"
                  stroke="#f0ede4"
                  strokeWidth="0.35"
                  strokeDasharray="1.5 0.8"
                />
              )}
              <text
                x={cx + 1.2}
                y={cy + 3.5}
                fontSize="2.4"
                fontFamily="'Courier New', Courier, monospace"
                fontWeight="700"
                fill={isYellow ? "#1a1a1a" : "#f0ede4"}
                opacity="0.7"
              >
                {String(idx + 1).padStart(2, "0")}
              </text>
              <text
                x={cx + CW / 2}
                y={cy + CH / 2 + 1}
                textAnchor="middle"
                fontSize={isSR ? "3" : "2.6"}
                fontFamily="'Courier New', Courier, monospace"
                fontWeight={isSR ? "900" : "700"}
                fill={isYellow ? "#1a1a1a" : "#f0ede4"}
              >
                {HORSE_NAMES[idx]}
              </text>
              <text
                x={cx + CW - 1.2}
                y={cy + CH - 1.5}
                textAnchor="end"
                fontSize="3"
                fontFamily="'Courier New', Courier, monospace"
                fontWeight="900"
                fill={isYellow ? "#1a1a1a" : "#f0ede4"}
                opacity={flickerDigit ? 0.6 : 1}
              >
                {oddsStr}
              </text>
              {bounce > 0.5 && (
                <rect
                  x={cx}
                  y={cy}
                  width={CW}
                  height={CH}
                  fill="white"
                  fillOpacity={bounce * 0.35}
                />
              )}
            </g>
          );
        })}

        <rect
          x="0"
          y={100 - FOOTER_H}
          width="100"
          height={FOOTER_H}
          fill="#1a1a1a"
        />
        <text
          x="3"
          y={100 - FOOTER_H + 4.5}
          fontSize="2.8"
          fontFamily="'Courier New', Courier, monospace"
          fontWeight="900"
          fill="#cc2200"
        >
          COLLISIONS: {String(display.collisions).padStart(4, "0")}
        </text>
        <text
          x="3"
          y={100 - FOOTER_H + 7}
          fontSize="1.8"
          fontFamily="'Courier New', Courier, monospace"
          fill="#555"
        >
          SR ODDS: {formatOdds(display.odds[SR_IDX])} · FORM P.7 (MISSING)
        </text>
        <polygon
          points="88,92 100,92 100,100"
          fill="#333"
        />
        <text
          x="96"
          y="99"
          textAnchor="end"
          fontSize="1.4"
          fontFamily="'Courier New', Courier, monospace"
          fill="#666"
          transform="rotate(-35, 96, 99)"
        >
          SEE P.7
        </text>
      </svg>
    </div>
  );
}
