"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    borrowed_page_render_to_text?: () => string;
    borrowed_page_advance?: (steps: number) => void;
  }
}

type Card = {
  color: string;
  mark: string;
  rotation: number;
  due: string;
};

const cards: Card[] = [
  { color: "#ff2a2a", mark: "A", rotation: -7, due: "03" },
  { color: "#0057ff", mark: "B", rotation: 5, due: "11" },
  { color: "#ffe600", mark: "C", rotation: -3, due: "08" },
  { color: "#ffffff", mark: "D", rotation: 8, due: "02" },
  { color: "#0057ff", mark: "E", rotation: -8, due: "19" },
  { color: "#ff2a2a", mark: "F", rotation: 4, due: "05" },
  { color: "#ffffff", mark: "G", rotation: -5, due: "14" },
  { color: "#ffe600", mark: "H", rotation: 7, due: "01" },
  { color: "#ffe600", mark: "I", rotation: -4, due: "22" },
  { color: "#ffffff", mark: "J", rotation: 6, due: "06" },
  { color: "#ff2a2a", mark: "K", rotation: -6, due: "17" },
  { color: "#0057ff", mark: "L", rotation: 3, due: "04" },
  { color: "#ffffff", mark: "M", rotation: -9, due: "13" },
  { color: "#ffe600", mark: "N", rotation: 5, due: "09" },
  { color: "#0057ff", mark: "O", rotation: -2, due: "24" },
  { color: "#ff2a2a", mark: "P", rotation: 9, due: "07" },
];

export default function BorrowedPage() {
  const sortedRef = useRef<Set<number>>(new Set());
  const [sorted, setSorted] = useState<Set<number>>(new Set());
  const sortedCount = sorted.size;

  const columns = useMemo(
    () => [
      { name: "red", color: "#ff2a2a" },
      { name: "blue", color: "#0057ff" },
      { name: "yellow", color: "#ffe600" },
      { name: "white", color: "#ffffff" },
    ],
    [],
  );

  useEffect(() => {
    sortedRef.current = sorted;
  }, [sorted]);

  useEffect(() => {
    window.borrowed_page_render_to_text = () => `Borrowed Page | sorted: ${sortedRef.current.size}/${cards.length}`;
    window.borrowed_page_advance = (steps: number) => {
      setSorted((current) => {
        const next = new Set(current);
        for (let i = 0; i < steps; i += 1) {
          next.add((next.size + i) % cards.length);
        }
        return next;
      });
    };

    return () => {
      delete window.borrowed_page_render_to_text;
      delete window.borrowed_page_advance;
    };
  }, []);

  return (
    <div className="grid h-full w-full grid-rows-[auto_1fr_auto] overflow-hidden bg-[#0a0a0a] p-4 text-[#0a0a0a]">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 bg-[#ffe600] px-3 py-2 font-mono text-[11px] font-black uppercase">
        <span>borrowed page sorting floor</span>
        <span>{sortedCount}/16</span>
      </div>

      <div className="my-4 grid min-h-0 grid-cols-4 gap-2">
        {cards.map((card, index) => {
          const isSorted = sorted.has(index);
          return (
            <button
              key={`${card.mark}-${index}`}
              type="button"
              aria-pressed={isSorted}
              aria-label={`Sort borrowed page ${card.mark}`}
              className="relative min-h-0 border-4 border-[#0a0a0a] font-mono font-black shadow-[6px_6px_0_#000] transition-transform focus:outline-none focus:ring-4 focus:ring-[#ffe600]"
              style={{
                background: card.color,
                transform: isSorted ? "rotate(0deg) translateY(-3px)" : `rotate(${card.rotation}deg)`,
              }}
              onClick={() => {
                setSorted((current) => {
                  const next = new Set(current);
                  if (next.has(index)) {
                    next.delete(index);
                  } else {
                    next.add(index);
                  }
                  return next;
                });
              }}
            >
              <span className="absolute left-2 top-2 text-[10px] uppercase">due {card.due}</span>
              <span className="grid h-full place-items-center text-[34px]">{card.mark}</span>
              <span className="absolute bottom-2 right-2 h-4 w-4 border-2 border-[#0a0a0a] bg-[#fff]" />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {columns.map((column) => (
          <div key={column.name} className="border-4 border-[#0a0a0a] p-2 font-mono text-[9px] font-black uppercase" style={{ background: column.color }}>
            {column.name}
          </div>
        ))}
      </div>
    </div>
  );
}
