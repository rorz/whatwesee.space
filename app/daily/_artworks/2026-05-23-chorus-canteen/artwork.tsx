"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    chorus_canteen_render_to_text?: () => string;
    chorus_canteen_advance?: (steps: number) => void;
  }
}

const menuWords = ["STEW", "RICE", "MANGO", "GINGER", "CHILI", "BEANS", "BREAD", "TEA", "OKRA", "LIME"];

function buildLines(seedText: string, pulse: number): string[] {
  const source = (seedText.toUpperCase().replace(/[^A-Z]/g, "") || "CHORUS").slice(0, 18);
  return Array.from({ length: 7 }, (_, row) => {
    const offset = (row * 2 + pulse) % menuWords.length;
    const base = menuWords[(offset + source.length) % menuWords.length];
    const fragment = source.slice(0, Math.max(3, (row + pulse) % (source.length || 3) + 1));
    return `${base} ${fragment}`;
  });
}

export default function ChorusCanteen() {
  const [typed, setTyped] = useState("ugali chorus");
  const [pulse, setPulse] = useState(0);
  const typedRef = useRef(typed);
  const pulseRef = useRef(pulse);

  useEffect(() => {
    typedRef.current = typed;
  }, [typed]);

  useEffect(() => {
    pulseRef.current = pulse;
  }, [pulse]);

  const lines = useMemo(() => buildLines(typed, pulse), [typed, pulse]);

  useEffect(() => {
    window.chorus_canteen_render_to_text = () => `Chorus Canteen | typed:${typedRef.current} | pulse:${pulseRef.current}`;
    window.chorus_canteen_advance = (steps: number) => {
      const delta = Math.max(0, Math.floor(steps));
      const next = pulseRef.current + delta;
      pulseRef.current = next;
      setPulse(next);
    };

    return () => {
      delete window.chorus_canteen_render_to_text;
      delete window.chorus_canteen_advance;
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#fffdf8] text-black">
      <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label="A loud typographic food board that reshuffles with typed text">
        <rect x="0" y="0" width="100" height="100" fill="#fffdf8" />
        <rect x="0" y="0" width="100" height="16" fill="#ff3b00" />
        <rect x="0" y="84" width="100" height="16" fill="#0f0f0f" />
        <text x="4" y="10.7" fill="#fffdf8" fontSize="7.2" fontWeight="900" letterSpacing="0.8" fontFamily="var(--font-geist-mono), monospace">
          CHORUS CANTEEN
        </text>

        {lines.map((line, index) => {
          const y = 25 + index * 8.3;
          const isAccent = index % 2 === 0;
          return (
            <g key={`${line}-${index}`}>
              <rect x="4" y={y - 5.7} width="92" height="6.4" fill={isAccent ? "#111111" : "#ff3b00"} rx="0.5" />
              <text
                x={6.2 + ((pulse + index) % 3) * 0.55}
                y={y - 0.8}
                fill={isAccent ? "#fffdf8" : "#111111"}
                fontSize="5"
                fontWeight="800"
                fontFamily="var(--font-geist-mono), monospace"
                letterSpacing="0.4"
              >
                {line}
              </text>
            </g>
          );
        })}
      </svg>

      <label htmlFor="chorus-canteen-input" className="absolute bottom-4 left-1/2 w-[92%] max-w-[560px] -translate-x-1/2 text-[10px] font-semibold tracking-[0.14em] text-[#111111]">
        TYPE THE CALL
      </label>
      <input
        id="chorus-canteen-input"
        value={typed}
        onChange={(event) => {
          setTyped(event.target.value);
          setPulse((current) => current + 1);
        }}
        maxLength={24}
        className="absolute bottom-1 left-1/2 w-[92%] max-w-[560px] -translate-x-1/2 border-2 border-[#111111] bg-[#fffdf8] px-2 py-1 font-mono text-[12px] font-bold tracking-[0.08em] text-[#111111] outline-none"
      />
    </div>
  );
}
