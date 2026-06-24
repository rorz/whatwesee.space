"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    fifth_encore_quilt_render_to_text?: () => string;
    fifth_encore_quilt_advance?: (steps: number) => void;
  }
}

type SeasonId = 0 | 1 | 2 | 3;

type Ticket = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  season: SeasonId;
};

type QuiltState = {
  tickets: Ticket[];
  applause: number[];
  meter: number;
  shake: number;
  sway: number;
  tick: number;
  focusSeason: SeasonId;
};

type Tone =
  | "frame"
  | "quiet"
  | "summer"
  | "autumn"
  | "winter"
  | "spring"
  | "meter"
  | "danger"
  | "ticket"
  | "mic"
  | "label";

type Cell = {
  char: string;
  tone: Tone;
};

const GRID_WIDTH = 25;
const GRID_HEIGHT = 25;
const STEP_MS = 90;
const TICKET_GLYPHS = ["*", "+", "x", "%", "@", "&", "#", "o"] as const;

const SEASONS = [
  { label: "VERAO", short: "V", x: 5, y: 8, tone: "summer" as const },
  { label: "OUTON", short: "O", x: 19, y: 8, tone: "autumn" as const },
  { label: "INVER", short: "I", x: 5, y: 17, tone: "winter" as const },
  { label: "PRIMA", short: "P", x: 19, y: 17, tone: "spring" as const },
] as const;

const TONE_STYLES: Record<Tone, { background: string; color: string }> = {
  frame: { background: "#ffe4de", color: "#9a3e58" },
  quiet: { background: "#fff2ec", color: "#a05f72" },
  summer: { background: "#ffbfd0", color: "#6a2036" },
  autumn: { background: "#ffd89a", color: "#6c4920" },
  winter: { background: "#c9ecff", color: "#204e70" },
  spring: { background: "#cef2c5", color: "#245c33" },
  meter: { background: "#ffd8dd", color: "#9f4761" },
  danger: { background: "#ef476f", color: "#fff4f7" },
  ticket: { background: "#fff7df", color: "#7a2d3d" },
  mic: { background: "#f8d5de", color: "#6a2942" },
  label: { background: "#fff7f2", color: "#7c495d" },
};

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

function createInitialState(): QuiltState {
  return {
    tickets: [
      { x: 4, y: 6, vx: 0.2, vy: 0.1, season: 0 },
      { x: 7, y: 9, vx: -0.1, vy: 0.2, season: 0 },
      { x: 18, y: 6, vx: 0.15, vy: 0.12, season: 1 },
      { x: 20, y: 10, vx: -0.12, vy: 0.2, season: 1 },
      { x: 4, y: 16, vx: 0.18, vy: -0.1, season: 2 },
      { x: 8, y: 19, vx: -0.16, vy: 0.06, season: 2 },
      { x: 18, y: 16, vx: 0.08, vy: -0.15, season: 3 },
      { x: 21, y: 18, vx: -0.18, vy: 0.08, season: 3 },
    ],
    applause: [1.2, 1.2, 1.2, 1.2],
    meter: 1.4,
    shake: 0,
    sway: 0,
    tick: 0,
    focusSeason: 0,
  };
}

function stepState(state: QuiltState, impulse = 0): QuiltState {
  const safeImpulse = Number.isFinite(impulse) ? clamp(impulse, 0, 9) : 0;
  const seasonShift = safeImpulse >= 2 ? Math.max(1, Math.floor(safeImpulse / 2.5)) : 0;
  const applause = state.applause.map((value) => Math.max(value * 0.92 - 0.03, 0));
  const shake = clamp(state.shake * 0.78 + safeImpulse * 0.95, 0, 14);
  const meter = clamp(Math.max(state.meter * 0.9 - 0.08, 0) + safeImpulse * 1.2, 0, 12);
  const tick = state.tick + 1;

  const tickets = state.tickets.map((ticket, index) => {
    const season =
      seasonShift > 0 && (index + state.tick) % 2 === 0
        ? (((ticket.season + seasonShift) % SEASONS.length) as SeasonId)
        : ticket.season;
    const target = SEASONS[season];
    let vx =
      ticket.vx * 0.78 +
      (target.x - ticket.x) * 0.1 +
      Math.sin((tick + index * 5) * 0.55) * shake * 0.1;
    let vy =
      ticket.vy * 0.78 +
      (target.y - ticket.y) * 0.09 +
      Math.cos((tick + index * 7) * 0.43) * shake * 0.07;

    let x = ticket.x + vx;
    let y = ticket.y + vy;

    if (x < 1.5 || x > GRID_WIDTH - 2.5) {
      x = clamp(x, 1.5, GRID_WIDTH - 2.5);
      vx *= -0.55;
    }
    if (y < 4 || y > GRID_HEIGHT - 4) {
      y = clamp(y, 4, GRID_HEIGHT - 4);
      vy *= -0.55;
    }

    if (Math.abs(x - target.x) < 1.7 && Math.abs(y - target.y) < 1.7) {
      applause[season] = clamp(applause[season] + 0.45 + shake * 0.03, 0, 9.9);
    }

    return { x, y, vx, vy, season };
  });

  const focusSeason = applause.reduce<SeasonId>((best, value, index) => {
    return value > applause[best] ? (index as SeasonId) : best;
  }, state.focusSeason);

  return {
    tickets,
    applause,
    meter,
    shake,
    sway: Math.sin(tick * 0.8) * Math.min(shake, 5),
    tick,
    focusSeason,
  };
}

function buildGrid(state: QuiltState): Cell[] {
  const grid = Array.from({ length: GRID_HEIGHT }, () =>
    Array.from({ length: GRID_WIDTH }, (): Cell => ({ char: " ", tone: "quiet" })),
  );

  const paint = (x: number, y: number, char: string, tone: Tone) => {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
      return;
    }
    grid[y][x] = { char, tone };
  };

  const fill = (left: number, top: number, width: number, height: number, tone: Tone) => {
    for (let y = top; y < top + height; y += 1) {
      for (let x = left; x < left + width; x += 1) {
        paint(x, y, " ", tone);
      }
    }
  };

  const frameBox = (left: number, top: number, width: number, height: number, tone: Tone) => {
    for (let x = left; x < left + width; x += 1) {
      paint(x, top, "-", tone);
      paint(x, top + height - 1, "-", tone);
    }
    for (let y = top; y < top + height; y += 1) {
      paint(left, y, "|", tone);
      paint(left + width - 1, y, "|", tone);
    }
    paint(left, top, "+", tone);
    paint(left + width - 1, top, "+", tone);
    paint(left, top + height - 1, "+", tone);
    paint(left + width - 1, top + height - 1, "+", tone);
  };

  const write = (left: number, top: number, text: string, tone: Tone) => {
    for (let index = 0; index < text.length; index += 1) {
      paint(left + index, top, text[index], tone);
    }
  };

  fill(0, 0, GRID_WIDTH, GRID_HEIGHT, "quiet");
  frameBox(0, 0, GRID_WIDTH, GRID_HEIGHT, "frame");
  write(4, 1, "5TH ENCORE", "label");
  write(7, 2, "QUILT", "label");

  fill(1, 4, 10, 8, "summer");
  fill(14, 4, 10, 8, "autumn");
  fill(1, 13, 10, 8, "winter");
  fill(14, 13, 10, 8, "spring");
  frameBox(1, 4, 10, 8, "frame");
  frameBox(14, 4, 10, 8, "frame");
  frameBox(1, 13, 10, 8, "frame");
  frameBox(14, 13, 10, 8, "frame");
  frameBox(10, 8, 6, 8, "frame");

  write(3, 5, "VERAO", "summer");
  write(16, 5, "OUTON", "autumn");
  write(3, 14, "INVER", "winter");
  write(16, 14, "PRIMA", "spring");

  for (const [index, season] of SEASONS.entries()) {
    const applause = Math.round(state.applause[index] * 10);
    const row = index < 2 ? 10 : 19;
    const col = index % 2 === 0 ? 3 : 16;
    write(col, row, `${season.short}:${String(applause).padStart(2, "0")}`, season.tone);
  }

  write(11, 9, "LIVE", "mic");
  write(11, 10, "SOCK", "mic");
  write(12, 12, "o", "mic");
  write(12, 13, "|", "mic");
  write(11, 14, "GONE", "mic");

  for (let x = 3; x <= 21; x += 1) {
    paint(x, 22, "-", "meter");
  }
  write(3, 21, "REDLINE", "label");
  const meterFill = Math.round((state.meter / 12) * 19);
  for (let x = 0; x < meterFill; x += 1) {
    paint(3 + x, 22, "!", x > 13 ? "danger" : "meter");
  }

  for (const [index, ticket] of state.tickets.entries()) {
    paint(Math.round(ticket.x), Math.round(ticket.y), TICKET_GLYPHS[index], "ticket");
  }

  write(2, 23, state.shake > 1.5 ? "RATTLE HARDER" : "SHAKE TO RECALL", "label");
  write(17, 23, state.focusSeason === 0 ? "SUN" : state.focusSeason === 1 ? "RUST" : state.focusSeason === 2 ? "COLD" : "BLOOM", "label");

  return grid.flat();
}

function renderStatus(state: QuiltState): string {
  const season = SEASONS[state.focusSeason].label.toLowerCase();
  return `tick=${state.tick};meter=${state.meter.toFixed(1)};shake=${state.shake.toFixed(1)};season=${season}`;
}

export default function FifthEncoreQuilt() {
  const [state, setState] = useState<QuiltState>(() => createInitialState());
  const stateRef = useRef(state);
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number; lastTime: number } | null>(null);

  const commitStep = useCallback((impulse = 0) => {
    setState((current) => {
      const next = stepState(current, impulse);
      stateRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      commitStep();
    }, STEP_MS);

    window.fifth_encore_quilt_render_to_text = () => renderStatus(stateRef.current);
    window.fifth_encore_quilt_advance = (steps: number) => {
      const safeSteps = Number.isFinite(steps) ? Math.max(0, Math.floor(steps)) : 0;
      setState((current) => {
        let next = current;
        for (let index = 0; index < safeSteps; index += 1) {
          next = stepState(next);
        }
        stateRef.current = next;
        return next;
      });
    };

    return () => {
      window.clearInterval(timer);
      delete window.fifth_encore_quilt_render_to_text;
      delete window.fifth_encore_quilt_advance;
    };
  }, [commitStep]);

  const cells = useMemo(() => buildGrid(state), [state]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: performance.now(),
    };
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag?.active) {
        return;
      }
      const now = performance.now();
      const dx = event.clientX - drag.lastX;
      const dy = event.clientY - drag.lastY;
      const distance = Math.abs(dx) + Math.abs(dy);
      const elapsed = Math.max(now - drag.lastTime, 16);
      if (distance > 6) {
        commitStep(clamp((distance / elapsed) * 7.5, 0.8, 8));
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
        drag.lastTime = now;
      }
    },
    [commitStep],
  );

  const handlePointerEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }, []);

  return (
    <div
      data-artwork-root="fifth-encore-quilt"
      className="flex h-full w-full touch-none select-none flex-col justify-between bg-[#fff2ec] p-3 text-[#7c495d]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      style={{ touchAction: "none" }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between font-pixel-square text-[10px] uppercase tracking-[0.2em] sm:text-[11px]">
          <span>fifth encore quilt</span>
          <span
            className="rounded-full px-2 py-1"
            style={{
              background: state.meter > 8 ? "#ef476f" : "#ffe0df",
              color: state.meter > 8 ? "#fff6f8" : "#9a3e58",
            }}
          >
            {state.meter > 8 ? "redline" : state.shake > 1.5 ? "still live" : "quiet"}
          </span>
        </div>
        <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-[20px] border-2 border-[#d26379] bg-[#ffe4de] p-2">
          <div className="absolute left-1/2 top-0 h-3 w-16 -translate-x-1/2 rounded-b-full border-x-2 border-b-2 border-[#d26379] bg-[#fff8f4]" />
          <div className="h-full w-full rounded-[14px] bg-[#d26379] p-[2px]">
            <div
              className="grid h-full w-full gap-px rounded-[12px] bg-[#d26379] p-px"
              style={{
                gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_HEIGHT}, minmax(0, 1fr))`,
                transform: `translateX(${state.sway * 5}px) rotate(${state.sway * 0.55}deg)`,
                fontSize: "clamp(8px, 1.45vmin, 13px)",
              }}
              aria-label="A stitched concert memorial diagram with four season panels, moving ticket-stars, and a redline encore meter."
            >
              {cells.map((cell, index) => {
                const tone = TONE_STYLES[cell.tone];
                return (
                  <span
                    key={index}
                    className="flex items-center justify-center font-pixel-square leading-none"
                    style={{ background: tone.background, color: tone.color }}
                  >
                    {cell.char === " " ? "\u00A0" : cell.char}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="pt-2">
        <div className="grid grid-cols-2 gap-2 font-pixel-square text-[10px] leading-tight sm:text-[11px]">
          {SEASONS.map((season, index) => (
            <div
              key={season.label}
              className="rounded-lg border border-[#d26379] px-2 py-2"
              style={{
                background: TONE_STYLES[season.tone].background,
                color: TONE_STYLES[season.tone].color,
              }}
            >
              <div className="flex items-center justify-between uppercase tracking-[0.15em]">
                <span>{season.label.toLowerCase()}</span>
                <span>{Math.round(state.applause[index] * 10)}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 font-pixel-square text-[10px] leading-tight text-[#8a4f63] sm:text-[11px]">
          shake the quilt side to side; harder rattles make the ticket-stars overshoot and search for a fresh season.
        </p>
      </div>
    </div>
  );
}
