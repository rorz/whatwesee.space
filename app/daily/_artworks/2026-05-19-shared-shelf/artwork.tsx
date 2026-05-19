"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    shared_shelf_render_to_text?: () => string;
    shared_shelf_advance?: (steps: number) => void;
  }
}

const SUBJECTS = [
  "myths",
  "rail",
  "weather",
  "letters",
  "harbor",
  "seeds",
  "choirs",
  "salt",
  "lanterns",
];

const COLORS = ["#5f4332", "#7a4b34", "#415e54", "#8c603f", "#4f5d86", "#7e4050", "#5f6f3f", "#7d3f2c", "#4f5770"];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function SharedShelf() {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [focusIndex, setFocusIndex] = useState(Math.floor(SUBJECTS.length / 2));
  const [phase, setPhase] = useState(0);

  const geometry = useMemo(() => {
    const count = SUBJECTS.length;
    const spacing = 84 / count;
    return SUBJECTS.map((label, index) => {
      const x = 8 + spacing * index + spacing * 0.5;
      const distance = Math.abs(index - focusIndex);
      const pull = Math.exp(-distance * 0.92);
      const sway = Math.sin(phase * 0.18 + index * 0.7) * pull;
      const tilt = sway * 7.8;
      const width = spacing * (0.72 + pull * 0.16);
      const height = clamp(68 + pull * 11 + sway * 4, 60, 84);
      const y = 88 - height;
      return {
        index,
        label,
        x,
        y,
        width,
        height,
        tilt,
      };
    });
  }, [focusIndex, phase]);

  useEffect(() => {
    window.shared_shelf_render_to_text = () => {
      const active = SUBJECTS[focusIndex] ?? "none";
      return `Shared Shelf | focus: ${active} | phase: ${phase}`;
    };
    window.shared_shelf_advance = (steps: number) => {
      const safeSteps = Number.isFinite(steps) ? Math.max(0, Math.floor(steps)) : 0;
      setPhase((value) => value + safeSteps);
    };

    return () => {
      delete window.shared_shelf_render_to_text;
      delete window.shared_shelf_advance;
    };
  }, [focusIndex, phase]);

  const updateFromPointer = (clientX: number) => {
    const el = surfaceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const normalized = (clientX - rect.left) / rect.width;
    const index = clamp(Math.floor(normalized * SUBJECTS.length), 0, SUBJECTS.length - 1);
    setFocusIndex(index);
    setPhase((value) => value + 1);
  };

  return (
    <div
      ref={surfaceRef}
      className="h-full w-full touch-none select-none"
      onPointerDown={(event) => {
        draggingRef.current = true;
        updateFromPointer(event.clientX);
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) return;
        updateFromPointer(event.clientX);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
      onPointerLeave={() => {
        draggingRef.current = false;
      }}
      aria-label="A shared library shelf. Drag across the book spines to make one subject pull neighboring titles into a new arrangement."
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-hidden>
        <rect x="0" y="0" width="100" height="100" fill="#efe5d4" />
        <rect x="4" y="90" width="92" height="2.2" rx="0.4" fill="#6d4a34" opacity="0.8" />
        <rect x="4" y="8" width="92" height="1.6" rx="0.4" fill="#7b5a43" opacity="0.45" />

        {geometry.map((book) => (
          <g key={book.label} transform={`translate(${book.x} 88) rotate(${book.tilt}) translate(${-book.x} -88)`}>
            <rect
              x={book.x - book.width / 2}
              y={book.y}
              width={book.width}
              height={book.height}
              rx="0.7"
              fill={COLORS[book.index]}
              stroke="#2f2219"
              strokeWidth="0.22"
            />
            <text
              x={book.x}
              y={book.y + 2.8}
              fill="#f6efe2"
              textAnchor="middle"
              fontSize="2.15"
              style={{ fontFamily: "var(--font-geist-mono)" }}
              transform={`rotate(90 ${book.x} ${book.y + 2.8})`}
            >
              {book.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
