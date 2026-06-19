"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    civic_brass_lung_render_to_text?: () => string;
    civic_brass_lung_advance?: (steps: number) => void;
  }
}

const LANE_COUNT = 11;
const GRID_WIDTH = 33;
const GRID_HEIGHT = 20;
const LANE_KEYS = "123456789AB".split("");

type EngineState = {
  pressures: number[];
  jams: number[];
  tick: number;
  lastPressed: number;
};

function clamp(value: number, low: number, high: number) {
  return Math.max(low, Math.min(high, value));
}

function createInitialState(): EngineState {
  return {
    pressures: Array.from({ length: LANE_COUNT }, (_, index) => 1.2 + ((index * 7) % 3) * 0.35),
    jams: Array.from({ length: LANE_COUNT }, (_, index) => (index % 4 === 0 ? 1 : 0.35)),
    tick: 0,
    lastPressed: 5,
  };
}

function stepEngine(state: EngineState, pressedLane?: number): EngineState {
  const nextPressures = [...state.pressures];
  const nextJams = [...state.jams];
  let lastPressed = state.lastPressed;

  if (typeof pressedLane === "number") {
    lastPressed = clamp(pressedLane, 0, LANE_COUNT - 1);
    nextPressures[lastPressed] = clamp(nextPressures[lastPressed] + 3.1, 0, 9);
    if (lastPressed > 0) {
      nextPressures[lastPressed - 1] = clamp(nextPressures[lastPressed - 1] + 1.1, 0, 9);
    }
    if (lastPressed < LANE_COUNT - 1) {
      nextPressures[lastPressed + 1] = clamp(nextPressures[lastPressed + 1] + 1.1, 0, 9);
    }
  }

  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    const pressure = nextPressures[lane];
    const jam = nextJams[lane];
    const cooling = jam > 2 ? 0.08 : 0.18;
    nextPressures[lane] = clamp(pressure - cooling, 0, 9);

    if (pressure > 6) {
      nextJams[lane] = clamp(jam + 0.9, 0, 9);
    } else if (pressure < 2) {
      nextJams[lane] = clamp(jam - 0.35, 0, 9);
    }

    if (nextJams[lane] > 0 && nextPressures[lane] < 1.1) {
      nextJams[lane] = clamp(nextJams[lane] - 0.2, 0, 9);
    }
  }

  return {
    pressures: nextPressures,
    jams: nextJams,
    tick: state.tick + 1,
    lastPressed,
  };
}

function renderGrid(state: EngineState): string {
  const grid = Array.from({ length: GRID_HEIGHT }, () => Array.from({ length: GRID_WIDTH }, () => " "));

  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    const x = 2 + lane * 3;
    const jamRows = Math.round(state.jams[lane] * 1.15);
    const pressureRows = Math.round(state.pressures[lane] * 1.05);

    for (let y = 2; y < GRID_HEIGHT - 3; y += 1) {
      if (x >= 0 && x < GRID_WIDTH) {
        grid[y][x] = "│";
      }
      if (x + 1 >= 0 && x + 1 < GRID_WIDTH) {
        grid[y][x + 1] = "│";
      }
    }

    for (let i = 0; i < jamRows; i += 1) {
      const y = GRID_HEIGHT - 4 - i;
      if (y >= 2 && y < GRID_HEIGHT - 2 && x >= 0 && x < GRID_WIDTH) {
        grid[y][x] = "▓";
      }
      if (y >= 2 && y < GRID_HEIGHT - 2 && x + 1 >= 0 && x + 1 < GRID_WIDTH) {
        grid[y][x + 1] = "▓";
      }
    }

    for (let i = 0; i < pressureRows; i += 1) {
      const y = GRID_HEIGHT - 4 - i;
      if (y >= 2 && y < GRID_HEIGHT - 2) {
        if (x >= 0 && x < GRID_WIDTH && grid[y][x] === "│") {
          grid[y][x] = "║";
        }
        if (x + 1 >= 0 && x + 1 < GRID_WIDTH && grid[y][x + 1] === "│") {
          grid[y][x + 1] = "║";
        }
      }
    }

    if (x >= 0 && x < GRID_WIDTH) {
      grid[1][x] = state.pressures[lane] > 4.5 ? "●" : "○";
      grid[GRID_HEIGHT - 1][x] = LANE_KEYS[lane];
    }
  }

  for (let x = 0; x < GRID_WIDTH; x += 1) {
    grid[0][x] = x % 2 === 0 ? "═" : "─";
  }

  grid[0][0] = "╔";
  grid[0][1] = "C";
  grid[0][2] = "B";
  grid[0][3] = "L";
  grid[0][4] = " ";
  grid[0][5] = "I";
  grid[0][6] = "N";
  grid[0][7] = "V";

  return grid.map((row) => row.join("")).join("\n");
}

function renderStatus(state: EngineState): string {
  const pressure = state.pressures.reduce((sum, value) => sum + value, 0);
  const jam = state.jams.reduce((sum, value) => sum + value, 0);
  return `tick=${state.tick};pressure=${pressure.toFixed(1)};jam=${jam.toFixed(1)};lane=${LANE_KEYS[state.lastPressed]}`;
}

export default function CivicBrassLung() {
  const [engineState, setEngineState] = useState<EngineState>(() => createInitialState());
  const stateRef = useRef<EngineState>(engineState);
  const viewportRef = useRef<HTMLDivElement>(null);

  const commitStep = useCallback((pressedLane?: number) => {
    setEngineState((current) => {
      const next = stepEngine(current, pressedLane);
      stateRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    stateRef.current = engineState;
  }, [engineState]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      commitStep();
    }, 120);

    window.civic_brass_lung_render_to_text = () => {
      return renderStatus(stateRef.current);
    };

    window.civic_brass_lung_advance = (steps: number) => {
      const safeSteps = Number.isFinite(steps) ? Math.max(0, Math.floor(steps)) : 0;
      setEngineState((current) => {
        let next = current;
        for (let index = 0; index < safeSteps; index += 1) {
          next = stepEngine(next);
        }
        stateRef.current = next;
        return next;
      });
    };

    return () => {
      window.clearInterval(timer);
      delete window.civic_brass_lung_render_to_text;
      delete window.civic_brass_lung_advance;
    };
  }, [commitStep]);

  const gridText = renderGrid(engineState);
  const status = renderStatus(engineState);

  const pressAtPointer = useCallback(
    (clientX: number) => {
      const element = viewportRef.current;
      if (!element) {
        return;
      }
      const bounds = element.getBoundingClientRect();
      const ratio = bounds.width === 0 ? 0 : (clientX - bounds.left) / bounds.width;
      const lane = clamp(Math.floor(ratio * LANE_COUNT), 0, LANE_COUNT - 1);
      commitStep(lane);
    },
    [commitStep],
  );

  return (
    <div className="flex h-full w-full select-none flex-col gap-2 bg-[#f6f7f1] p-2 text-[#0f2212]">
      <div
        ref={viewportRef}
        aria-label="civic brass lung intake grid"
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-[#1f9d55] bg-[#eef7ef]"
        onPointerDown={(event) => pressAtPointer(event.clientX)}
      >
        <pre className="h-full w-full overflow-hidden p-2 font-pixel-square text-[9px] leading-[0.75rem] sm:text-[11px] sm:leading-[0.95rem]">
          {gridText}
        </pre>
      </div>
      <div className="grid grid-cols-6 gap-1 text-[10px] leading-none sm:grid-cols-11">
        {LANE_KEYS.map((key, lane) => (
          <button
            key={key}
            type="button"
            className="rounded-sm border border-[#1f9d55] bg-white px-1 py-1 font-pixel-square text-[#0f2212] transition hover:bg-[#d7edd9]"
            onMouseDown={() => commitStep(lane)}
            onTouchStart={() => commitStep(lane)}
          >
            lane {key}
          </button>
        ))}
      </div>
      <p className="truncate font-pixel-square text-[10px] text-[#255c31]">{status}</p>
    </div>
  );
}
