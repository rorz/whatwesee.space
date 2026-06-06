"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    brine_candy_rack_render_to_text?: () => string;
    brine_candy_rack_advance?: (steps: number) => void;
  }
}

type PelletKind = "salt" | "fresh";

type Pellet = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: PelletKind;
};

type Impact = {
  id: number;
  x: number;
  y: number;
  age: number;
};

type World = {
  frame: number;
  pellets: Pellet[];
  impacts: Impact[];
  nextImpactId: number;
  shocks: number;
};

type CellInfo = {
  char: string;
  color: string;
  background: string;
  borderColor: string;
};

type Snapshot = {
  frame: number;
  shocks: number;
  saltCount: number;
  freshCount: number;
  brinePercent: number;
  cells: CellInfo[];
};

const COLS = 22;
const ROWS = 18;
const MAX_IMPACTS = 6;
const IMPACT_LIFETIME = 11;
const STEP_INTERVAL = 80;
const IMPULSE_RADIUS = 3.6;
const IMPULSE_STRENGTH = 0.18;
const BASE_BACKGROUND = "#f7ff43";
const CELL_BACKGROUND = "#fff799";
const SHELF_BACKGROUND = "#ffb347";
const CHANNEL_BACKGROUND = "#7ef7d7";
const BORDER = "#165f7a";
const TEXT = "#0c4160";
const SALT = "#ff5f3d";
const FRESH = "#135eff";
const IMPACT = "#ae2a19";

const INITIAL_PELLETS: ReadonlyArray<Pellet> = [
  { id: 1, x: 4.1, y: 4.2, vx: 0.082, vy: 0.041, kind: "salt" },
  { id: 2, x: 8.3, y: 5.4, vx: -0.063, vy: 0.049, kind: "salt" },
  { id: 3, x: 13.8, y: 4.9, vx: 0.071, vy: -0.052, kind: "salt" },
  { id: 4, x: 17.2, y: 6.2, vx: -0.068, vy: 0.045, kind: "salt" },
  { id: 5, x: 5.6, y: 11.8, vx: 0.054, vy: -0.063, kind: "salt" },
  { id: 6, x: 10.4, y: 10.7, vx: -0.076, vy: -0.04, kind: "salt" },
  { id: 7, x: 14.7, y: 12.5, vx: 0.069, vy: 0.058, kind: "salt" },
  { id: 8, x: 18.1, y: 11.1, vx: -0.082, vy: -0.046, kind: "salt" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function createWorld(): World {
  return {
    frame: 0,
    pellets: INITIAL_PELLETS.map((pellet) => ({ ...pellet })),
    impacts: [],
    nextImpactId: 1,
    shocks: 0,
  };
}

function stepWorld(world: World): World {
  const next: World = {
    ...world,
    frame: world.frame + 1,
    impacts: world.impacts
      .map((impact) => ({ ...impact, age: impact.age + 1 }))
      .filter((impact) => impact.age < IMPACT_LIFETIME),
    pellets: world.pellets.map((pellet) => ({ ...pellet })),
  };

  for (const impact of next.impacts) {
    for (const pellet of next.pellets) {
      const dx = pellet.x - impact.x;
      const dy = pellet.y - impact.y;
      const dist = Math.max(0.25, Math.hypot(dx, dy));
      if (dist > IMPULSE_RADIUS) {
        continue;
      }
      const push = (1 - dist / IMPULSE_RADIUS) * IMPULSE_STRENGTH;
      pellet.vx -= (dx / dist) * push;
      pellet.vy -= (dy / dist) * push;
    }
  }

  for (const pellet of next.pellets) {
    const sway = Math.sin(next.frame * 0.11 + pellet.id * 0.9) * 0.004;
    const wobble = Math.cos(next.frame * 0.09 + pellet.id * 1.2) * 0.004;
    pellet.vx = clamp(pellet.vx + sway, -0.19, 0.19);
    pellet.vy = clamp(pellet.vy + wobble, -0.19, 0.19);
    pellet.x += pellet.vx;
    pellet.y += pellet.vy;

    if (pellet.x < 1.5 || pellet.x > COLS - 2.5) {
      pellet.vx *= -1;
      pellet.x = clamp(pellet.x, 1.5, COLS - 2.5);
    }
    if (pellet.y < 1.5 || pellet.y > ROWS - 2.5) {
      pellet.vy *= -1;
      pellet.y = clamp(pellet.y, 1.5, ROWS - 2.5);
    }
  }

  for (let index = 0; index < next.pellets.length; index += 1) {
    for (let compare = index + 1; compare < next.pellets.length; compare += 1) {
      const first = next.pellets[index];
      const second = next.pellets[compare];
      const dist = distance(first.x, first.y, second.x, second.y);
      if (dist > 0.95) {
        continue;
      }

      const relative = Math.hypot(first.vx - second.vx, first.vy - second.vy);
      const nx = (first.x - second.x) / Math.max(0.2, dist);
      const ny = (first.y - second.y) / Math.max(0.2, dist);
      const bump = Math.max(0.035, relative * 0.5);
      first.vx += nx * bump;
      first.vy += ny * bump;
      second.vx -= nx * bump;
      second.vy -= ny * bump;

      const collisionX = (first.x + second.x) * 0.5;
      const collisionY = (first.y + second.y) * 0.5;
      const shockDriven = next.impacts.some(
        (impact) => distance(impact.x, impact.y, collisionX, collisionY) < IMPULSE_RADIUS - 0.4,
      );

      if (shockDriven && relative > 0.11 && (first.kind === "salt" || second.kind === "salt")) {
        first.kind = "fresh";
        second.kind = "fresh";
      }
    }
  }

  return next;
}

function cellFor(x: number, y: number, frame: number): CellInfo {
  const vertical = x % 4 === 0;
  const horizontal = y % 3 === 0;
  if (vertical && horizontal) {
    return { char: "╬", color: TEXT, background: SHELF_BACKGROUND, borderColor: BORDER };
  }
  if (vertical) {
    return { char: "║", color: TEXT, background: CHANNEL_BACKGROUND, borderColor: BORDER };
  }
  if (horizontal) {
    return { char: "═", color: TEXT, background: SHELF_BACKGROUND, borderColor: BORDER };
  }
  const bubbles = ["·", ":", "°", "•"];
  return {
    char: bubbles[(x * 3 + y * 5 + frame) % bubbles.length],
    color: "rgba(12, 65, 96, 0.7)",
    background: CELL_BACKGROUND,
    borderColor: BORDER,
  };
}

function createSnapshot(world: World): Snapshot {
  const cells = Array.from({ length: COLS * ROWS }, (_, index) => {
    const x = index % COLS;
    const y = Math.floor(index / COLS);
    return cellFor(x, y, world.frame);
  });

  for (const impact of world.impacts) {
    const radius = Math.min(3, 1 + impact.age * 0.4);
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const dist = distance(x, y, impact.x, impact.y);
        if (dist > radius || dist < radius - 1.25) {
          continue;
        }
        cells[y * COLS + x] = {
          char: dist < 0.8 ? "!" : "※",
          color: IMPACT,
          background: "#ffd183",
          borderColor: BORDER,
        };
      }
    }
  }

  for (const pellet of world.pellets) {
    const x = clamp(Math.round(pellet.x), 0, COLS - 1);
    const y = clamp(Math.round(pellet.y), 0, ROWS - 1);
    cells[y * COLS + x] = {
      char: pellet.kind === "salt" ? "◉" : "▣",
      color: pellet.kind === "salt" ? SALT : FRESH,
      background: pellet.kind === "salt" ? "#ffe09f" : "#bdf7ff",
      borderColor: BORDER,
    };
  }

  const freshCount = world.pellets.filter((pellet) => pellet.kind === "fresh").length;
  const saltCount = world.pellets.length - freshCount;
  const brinePercent = Math.max(8, 92 - freshCount * 9 - Math.floor(world.shocks / 2));

  return {
    frame: world.frame,
    shocks: world.shocks,
    saltCount,
    freshCount,
    brinePercent,
    cells,
  };
}

function clientToGrid(client: number, offset: number, size: number, grid: number): number {
  return clamp(Math.floor(((client - offset) / size) * grid), 0, grid - 1);
}

export default function BrineCandyRack() {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [initialWorld] = useState<World>(() => createWorld());
  const worldRef = useRef<World>(initialWorld);
  const [snapshot, setSnapshot] = useState<Snapshot>(() => createSnapshot(initialWorld));
  const snapshotRef = useRef<Snapshot>(snapshot);

  const advanceWorld = useCallback((steps: number) => {
    const safeSteps = Math.max(0, Math.floor(steps));
    if (safeSteps === 0) {
      return;
    }
    let next = worldRef.current;
    for (let step = 0; step < safeSteps; step += 1) {
      next = stepWorld(next);
    }
    worldRef.current = next;
    snapshotRef.current = createSnapshot(next);
    setSnapshot(snapshotRef.current);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      advanceWorld(1);
    }, STEP_INTERVAL);

    window.brine_candy_rack_render_to_text = () => {
      const current = snapshotRef.current;
      return `brine-candy-rack|fresh:${current.freshCount}|salt:${current.saltCount}|brine:${current.brinePercent}|shocks:${current.shocks}|frame:${current.frame}`;
    };

    window.brine_candy_rack_advance = (steps: number) => {
      advanceWorld(steps);
    };

    return () => {
      window.clearInterval(interval);
      delete window.brine_candy_rack_render_to_text;
      delete window.brine_candy_rack_advance;
    };
  }, [advanceWorld]);

  const shock = useCallback((clientX: number, clientY: number) => {
    const grid = gridRef.current;
    if (!grid) {
      return;
    }
    const rect = grid.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const x = clientToGrid(clientX, rect.left, rect.width, COLS);
    const y = clientToGrid(clientY, rect.top, rect.height, ROWS);
    const next: World = {
      ...worldRef.current,
      nextImpactId: worldRef.current.nextImpactId + 1,
      shocks: worldRef.current.shocks + 1,
      impacts: [
        ...worldRef.current.impacts.slice(-(MAX_IMPACTS - 1)),
        { id: worldRef.current.nextImpactId, x, y, age: 0 },
      ],
    };
    worldRef.current = next;
    snapshotRef.current = createSnapshot(next);
    setSnapshot(snapshotRef.current);
  }, []);

  const cells = useMemo(
    () =>
      snapshot.cells.map((cell, index) => (
        <span
          key={index}
          className="grid place-items-center border text-[clamp(9px,1.55vw,16px)] leading-none"
          style={{
            color: cell.color,
            background: cell.background,
            borderColor: cell.borderColor,
          }}
        >
          {cell.char}
        </span>
      )),
    [snapshot.cells],
  );

  const brineTone = snapshot.brinePercent > 60 ? "#ff5f3d" : snapshot.brinePercent > 30 ? "#ff8c1a" : "#135eff";
  const status = snapshot.saltCount === 0 ? "fresh stock ready" : snapshot.freshCount > 0 ? "fermenting clean cups" : "slap pellets together";

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden border-[3px] p-3 font-mono uppercase"
      style={{
        background: BASE_BACKGROUND,
        borderColor: BORDER,
        color: TEXT,
      }}
    >
      <div className="mb-3 grid grid-cols-[1fr_auto] gap-3 border-b-2 pb-2 text-[10px] tracking-[0.18em] sm:text-[11px]" style={{ borderColor: BORDER }}>
        <div>
          <div>Port sweetwater inventory</div>
          <div className="mt-1 text-[9px] tracking-[0.12em] sm:text-[10px]">tap rack to bruise the weather</div>
        </div>
        <div className="text-right">
          <div>fresh {snapshot.freshCount.toString().padStart(2, "0")}</div>
          <div>salt {snapshot.saltCount.toString().padStart(2, "0")}</div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-[1fr_auto] gap-3 text-[10px] sm:text-[11px]">
        <div className="border-2 px-2 py-1" style={{ borderColor: BORDER, background: "#bdf7ff" }}>
          rack status · {status}
        </div>
        <div className="border-2 px-2 py-1 text-right" style={{ borderColor: BORDER, background: "#ffd183", color: brineTone }}>
          red brine meter {snapshot.brinePercent}%
        </div>
      </div>

      <div
        ref={gridRef}
        className="grid min-h-0 flex-1 cursor-crosshair touch-none gap-px border-2 p-[3px]"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
          borderColor: BORDER,
          background: BORDER,
        }}
        onPointerDown={(event) => shock(event.clientX, event.clientY)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }
          event.preventDefault();
          const grid = gridRef.current;
          if (!grid) {
            return;
          }
          const rect = grid.getBoundingClientRect();
          shock(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }}
        role="application"
        tabIndex={0}
        aria-label="Brine candy rack. Tap the inventory grid to knock the salty pellets into clean cups."
      >
        {cells}
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3 text-[10px] tracking-[0.16em] sm:text-[11px]">
        <span className="border-2 px-2 py-1" style={{ borderColor: BORDER, background: "#fff799" }}>
          shocks {snapshot.shocks.toString().padStart(2, "0")}
        </span>
        <div className="h-4 border-2" style={{ borderColor: BORDER, background: "#fff799" }}>
          <div
            className="h-full"
            style={{
              width: `${snapshot.brinePercent}%`,
              background: brineTone,
            }}
          />
        </div>
        <span className="border-2 px-2 py-1" style={{ borderColor: BORDER, background: "#bdf7ff" }}>
          no waste
        </span>
      </div>
    </div>
  );
}
