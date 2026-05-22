"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    invisible_reply_render_to_text?: () => string;
    invisible_reply_advance?: (steps: number) => void;
  }
}

const WIDTH = 24;
const HEIGHT = 18;
const GLYPHS = "▢▣◇◆░▒▓01/\\|=-+";
const REPLY = "REPLY RECEIVED HOLD STILL SIGNALS ARE ONLY VISIBLE WHEN YOU ANSWER";

type Cell = {
  index: number;
  x: number;
  y: number;
};

function charAt(seed: number, phase: number, typedLength: number): string {
  if (typedLength > 0 && (seed + phase * 7) % 97 < Math.min(86, typedLength * 9)) {
    return REPLY[(seed + phase) % REPLY.length];
  }
  return GLYPHS[(seed * 11 + phase) % GLYPHS.length];
}

export default function InvisibleReply() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const typedRef = useRef("");
  const phaseRef = useRef(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState(0);

  const cells = useMemo<Array<Cell>>(
    () =>
      Array.from({ length: WIDTH * HEIGHT }, (_, index) => ({
        index,
        x: index % WIDTH,
        y: Math.floor(index / WIDTH),
      })),
    [],
  );

  useEffect(() => {
    typedRef.current = typed;
  }, [typed]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPhase((current) => current + 1);
    }, 260);

    window.invisible_reply_render_to_text = () =>
      `Invisible Reply | typed: ${typedRef.current.length} | phase: ${phaseRef.current}`;

    window.invisible_reply_advance = (steps: number) => {
      phaseRef.current += Math.max(0, steps);
      setPhase(phaseRef.current);
    };

    return () => {
      window.clearInterval(interval);
      delete window.invisible_reply_render_to_text;
      delete window.invisible_reply_advance;
    };
  }, []);

  const visibleBudget = Math.min(86, typed.length * 9);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="application"
      aria-label="A black signal terminal. Type to make the invisible reply resolve out of machine glyphs."
      className="relative flex h-full w-full touch-none select-none flex-col overflow-hidden bg-[#05070b] p-4 text-[#73ff8f] outline-none"
      onPointerDown={() => rootRef.current?.focus()}
      onKeyDown={(event) => {
        if (event.key === "Backspace") {
          event.preventDefault();
          setTyped((current) => current.slice(0, -1));
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setTyped("");
          return;
        }
        if (event.key.length === 1) {
          event.preventDefault();
          setTyped((current) => (current + event.key.toUpperCase()).slice(-14));
        }
      }}
    >
      <div className="mb-3 grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[#73ff8f]/40 pb-2 font-mono text-[10px] uppercase text-[#d7ffe0]">
        <span>RX 05.19 / invisible channel</span>
        <span>{typed.length.toString().padStart(2, "0")} keys</span>
      </div>

      <div
        className="grid min-h-0 flex-1 gap-[2px] font-mono text-[10px] leading-none"
        style={{
          gridTemplateColumns: `repeat(${WIDTH}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${HEIGHT}, minmax(0, 1fr))`,
        }}
      >
        {cells.map((cell) => {
          const seed = (cell.x * 31 + cell.y * 47 + cell.index * 13) % 211;
          const revealed = typed.length > 0 && (seed + phase * 7) % 97 < visibleBudget;
          return (
            <span
              key={cell.index}
              className="grid place-items-center border border-[#73ff8f]/15 bg-[#0b1118]"
              style={{
                color: revealed ? "#f4ff5f" : "#32c85a",
                opacity: revealed ? 1 : 0.42 + ((seed + phase) % 5) * 0.08,
                boxShadow: revealed ? "inset 0 0 0 1px rgba(244,255,95,0.36)" : undefined,
              }}
            >
              {charAt(seed, phase, typed.length)}
            </span>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#73ff8f]/40 pt-2 font-mono text-[10px] uppercase text-[#73ff8f]">
        <span>{typed || "type to answer"}</span>
        <span>{typed.length > 0 ? "reply unstable" : "carrier absent"}</span>
      </div>
    </div>
  );
}
