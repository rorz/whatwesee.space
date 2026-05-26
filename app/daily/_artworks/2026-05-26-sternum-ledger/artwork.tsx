"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    sternum_ledger_render_to_text?: () => string;
    sternum_ledger_advance?: (steps: number) => void;
  }
}

type Pulse = {
  id: number;
  row: number;
  col: number;
  age: number;
};

const ROWS = 18;
const COLS = 52;
const START_YEAR = 1860;
const YEAR_STEP = 10;
const PULSE_LIFETIME = 180;
const MAX_PULSE_HISTORY = 48;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clientToGrid(clientCoordinate: number, rectOffset: number, rectDimension: number, gridDimension: number): number {
  return clamp(Math.floor(((clientCoordinate - rectOffset) / rectDimension) * gridDimension), 0, gridDimension - 1);
}

export default function SternumLedger() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pulseIdRef = useRef(0);
  const frameRef = useRef(0);
  const ticksRef = useRef(0);
  const pulsesRef = useRef<Pulse[]>([]);
  const lastYearRef = useRef(START_YEAR);

  const [ticks, setTicks] = useState(0);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [lastYear, setLastYear] = useState(START_YEAR);

  useEffect(() => {
    pulsesRef.current = pulses;
  }, [pulses]);

  useEffect(() => {
    ticksRef.current = ticks;
  }, [ticks]);

  useEffect(() => {
    lastYearRef.current = lastYear;
  }, [lastYear]);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) {
        return;
      }
      setTicks((value) => value + 1);
      setPulses((current) =>
        current
          .map((pulse) => ({ ...pulse, age: pulse.age + 1 }))
          .filter((pulse) => pulse.age <= PULSE_LIFETIME),
      );
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      mounted = false;
      window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const addPulse = (row: number, col: number) => {
    const nextYear = START_YEAR + row * YEAR_STEP;
    pulseIdRef.current += 1;
    setLastYear(nextYear);
    setPulses((current) => [...current.slice(-(MAX_PULSE_HISTORY - 1)), { id: pulseIdRef.current, row, col, age: 0 }]);
  };

  const onPress = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const col = clientToGrid(event.clientX, rect.left, rect.width, COLS);
    const row = clientToGrid(event.clientY, rect.top, rect.height, ROWS);
    addPulse(row, col);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    addPulse(Math.floor(ROWS / 2), Math.floor(COLS / 2));
  };

  const lines = useMemo(() => {
    const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => "·"));
    for (const pulse of pulses) {
      const normalized = 1 - pulse.age / (PULSE_LIFETIME + 1);
      const spread = Math.max(1, Math.round(3 * normalized));

      for (let y = pulse.row - spread; y <= pulse.row + spread; y += 1) {
        for (let x = pulse.col - spread; x <= pulse.col + spread; x += 1) {
          if (y < 0 || y >= ROWS || x < 0 || x >= COLS) {
            continue;
          }
          const dist = Math.abs(y - pulse.row) + Math.abs(x - pulse.col);
          if (dist === 0) {
            grid[y][x] = "█";
          } else if (dist <= spread - 1 && grid[y][x] !== "█") {
            grid[y][x] = normalized > 0.5 ? "▓" : "▒";
          } else if (dist <= spread && grid[y][x] === "·") {
            grid[y][x] = "░";
          }
        }
      }
    }

    return grid.map((row, index) => {
      const year = String(START_YEAR + index * YEAR_STEP).padStart(4, " ");
      return `${year} | ${row.join("")}`;
    });
  }, [pulses]);

  useEffect(() => {
    window.sternum_ledger_render_to_text = () =>
      `Sternum Ledger | pulses:${pulsesRef.current.length} | year:${lastYearRef.current} | ticks:${ticksRef.current}`;

    window.sternum_ledger_advance = (steps: number) => {
      const safeSteps = Math.max(0, Math.floor(steps));
      if (safeSteps === 0) {
        return;
      }
      setTicks((value) => value + safeSteps);
      setPulses((current) =>
        current
          .map((pulse) => ({ ...pulse, age: pulse.age + safeSteps }))
          .filter((pulse) => pulse.age <= PULSE_LIFETIME),
      );
    };

    return () => {
      delete window.sternum_ledger_render_to_text;
      delete window.sternum_ledger_advance;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full cursor-crosshair flex-col overflow-hidden bg-[#111111] text-[#f2f2f2]"
      onPointerDown={onPress}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Sternum ledger timeline. Press to place a breath mark."
    >
      <div className="border-b border-[#3a3a3a] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em]">
        sternum ledger · press or hit enter/space
      </div>
      <pre className="flex-1 overflow-hidden px-3 py-2 font-mono text-[11px] leading-[1.15] tracking-[0.04em]">
        {lines.join("\n")}
      </pre>
      <div className="border-t border-[#3a3a3a] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#cfcfcf]">
        last mark year {lastYear} · active breaths {pulses.length}
      </div>
    </div>
  );
}
