"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    first_five_servings_render_to_text?: () => string;
    first_five_servings_advance?: (steps: number) => void;
  }
}

type Verdict = "admit" | "hold" | "refuse";

type District = {
  id: string;
  label: string;
  top: string;
  left: string;
  width: string;
  height: string;
  rotation: number;
  bias: number;
  clipPath: string;
};

const DISTRICTS: ReadonlyArray<District> = [
  {
    id: "alto",
    label: "alto",
    top: "9%",
    left: "28%",
    width: "20%",
    height: "14%",
    rotation: -7,
    bias: 2,
    clipPath: "polygon(8% 9%, 84% 0%, 100% 37%, 76% 100%, 5% 88%, 0% 31%)",
  },
  {
    id: "santo-antonio",
    label: "sto",
    top: "16%",
    left: "47%",
    width: "18%",
    height: "13%",
    rotation: 6,
    bias: 5,
    clipPath: "polygon(4% 18%, 85% 0%, 100% 49%, 76% 100%, 16% 96%, 0% 46%)",
  },
  {
    id: "cedofeita",
    label: "ced",
    top: "28%",
    left: "16%",
    width: "22%",
    height: "16%",
    rotation: -10,
    bias: 7,
    clipPath: "polygon(7% 12%, 88% 2%, 100% 68%, 79% 100%, 2% 84%, 0% 36%)",
  },
  {
    id: "se-nova",
    label: "sé",
    top: "27%",
    left: "38%",
    width: "21%",
    height: "18%",
    rotation: -2,
    bias: 11,
    clipPath: "polygon(10% 0%, 87% 5%, 100% 40%, 88% 100%, 16% 94%, 0% 43%)",
  },
  {
    id: "solum",
    label: "sol",
    top: "31%",
    left: "59%",
    width: "20%",
    height: "16%",
    rotation: 9,
    bias: 13,
    clipPath: "polygon(8% 8%, 100% 0%, 92% 78%, 70% 100%, 0% 86%, 4% 28%)",
  },
  {
    id: "sousa",
    label: "sou",
    top: "48%",
    left: "19%",
    width: "21%",
    height: "16%",
    rotation: 4,
    bias: 17,
    clipPath: "polygon(0% 22%, 91% 0%, 100% 69%, 83% 100%, 10% 88%, 4% 42%)",
  },
  {
    id: "baixa",
    label: "baix",
    top: "46%",
    left: "40%",
    width: "19%",
    height: "18%",
    rotation: -8,
    bias: 19,
    clipPath: "polygon(14% 0%, 98% 16%, 100% 84%, 69% 100%, 0% 89%, 3% 23%)",
  },
  {
    id: "vale-das-flores",
    label: "vale",
    top: "49%",
    left: "57%",
    width: "24%",
    height: "18%",
    rotation: 5,
    bias: 23,
    clipPath: "polygon(4% 12%, 90% 0%, 100% 46%, 91% 100%, 18% 94%, 0% 34%)",
  },
  {
    id: "mondogo",
    label: "mon",
    top: "66%",
    left: "23%",
    width: "25%",
    height: "14%",
    rotation: -4,
    bias: 29,
    clipPath: "polygon(0% 26%, 84% 0%, 100% 31%, 88% 100%, 10% 92%, 3% 51%)",
  },
  {
    id: "santa-clara",
    label: "clara",
    top: "66%",
    left: "48%",
    width: "26%",
    height: "16%",
    rotation: 8,
    bias: 31,
    clipPath: "polygon(8% 0%, 100% 18%, 96% 84%, 74% 100%, 2% 90%, 0% 36%)",
  },
];

function sanitizeInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 18).trimStart();
}

function routingLetters(query: string): string[] {
  const letters = query.replace(/\s+/g, "");
  return Array.from(letters.length > 0 ? letters : "JUDITE");
}

export default function FirstFiveServings() {
  const [query, setQuery] = useState("JUDITE");
  const [phase, setPhase] = useState(0);
  const [settleSteps, setSettleSteps] = useState(0);

  const queryRef = useRef(query);
  const phaseRef = useRef(phase);
  const settleRef = useRef(settleSteps);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    settleRef.current = settleSteps;
  }, [settleSteps]);

  useEffect(() => {
    if (settleSteps <= 0) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setPhase((current) => current + 1);
      setSettleSteps((current) => Math.max(0, current - 1));
    }, 120);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [settleSteps]);

  const districts = useMemo(() => {
    const letters = routingLetters(query);
    const shifting = settleSteps > 0;
    return DISTRICTS.map((district, index) => {
      const letterIndex = shifting
        ? (index + phase + district.bias) % letters.length
        : (index * 3 + query.length + district.bias) % letters.length;
      const letter = letters[letterIndex] ?? letters[0] ?? "?";
      const score = (letter.charCodeAt(0) + district.bias + query.length + index * 5) % 11;
      const verdict: Verdict = score >= 7 ? "admit" : score >= 4 ? "hold" : "refuse";
      const wobbleX = shifting ? (((phase + index) % 5) - 2) * 1.4 : 0;
      const wobbleY = shifting ? (((phase + district.bias) % 3) - 1) * 1.8 : 0;
      return {
        ...district,
        letter,
        verdict,
        wobbleX,
        wobbleY,
      };
    });
  }, [phase, query, settleSteps]);

  const admittedCount = districts.filter((district) => district.verdict === "admit").length;
  const holdCount = districts.filter((district) => district.verdict === "hold").length;
  const refusedCount = districts.length - admittedCount - holdCount;
  const cherriesLit = Math.min(5, admittedCount);

  useEffect(() => {
    window.first_five_servings_render_to_text = () => {
      const letters = routingLetters(queryRef.current).join("");
      return `query=${letters} admitted=${admittedCount} hold=${holdCount} refused=${refusedCount} settling=${settleRef.current}`;
    };

    window.first_five_servings_advance = (steps: number) => {
      const delta = Math.max(0, Math.floor(Number.isFinite(steps) ? steps : 0));
      if (delta === 0) {
        return;
      }
      phaseRef.current += delta;
      settleRef.current = Math.max(0, settleRef.current - delta);
      setPhase(phaseRef.current);
      setSettleSteps(settleRef.current);
    };

    return () => {
      delete window.first_five_servings_render_to_text;
      delete window.first_five_servings_advance;
    };
  }, [admittedCount, holdCount, refusedCount]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#181111] text-[#f8ecde]">
      <div className="absolute inset-[3.5%] rounded-[2.25rem] border border-[#6e4a45] bg-[#241717]" />
      <div className="absolute inset-x-[10%] top-[7%] flex items-center justify-between text-[0.45rem] uppercase tracking-[0.28em] text-[#e6c8b3] sm:text-[0.58rem]">
        <span className="font-pixel-square">coimbra service</span>
        <span className="font-pixel-square">first five ward cake</span>
      </div>

      <div className="absolute left-[7%] top-[15%] h-[63%] w-[76%] rounded-[2rem] border border-[#53312f] bg-[#3b211e] shadow-[inset_0_0_0_2px_rgba(244,220,205,0.05)]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d="M9 48C15 30 31 18 52 18C70 18 84 28 90 47C86 68 71 82 49 84C26 85 12 71 9 48Z" fill="#5a2d28" />
          <path d="M18 35C27 29 37 30 45 24C54 18 66 21 74 28" fill="none" stroke="#f1dfce" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="2.5 3.4" />
          <path d="M20 58C28 52 39 52 48 45C59 36 70 39 81 46" fill="none" stroke="#f1dfce" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2.8 3.8" />
          <path d="M24 72C34 66 45 69 55 62C64 56 74 58 82 64" fill="none" stroke="#f1dfce" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="2.5 4" />
          <path d="M48 18C45 33 46 46 45 62C44 71 47 78 49 84" fill="none" stroke="#f4e5d7" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="3 3.7" opacity="0.8" />
        </svg>

        {districts.map((district) => {
          const colors =
            district.verdict === "admit"
              ? { fill: "#f0d9c5", border: "#8f2430", text: "#531b1f", badge: "#fff3e7" }
              : district.verdict === "hold"
                ? { fill: "#c78b57", border: "#f3ddc8", text: "#2d150d", badge: "#f7ecdf" }
                : { fill: "#6b3a35", border: "#f0d5c0", text: "#f9ece2", badge: "#f4e4d6" };

          return (
            <div
              key={district.id}
              className="absolute"
              style={{
                top: district.top,
                left: district.left,
                width: district.width,
                height: district.height,
                transform: `translate(${district.wobbleX}px, ${district.wobbleY}px) rotate(${district.rotation}deg)`,
                transition: settleSteps > 0 ? "transform 120ms linear, background-color 120ms linear" : "transform 220ms ease, background-color 220ms ease",
              }}
            >
              <div
                className="relative h-full w-full border-[2px] px-[8%] py-[10%]"
                style={{
                  background: colors.fill,
                  borderColor: colors.border,
                  clipPath: district.clipPath,
                }}
              >
                <span
                  className="font-pixel-square absolute left-[10%] top-[10%] text-[0.42rem] uppercase tracking-[0.18em] sm:text-[0.5rem]"
                  style={{ color: colors.text }}
                >
                  {district.label}
                </span>
                <span
                  className="font-pixel-square absolute left-1/2 top-1/2 text-[1.45rem] leading-none sm:text-[1.9rem]"
                  style={{ color: colors.text, transform: "translate(-50%, -44%)" }}
                >
                  {district.letter}
                </span>
                <span
                  className="font-pixel-square absolute bottom-[9%] right-[10%] rounded-sm px-[0.2rem] py-[0.05rem] text-[0.42rem] uppercase tracking-[0.16em] sm:text-[0.48rem]"
                  style={{
                    background: colors.badge,
                    color: district.verdict === "admit" ? "#7a1c28" : district.verdict === "hold" ? "#5b3112" : "#6b2d2d",
                  }}
                >
                  {district.verdict}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute right-[7%] top-[16%] w-[18%] min-w-[92px] rounded-[1rem] border border-[#6b4742] bg-[#2b1b1b] px-2 py-3 text-[#f1dfce]">
        <p className="font-pixel-square text-[0.42rem] uppercase tracking-[0.24em] text-[#e7c0b6] sm:text-[0.5rem]">admission chart</p>
        <div className="mt-2 space-y-1.5 font-pixel-square text-[0.48rem] uppercase tracking-[0.16em] sm:text-[0.56rem]">
          <p>yes {admittedCount}</p>
          <p>hold {holdCount}</p>
          <p>refuse {refusedCount}</p>
        </div>
        <div className="mt-3 border-t border-[#6b4742] pt-2">
          <p className="font-pixel-square text-[0.36rem] uppercase tracking-[0.2em] text-[#d9b4a6] sm:text-[0.42rem]">service query</p>
          <p className="mt-1 break-words font-pixel-square text-[0.52rem] uppercase leading-[1.15] tracking-[0.14em] sm:text-[0.62rem]">{query}</p>
        </div>
      </div>

      <div className="absolute left-[8%] top-[82%] flex items-center gap-2 sm:gap-3">
        {Array.from({ length: 5 }, (_, index) => {
          const lit = index < cherriesLit;
          return (
            <div key={index} className="relative h-5 w-5 rounded-full sm:h-6 sm:w-6" style={{ background: lit ? "#ae2533" : "#4f2a2b", border: "2px solid #f5d8c6" }}>
              <div className="absolute left-1/2 top-[-26%] h-2 w-[2px] -translate-x-1/2 rounded-full bg-[#cabd8e] sm:h-2.5" />
              <div
                className="absolute left-1/2 top-1/2 h-[36%] w-[36%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: "rgba(255, 216, 216, 0.7)" }}
              />
            </div>
          );
        })}
      </div>

      <label className="absolute bottom-[13%] left-[8%] font-pixel-square text-[0.4rem] uppercase tracking-[0.26em] text-[#e6c8b3] sm:text-[0.48rem]" htmlFor="first-five-servings-input">
        admission line
      </label>
      <input
        id="first-five-servings-input"
        value={query}
        onChange={(event) => {
          const next = sanitizeInput(event.target.value);
          setQuery(next);
          setPhase(0);
          setSettleSteps(8);
        }}
        maxLength={18}
        spellCheck={false}
        className="font-pixel-square absolute bottom-[7%] left-[8%] h-8 w-[52%] rounded-none border border-[#f3d9c8] bg-[#140d0d] px-2 text-[0.62rem] uppercase tracking-[0.16em] text-[#fff1e5] outline-none placeholder:text-[#9e7b75] sm:h-9 sm:text-[0.74rem]"
        placeholder="write her in"
        aria-label="Type a woman's name to re-seat the wards"
      />
      <p className="font-pixel-square absolute bottom-[7.4%] right-[8%] w-[29%] text-[0.42rem] uppercase leading-[1.35] tracking-[0.18em] text-[#d8b5a4] sm:text-[0.5rem]">
        five cherries means the city finally stops denying the chair.
      </p>
    </div>
  );
}
