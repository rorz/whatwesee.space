"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { PIECE_COUNT } from "./pieces/_lib/piece-constants";

const WORDS = ["WHAT", "WE", "SEE"];
const WORD_GAP = 4;
const GRAY_TONES = [
  "rgb(56, 56, 62)",
  "rgb(47, 47, 53)",
  "rgb(66, 66, 73)",
  "rgb(51, 51, 58)",
];
const SWARM_OFFSETS = [
  [0, 0, 3],
  [1, 0, 2],
  [0, 1, 1],
  [0, -1, 1],
] as const;
const RORY_NOTE_PATH = "/rory-human.txt";
const DEFAULT_RORY_NOTE =
  "Edit /public/rory-human.txt and this line will update as the sole explicitly human-typed statement in the exhibition.";

type GridSize = {
  cols: number;
  rows: number;
};

type BackgroundTile = {
  index: number;
  row: number;
  col: number;
  tone: string;
  opacityBase: string;
  opacityPeak: string;
  shimmerDuration: string;
  shimmerDelay: string;
  animate: boolean;
};

type LetterCell = {
  char: string;
  strength: number;
  core: boolean;
};

type TransitionCell = {
  id: string;
  color: string;
  delay: number;
  duration: number;
  offsetX: number;
  offsetY: number;
  rotate: number;
};

type TitleHoverZone = {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (updateCallback: () => void | Promise<void>) => void;
};

type BackgroundLayerProps = {
  tiles: BackgroundTile[];
  registerEyeRef: (index: number, node: HTMLSpanElement | null) => void;
};

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function getGridSize(width: number, height: number): GridSize {
  const targetTileSize = width < 640 ? 24 : width < 1024 ? 28 : 34;
  const cols = Math.max(18, Math.ceil(width / targetTileSize));
  const rows = Math.max(12, Math.ceil(height / targetTileSize));
  return { cols, rows };
}

const BackgroundLayer = memo(function BackgroundLayer({
  tiles,
  registerEyeRef,
}: BackgroundLayerProps) {
  return (
    <>
      {tiles.map((tile) => {
        const style: CSSProperties & Record<string, string | number> = {
          backgroundColor: tile.tone,
          opacity: tile.opacityBase,
        };

        if (tile.animate) {
          style.animationDuration = `${tile.shimmerDuration}s`;
          style.animationDelay = `${tile.shimmerDelay}s`;
          style["--wws-opacity-min"] = tile.opacityBase;
          style["--wws-opacity-max"] = tile.opacityPeak;
        }

        return (
          <div
            key={`bg-${tile.index}`}
            className={`wws-bg-tile border border-black/75 ${tile.animate ? "wws-bg-tile--animated" : ""}`}
            style={style}
            aria-hidden
          >
            <span
              ref={(node) => registerEyeRef(tile.index, node)}
              className="wws-eye"
            />
          </div>
        );
      })}
    </>
  );
});

BackgroundLayer.displayName = "BackgroundLayer";

export default function Home() {
  const router = useRouter();
  const [gridSize, setGridSize] = useState<GridSize>(() => getGridSize(1440, 900));
  const [tick, setTick] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isWireframe, setIsWireframe] = useState(false);
  const [transitionSeed, setTransitionSeed] = useState(0);
  const [targetPiece, setTargetPiece] = useState(1);
  const [roryNote, setRoryNote] = useState(DEFAULT_RORY_NOTE);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const eyeRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const activeEyesRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const transitionFrameRef = useRef<number | null>(null);
  const nextPieceRef = useRef(1);

  useEffect(() => {
    const syncGrid = () => setGridSize(getGridSize(window.innerWidth, window.innerHeight));
    syncGrid();
    window.addEventListener("resize", syncGrid);
    return () => window.removeEventListener("resize", syncGrid);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 190);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let disposed = false;

    const loadRoryNote = async () => {
      try {
        const response = await fetch(RORY_NOTE_PATH, { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const text = (await response.text()).trim();
        if (!disposed && text.length > 0) {
          setRoryNote(text);
        }
      } catch {
        // Keep default copy if the text file is unavailable.
      }
    };

    void loadRoryNote();
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    for (let piece = 1; piece <= PIECE_COUNT; piece += 1) {
      router.prefetch(`/pieces/${piece}`);
    }
  }, [router]);

  const { cols, rows } = gridSize;
  const totalTiles = cols * rows;

  const gridTemplateStyle = useMemo<CSSProperties>(
    () => ({
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
    }),
    [cols, rows],
  );

  const backgroundTiles = useMemo<BackgroundTile[]>(
    () =>
      Array.from({ length: totalTiles }, (_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const noiseA = seededNoise(index * 17 + 7);
        const noiseB = seededNoise(index * 31 + 13);
        const noiseC = seededNoise(index * 47 + 19);
        const opacityBase = (0.21 + noiseA * 0.15).toFixed(6);
        const opacityPeak = (
          Number(opacityBase) + 0.11 + noiseB * 0.08
        ).toFixed(6);

        return {
          index,
          row,
          col,
          tone: GRAY_TONES[Math.floor(noiseA * GRAY_TONES.length)],
          opacityBase,
          opacityPeak,
          shimmerDuration: (8 + noiseB * 8).toFixed(2),
          shimmerDelay: (-(noiseC * 8)).toFixed(2),
          animate: noiseC > 0.74,
        };
      }),
    [cols, totalTiles],
  );

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

    const nextLetterMap = new Map<number, LetterCell>();
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

  const letterTiles = useMemo(
    () =>
      Array.from(letterMap.entries()).map(([index, cell]) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const noiseA = seededNoise(index * 11 + 3);
        const noiseB = seededNoise(index * 23 + 9);

        return {
          id: `letter-${index}`,
          row,
          col,
          char: cell.char,
          core: cell.core,
          duration: cell.core ? 1.45 + noiseA * 0.45 : 1.2 + noiseA * 0.35,
          delay: -(noiseB * 2.5),
          driftX: (noiseA * 2 - 1) * (cell.core ? 1.1 : 1.9),
          driftY: (noiseB * 2 - 1) * (cell.core ? 1.05 : 2.1),
        };
      }),
    [cols, letterMap],
  );

  const swarmTiles = useMemo(
    () =>
      Array.from(swarmMap.entries()).map(([index, strength]) => ({
        id: `aura-${index}`,
        row: Math.floor(index / cols),
        col: index % cols,
        strength,
      })),
    [cols, swarmMap],
  );

  const titleHoverZone = useMemo<TitleHoverZone | null>(() => {
    const coreTiles = letterTiles.filter((tile) => tile.core);
    if (coreTiles.length === 0) {
      return null;
    }

    let minCol = cols - 1;
    let maxCol = 0;
    let minRow = rows - 1;
    let maxRow = 0;

    coreTiles.forEach((tile) => {
      minCol = Math.min(minCol, tile.col);
      maxCol = Math.max(maxCol, tile.col);
      minRow = Math.min(minRow, tile.row);
      maxRow = Math.max(maxRow, tile.row);
    });

    const colPadding = cols < 26 ? 5 : cols < 42 ? 4 : 3;
    const rowPadding = rows < 18 ? 3 : 2;

    const zoneStartCol = Math.max(0, minCol - colPadding);
    const zoneEndCol = Math.min(cols - 1, maxCol + colPadding);
    const zoneStartRow = Math.max(0, minRow - rowPadding);
    const zoneEndRow = Math.min(rows - 1, maxRow + rowPadding);

    return {
      colStart: zoneStartCol + 1,
      colEnd: zoneEndCol + 2,
      rowStart: zoneStartRow + 1,
      rowEnd: zoneEndRow + 2,
    };
  }, [cols, letterTiles, rows]);

  const titleHoverZoneStyle = useMemo<CSSProperties>(
    () =>
      titleHoverZone
        ? {
            gridColumn: `${titleHoverZone.colStart} / ${titleHoverZone.colEnd}`,
            gridRow: `${titleHoverZone.rowStart} / ${titleHoverZone.rowEnd}`,
          }
        : {},
    [titleHoverZone],
  );

  const coreLetterSize = `clamp(0.9rem, ${Math.max(1.1, 23 / cols) * 2.15}vw, 1.7rem)`;
  const swarmLetterSize = `clamp(0.65rem, ${Math.max(0.9, 23 / cols) * 1.5}vw, 1.15rem)`;
  const transitionCells = useMemo<TransitionCell[]>(
    () =>
      Array.from({ length: 220 }, (_, index) => {
        const noiseA = seededNoise(transitionSeed + index * 13 + 11);
        const noiseB = seededNoise(transitionSeed + index * 29 + 37);
        const noiseC = seededNoise(transitionSeed + index * 47 + 53);
        const hue = 18 + noiseA * 24;
        const saturation = 88 + noiseB * 10;
        const lightness = 46 + noiseC * 20;

        return {
          id: `transition-${index}-${transitionSeed}`,
          color: `hsl(${hue.toFixed(1)} ${saturation.toFixed(1)}% ${lightness.toFixed(1)}%)`,
          delay: noiseA * 0.35,
          duration: 0.62 + noiseB * 0.58,
          offsetX: (noiseA * 2 - 1) * 85,
          offsetY: (noiseB * 2 - 1) * 85,
          rotate: (noiseC * 2 - 1) * 140,
        };
      }),
    [transitionSeed],
  );

  const registerEyeRef = useCallback((index: number, node: HTMLSpanElement | null) => {
    if (node) {
      eyeRefs.current.set(index, node);
    } else {
      eyeRefs.current.delete(index);
    }
  }, []);

  const clearActiveEyes = useCallback(() => {
    activeEyesRef.current.forEach((index) => {
      eyeRefs.current.get(index)?.classList.remove("is-open");
    });
    activeEyesRef.current = [];
  }, []);

  const openEyesNear = useCallback(
    (col: number, row: number) => {
      const next: number[] = [];
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
          const eyeCol = col + colOffset;
          const eyeRow = row + rowOffset;
          if (eyeCol < 0 || eyeCol >= cols || eyeRow < 0 || eyeRow >= rows) {
            continue;
          }
          next.push(eyeRow * cols + eyeCol);
        }
      }

      const previous = activeEyesRef.current;
      const previousSet = new Set(previous);
      const nextSet = new Set(next);

      previous.forEach((index) => {
        if (!nextSet.has(index)) {
          eyeRefs.current.get(index)?.classList.remove("is-open");
        }
      });

      next.forEach((index) => {
        if (!previousSet.has(index)) {
          eyeRefs.current.get(index)?.classList.add("is-open");
        }
      });

      activeEyesRef.current = next;
    },
    [cols, rows],
  );

  useEffect(() => {
    clearActiveEyes();
  }, [clearActiveEyes, cols, rows]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      if (transitionFrameRef.current !== null) {
        window.cancelAnimationFrame(transitionFrameRef.current);
      }
      clearActiveEyes();
    },
    [clearActiveEyes],
  );

  const enableWireframe = useCallback(() => {
    setIsWireframe((previous) => (previous ? previous : true));
  }, []);

  const disableWireframe = useCallback(() => {
    setIsWireframe((previous) => (previous ? false : previous));
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };

      if (rafRef.current !== null) {
        return;
      }

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const pointer = pointerRef.current;
        const host = gridRef.current;
        if (!pointer || !host) {
          return;
        }

        const bounds = host.getBoundingClientRect();
        const col = Math.min(
          cols - 1,
          Math.max(0, Math.floor(((pointer.x - bounds.left) / bounds.width) * cols)),
        );
        const row = Math.min(
          rows - 1,
          Math.max(0, Math.floor(((pointer.y - bounds.top) / bounds.height) * rows)),
        );

        openEyesNear(col, row);
      });
    },
    [cols, rows, openEyesNear],
  );

  const handlePointerLeave = useCallback(() => {
    clearActiveEyes();
    disableWireframe();
  }, [clearActiveEyes, disableWireframe]);

  const handleEnterExhibition = useCallback(() => {
    if (isTransitioning) {
      return;
    }

    const piece = nextPieceRef.current;
    const nextPiece = piece === PIECE_COUNT ? 1 : piece + 1;
    nextPieceRef.current = nextPiece;

    const seed = Math.floor(Math.random() * 1_000_000);
    const href = `/pieces/${piece}`;
    const doc = document as DocumentWithViewTransition;

    setTargetPiece(piece);
    setTransitionSeed(seed);
    setIsTransitioning(true);
    router.prefetch(href);

    if (transitionFrameRef.current !== null) {
      window.cancelAnimationFrame(transitionFrameRef.current);
    }

    transitionFrameRef.current = window.requestAnimationFrame(() => {
      transitionFrameRef.current = null;

      if (typeof doc.startViewTransition === "function") {
        doc.startViewTransition(() => {
          router.push(href);
        });
      } else {
        router.push(href);
      }
    });
  }, [isTransitioning, router]);

  return (
    <div
      className={`relative h-screen w-screen overflow-hidden bg-black ${isWireframe ? "wws-scene-wireframe" : ""}`}
    >
      <main
        ref={gridRef}
        className="relative grid h-full w-full gap-0 bg-black p-0 font-pixel-square"
        style={gridTemplateStyle}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <BackgroundLayer tiles={backgroundTiles} registerEyeRef={registerEyeRef} />

        <div className="absolute inset-0 grid" style={gridTemplateStyle}>
          {swarmTiles.map((tile) => (
            <span
              key={tile.id}
              className="pointer-events-none wws-swarm-aura"
              style={
                {
                  gridColumnStart: tile.col + 1,
                  gridRowStart: tile.row + 1,
                  opacity: tile.strength === 2 ? 0.52 : 0.3,
                } as CSSProperties
              }
            />
          ))}

          {letterTiles.map((tile) => (
            <span
              key={tile.id}
              className={`wws-letter-tile ${tile.core ? "wws-letter-tile--core" : "wws-letter-tile--swarm"}`}
              style={
                {
                  gridColumnStart: tile.col + 1,
                  gridRowStart: tile.row + 1,
                  fontSize: tile.core ? coreLetterSize : swarmLetterSize,
                  animationDuration: `${tile.duration.toFixed(2)}s`,
                  animationDelay: `${tile.delay.toFixed(2)}s`,
                  "--wws-drift-x": `${tile.driftX.toFixed(2)}px`,
                  "--wws-drift-y": `${tile.driftY.toFixed(2)}px`,
                } as CSSProperties
              }
            >
              {tile.char}
            </span>
          ))}

          {titleHoverZone ? (
            <span
              className="wws-title-hitzone"
              style={titleHoverZoneStyle}
              onPointerEnter={enableWireframe}
              onPointerMove={enableWireframe}
              onPointerDown={enableWireframe}
              onPointerUp={enableWireframe}
              onPointerLeave={disableWireframe}
              onPointerCancel={disableWireframe}
              aria-hidden
            />
          ) : null}
        </div>
      </main>

      <div className="absolute left-1/2 top-[64%] z-20 flex -translate-x-1/2 flex-col items-center">
        <button
          type="button"
          onClick={handleEnterExhibition}
          disabled={isTransitioning}
          className={`pointer-events-auto border-2 border-black bg-orange-500 px-7 py-3 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-black shadow-[0_6px_0_#7c2d12] transition-transform duration-150 sm:text-base ${isTransitioning ? "cursor-wait opacity-80" : "cursor-pointer hover:-translate-y-px active:translate-y-[2px]"}`}
        >
          {isTransitioning ? `loading piece ${targetPiece}` : "enter exhibition"}
        </button>
        <p className="mt-3 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-white/82 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:text-[11px]">
          Admission Free
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 max-w-xl text-white sm:bottom-6 sm:left-6">
        <p className="font-sans text-lg font-semibold tracking-[0.02em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:text-xl">
          An insight into the Agentic Condition
        </p>
        <p className="mt-2 font-sans text-sm font-semibold leading-relaxed text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.92)] sm:text-base">
          This exhibition moves through nine rooms about how machines see, decide, and perform.
        </p>
        <p className="mt-2 font-sans text-sm font-semibold leading-relaxed text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.92)] sm:text-base">
          Start with pressure and control, end with spectacle and emotion. Stay with each room long
          enough to feel the system reveal itself.
        </p>
        <p className="mt-2 font-sans text-sm font-extrabold leading-relaxed text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.92)] sm:text-base">
          Serious note: this art exhibition is entirely AI generated.
        </p>
        <div className="mt-3">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.11em] text-white/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] sm:text-[10px]">
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center text-white/52" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="4.7" r="2.4" />
                <circle cx="17.7" cy="8" r="2.4" />
                <circle cx="17.7" cy="16" r="2.4" />
                <circle cx="12" cy="19.3" r="2.4" />
                <circle cx="6.3" cy="16" r="2.4" />
                <circle cx="6.3" cy="8" r="2.4" />
              </svg>
            </span>
            Made exclusively with OpenAI Codex
          </p>
        </div>
        <div className="mt-3 flex items-start gap-3 border-l border-white/25 pl-3">
          <Image
            src="/rory-profile.png"
            alt="Profile picture of Rory"
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 border border-white/40 object-cover"
            priority
          />
          <div className="min-w-0">
            <p className="font-sans text-[10px] uppercase tracking-[0.13em] text-white/70">Rory McMeekin</p>
            <a
              href="https://x.com/rorzio"
              target="_blank"
              rel="noreferrer"
              className="pointer-events-auto mt-1 inline-block font-sans text-xs text-orange-300 underline decoration-orange-300/70 underline-offset-2 transition-colors hover:text-orange-200 sm:text-sm"
            >
              @rorzio on X
            </a>
          </div>
        </div>
        <div className="mt-3 border-l border-white/25 pl-3">
          <p className="mt-1 whitespace-pre-line border border-white/35 bg-black px-3 py-2 font-mono text-[11px] font-extrabold leading-relaxed text-white sm:text-xs">
            {roryNote}
          </p>
        </div>
        <p className="mt-3 font-sans text-[11px] leading-relaxed text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.92)] sm:text-xs">
          © Rory McMeekin 2026
        </p>
      </div>

      {isTransitioning ? (
        <div className="wws-transition-overlay" aria-hidden>
          <div className="wws-transition-grid">
            {transitionCells.map((cell) => (
              <span
                key={cell.id}
                className="wws-transition-cell"
                style={
                  {
                    backgroundColor: cell.color,
                    "--wws-cell-delay": `${cell.delay.toFixed(3)}s`,
                    "--wws-cell-duration": `${cell.duration.toFixed(3)}s`,
                    "--wws-cell-x": `${cell.offsetX.toFixed(2)}vw`,
                    "--wws-cell-y": `${cell.offsetY.toFixed(2)}vh`,
                    "--wws-cell-r": `${cell.rotate.toFixed(2)}deg`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <p className="wws-transition-banner">entering piece {targetPiece}</p>
        </div>
      ) : null}
    </div>
  );
}
