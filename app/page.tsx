"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

const WORDS = ["WHAT", "WE", "SEE"];
const WORD_GAP = 4;
const GRAY_TONES = ["#151517", "#101012", "#1a1a1d", "#131316"];
const SWARM_OFFSETS = [
  [0, 0, 3],
  [1, 0, 2],
  [0, 1, 1],
  [0, -1, 1],
] as const;

type GridSize = {
  cols: number;
  rows: number;
};

type PointerCell = {
  col: number;
  row: number;
} | null;

function getGridSize(width: number, height: number): GridSize {
  const targetTileSize = width < 640 ? 24 : width < 1024 ? 28 : 34;
  const minCols = 18;
  const cols = Math.max(minCols, Math.ceil(width / targetTileSize));
  const rows = Math.max(12, Math.ceil(height / targetTileSize));

  return { cols, rows };
}

export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  const [gridSize, setGridSize] = useState<GridSize>(() => getGridSize(1440, 900));
  const [pointerCell, setPointerCell] = useState<PointerCell>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const syncGrid = () => setGridSize(getGridSize(window.innerWidth, window.innerHeight));

    syncGrid();
    window.addEventListener("resize", syncGrid);
    return () => window.removeEventListener("resize", syncGrid);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 190);

    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  const { cols, rows } = gridSize;

  const { letterMap, swarmMap } = useMemo(() => {
    const totalSpan =
      WORDS.reduce((sum, word) => sum + word.length, 0) + WORD_GAP * (WORDS.length - 1);
    const startCol = Math.floor((cols - totalSpan) / 2);
    const centerRow = Math.floor(rows / 2);
    const rowSwing = Math.min(2, Math.floor(rows / 8));
    const baseRow = centerRow + Math.round(Math.sin(tick * 0.13) * rowSwing);
    const orbitRing = [
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
    ] as const;

    const nextLetterMap = new Map<number, { char: string; strength: number; core: boolean }>();
    const nextSwarmMap = new Map<number, number>();

    const setLetterTile = (
      col: number,
      row: number,
      char: string,
      strength: number,
      core: boolean,
    ) => {
      if (col < 0 || col >= cols || row < 0 || row >= rows) {
        return;
      }

      const tileIndex = row * cols + col;
      const current = nextLetterMap.get(tileIndex);
      if (!current || strength > current.strength || (core && !current.core)) {
        nextLetterMap.set(tileIndex, { char, strength, core });
      }
    };

    const letters: Array<{ char: string; col: number; sequence: number }> = [];
    let cursor = startCol;
    let sequence = 0;
    WORDS.forEach((word, wordIndex) => {
      [...word].forEach((char, charIndex) => {
        letters.push({ char, col: cursor + charIndex, sequence });
        sequence += 1;
      });
      cursor += word.length + (wordIndex < WORDS.length - 1 ? WORD_GAP : 0);
    });

    letters.forEach(({ char, col, sequence: charIndex }) => {
      const bob = Math.round(Math.sin((tick + charIndex) * 0.17));
      const row = baseRow + bob;
      const orbit = orbitRing[(Math.floor(tick / 2) + charIndex * 2) % orbitRing.length];
      const orbitDx = orbit[0];
      const orbitDy = orbit[1];

      SWARM_OFFSETS.forEach(([dx, dy, strength], offsetIndex) => {
        const swarmCol =
          col + dx + (offsetIndex === 1 ? orbitDx : 0) + (offsetIndex === 2 ? orbitDy : 0);
        const swarmRow =
          row + dy + (offsetIndex === 1 ? orbitDy : 0) + (offsetIndex === 3 ? -orbitDx : 0);
        const isCore = dx === 0 && dy === 0;

        setLetterTile(swarmCol, swarmRow, char, strength, isCore);

        const auraOffsets = [
          [0, 1],
          [0, -1],
        ] as const;

        auraOffsets.forEach(([ax, ay]) => {
          const auraCol = swarmCol + ax;
          const auraRow = swarmRow + ay;
          if (auraCol < 0 || auraCol >= cols || auraRow < 0 || auraRow >= rows) {
            return;
          }

          const auraIndex = auraRow * cols + auraCol;
          if (!nextLetterMap.has(auraIndex)) {
            nextSwarmMap.set(
              auraIndex,
              Math.max(strength - 1, nextSwarmMap.get(auraIndex) ?? 0),
            );
          }
        });
      });
    });

    return { letterMap: nextLetterMap, swarmMap: nextSwarmMap };
  }, [cols, rows, tick]);

  const totalTiles = cols * rows;
  const coreLetterSize = `clamp(0.9rem, ${Math.max(1.1, 23 / cols) * 2.15}vw, 1.7rem)`;
  const swarmLetterSize = `clamp(0.65rem, ${Math.max(0.9, 23 / cols) * 1.5}vw, 1.15rem)`;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <main
        className="grid h-full w-full gap-0 bg-black p-0 font-pixel-square"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const col = Math.min(
            cols - 1,
            Math.max(0, Math.floor(((event.clientX - bounds.left) / bounds.width) * cols)),
          );
          const row = Math.min(
            rows - 1,
            Math.max(0, Math.floor(((event.clientY - bounds.top) / bounds.height) * rows)),
          );

          setPointerCell({ col, row });
        }}
        onPointerLeave={() => setPointerCell(null)}
      >
        {Array.from({ length: totalTiles }, (_, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          const letterTile = letterMap.get(index);
          const swarmStrength = swarmMap.get(index) ?? 0;
          const baseClass =
            "relative flex select-none items-center justify-center border border-black/70";

          if (letterTile) {
            const isCore = letterTile.core;
            return (
              <motion.div
                key={`tile-${index}`}
                className={`${baseClass} font-black leading-none text-black ${isCore ? "bg-[#d7ff4a]" : "bg-[#b6f72a]"}`}
                style={{ fontSize: isCore ? coreLetterSize : swarmLetterSize }}
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { scale: isCore ? [0.95, 1.06, 0.97] : [0.9, 1, 0.92] }
                }
                transition={
                  prefersReducedMotion
                    ? undefined
                    : {
                        duration: isCore ? 1.4 : 1.15,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: (index % cols) * 0.02,
                      }
                }
              >
                {letterTile.char}
              </motion.div>
            );
          }

          const primaryNoise =
            Math.sin((index + 1) * 12.9898 + tick * 0.36 + row * 0.21 + col * 0.17) *
            43758.5453;
          const secondaryNoise =
            Math.sin((index + 5) * 78.233 + tick * 0.22 + row * 0.11 + col * 0.27) *
            12515.8731;
          const randomA = primaryNoise - Math.floor(primaryNoise);
          const randomB = secondaryNoise - Math.floor(secondaryNoise);
          const shimmer = 0.22 + randomA * 0.2;
          const isEyeOpen =
            pointerCell !== null &&
            Math.abs(pointerCell.row - row) <= 1 &&
            Math.abs(pointerCell.col - col) <= 1;

          const backgroundColor =
            swarmStrength === 2
              ? "#84cc16"
              : swarmStrength === 1
                ? "#65a30d"
                : GRAY_TONES[Math.floor(randomB * GRAY_TONES.length)];

          return (
            <div
              key={`tile-${index}`}
              className={baseClass}
              style={{
                backgroundColor,
                opacity: swarmStrength > 0 ? 1 : shimmer,
              }}
              aria-hidden
            >
              <span
                className={`pointer-events-none absolute flex w-2/3 items-center justify-center gap-[22%] transition-all duration-150 ${isEyeOpen ? "scale-y-100 opacity-100" : "scale-y-[0.15] opacity-0"}`}
              >
                <span className="h-[18%] w-[18%] rounded-full bg-black/80" />
                <span className="h-[18%] w-[18%] rounded-full bg-black/80" />
              </span>
            </div>
          );
        })}
      </main>

      <div className="absolute left-1/2 top-[72%] flex -translate-x-1/2 flex-col items-center gap-3">
        <p className="pointer-events-none bg-black px-5 py-3 font-sans text-base tracking-[0.08em] text-white sm:text-lg md:text-xl">
          An insight into the agentic mind
        </p>
        <motion.button
          type="button"
          className="pointer-events-auto border-2 border-black bg-orange-500 px-6 py-3 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-black shadow-[0_6px_0_#7c2d12] sm:text-base"
          whileHover={prefersReducedMotion ? undefined : { scale: 1.04, y: -1 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.98, y: 2 }}
        >
          enter exhibition
        </motion.button>
      </div>
    </div>
  );
}
