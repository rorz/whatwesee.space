"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    shell_law_render_to_text?: () => string;
    shell_law_advance?: (steps: number) => void;
  }
}

const LAWS = [
  { n: 48, text: "ASSUME FORMLESSNESS" },
  { n: 33, text: "DISCOVER EACH MAN'S WEAKNESS" },
  { n: 20, text: "DO NOT COMMIT TO ANYONE" },
  { n: 17, text: "KEEP OTHERS IN SUSPENDED TERROR" },
  { n: 15, text: "CRUSH YOUR ENEMY TOTALLY" },
  { n: 11, text: "KEEP PEOPLE DEPENDENT ON YOU" },
  { n: 9, text: "WIN THROUGH ACTIONS, NEVER ARGUMENT" },
  { n: 7, text: "GET OTHERS TO DO THE WORK — TAKE THE CREDIT" },
  { n: 6, text: "COURT ATTENTION AT ALL COSTS" },
  { n: 5, text: "GUARD YOUR REPUTATION WITH YOUR LIFE" },
  { n: 3, text: "CONCEAL YOUR INTENTIONS" },
  { n: 1, text: "NEVER OUTSHINE THE MASTER" },
];

const BAND_COLORS = [
  "#e4e1dc",
  "#d4d1cc",
  "#c4c1bc",
  "#b0adaa",
  "#9c9998",
  "#888886",
  "#767472",
  "#646260",
  "#52504e",
  "#3e3c3a",
  "#2e2c2a",
  "#1e1c1a",
];

export default function ShellLaw() {
  const [erased, setErased] = useState<ReadonlySet<number>>(new Set());
  const erasedRef = useRef<ReadonlySet<number>>(new Set());
  const bandsRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    erasedRef.current = erased;
  }, [erased]);

  const eraseAtY = useCallback((clientY: number) => {
    const el = bandsRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rel = (clientY - rect.top) / rect.height;
    const index = Math.max(0, Math.min(LAWS.length - 1, Math.floor(rel * LAWS.length)));
    if (!erasedRef.current.has(index)) {
      setErased(prev => new Set([...prev, index]));
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      eraseAtY(e.clientY);
    },
    [eraseAtY],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging.current && e.buttons > 0) eraseAtY(e.clientY);
    },
    [eraseAtY],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleReset = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setErased(new Set());
  }, []);

  useEffect(() => {
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointerup", onUp);

    window.shell_law_render_to_text = () =>
      `Shell Law | erased: ${erasedRef.current.size}/${LAWS.length}`;

    window.shell_law_advance = (steps: number) => {
      setErased(prev => {
        const next = new Set(prev);
        for (let i = 0; i < LAWS.length && next.size < prev.size + steps; i++) {
          next.add(i);
        }
        return next;
      });
    };

    return () => {
      window.removeEventListener("pointerup", onUp);
      delete window.shell_law_render_to_text;
      delete window.shell_law_advance;
    };
  }, []);

  const allErased = erased.size === LAWS.length;

  return (
    <div
      className="relative h-full w-full select-none overflow-hidden bg-[#f5f3ef]"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div className="flex flex-none items-baseline justify-between border-b border-[#c4c1bc] px-3 py-2">
        <div className="flex items-baseline gap-2">
          <span className="font-pixel-square text-[11px] uppercase tracking-widest text-[#1e1c1a]">
            Shell Law
          </span>
          <span className="font-mono text-[8px] uppercase tracking-wider text-[#9c9998]">
            Solariella iris
          </span>
        </div>
        <button
          onClick={handleReset}
          className="font-mono text-[8px] uppercase tracking-wider text-[#9c9998] transition-colors hover:text-[#1e1c1a]"
          aria-label="Reset all shell bands"
        >
          reset
        </button>
      </div>

      <div
        ref={bandsRef}
        className="flex flex-1 cursor-crosshair touch-none flex-col"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {LAWS.map((law, i) => {
          const isErased = erased.has(i);
          return (
            <div
              key={i}
              className="relative flex-1 border-b border-[rgba(0,0,0,0.06)] last:border-b-0"
            >
              <div className="absolute inset-0 flex items-center gap-2 bg-[#f5f3ef] px-3">
                <span className="w-6 shrink-0 font-pixel-square text-[9px] text-[#9c9998]">
                  {law.n}
                </span>
                <span className="flex-1 overflow-hidden font-pixel-square text-[9px] leading-none text-[#1e1c1a]">
                  {law.text}
                </span>
              </div>
              <div
                className="absolute inset-0 transition-opacity duration-150"
                style={{
                  backgroundColor: BAND_COLORS[i],
                  opacity: isErased ? 0 : 1,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-none items-center justify-between border-t border-[#c4c1bc] px-3 py-2">
        <span className="font-mono text-[8px] uppercase tracking-wider text-[#9c9998]">
          {allErased
            ? "the snail enacted none of these"
            : erased.size === 0
              ? "drag to erase"
              : `${erased.size} of ${LAWS.length} revealed`}
        </span>
        {allErased && (
          <span className="font-mono text-[8px] uppercase tracking-wider text-[#c4c1bc]">
            see above for reference
          </span>
        )}
      </div>
    </div>
  );
}
