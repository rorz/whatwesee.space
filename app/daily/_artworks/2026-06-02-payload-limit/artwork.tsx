"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    payload_limit_render_to_text?: () => string;
    payload_limit_advance?: (steps: number) => void;
  }
}

type Passenger = {
  name: string;
  declaredKg: number;
  actualKg: number;
};

const manifest: ReadonlyArray<Passenger> = [
  { name: "ROW 01 · BLAKE", declaredKg: 76, actualKg: 90 },
  { name: "ROW 02 · CHEN", declaredKg: 68, actualKg: 79 },
  { name: "ROW 03 · FIORE", declaredKg: 71, actualKg: 85 },
  { name: "ROW 04 · KABIR", declaredKg: 74, actualKg: 88 },
  { name: "ROW 05 · MENDOZA", declaredKg: 69, actualKg: 83 },
  { name: "ROW 06 · RHO", declaredKg: 73, actualKg: 89 },
];

const baggageKg = 212;
const envelopeMin = 37;
const envelopeMax = 63;
const SHAKE_ANIMATION = "payload-limit-shake";
const BREATH_ANIMATION = "payload-limit-breathe";

export default function PayloadLimit() {
  const [shakeTick, setShakeTick] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const revealedRef = useRef(revealed);
  const shakeRef = useRef(shakeTick);

  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  useEffect(() => {
    shakeRef.current = shakeTick;
  }, [shakeTick]);

  const declaredTotal = useMemo(
    () => manifest.reduce((sum, passenger) => sum + passenger.declaredKg, baggageKg),
    [],
  );

  const actualTotal = useMemo(
    () => manifest.reduce((sum, passenger) => sum + passenger.actualKg, baggageKg),
    [],
  );

  const overload = actualTotal - declaredTotal;
  const declaredCg = 49;
  const actualCg = 67;
  const plottedCg = revealed ? actualCg : declaredCg;
  const plottedWeight = revealed ? actualTotal : declaredTotal;

  const shakeManifest = () => {
    setShakeTick((value) => value + 1);
    setRevealed(true);
  };

  useEffect(() => {
    window.payload_limit_render_to_text = () => {
      const state = revealedRef.current ? "deviation" : "cleared";
      const currentCg = revealedRef.current ? actualCg : declaredCg;
      const currentWeight = revealedRef.current ? actualTotal : declaredTotal;
      return `Payload Limit | state:${state} | cg:${currentCg.toFixed(1)} | weight:${currentWeight}kg | overload:${overload}kg | shakes:${shakeRef.current}`;
    };

    window.payload_limit_advance = (steps: number) => {
      if (steps <= 0) {
        return;
      }
      setShakeTick((value) => value + Math.floor(steps));
      setRevealed(true);
    };

    return () => {
      delete window.payload_limit_render_to_text;
      delete window.payload_limit_advance;
    };
  }, [actualTotal, declaredTotal, overload]);

  const statusLamp = revealed
    ? "radial-gradient(circle at 45% 40%, #ffe3e6 0%, #ff4d6d 48%, #96152c 100%)"
    : `radial-gradient(circle at 45% 40%, #f2ffe0 0%, #72df66 52%, #1d7f23 100%)`;

  return (
    <div
      className="grid h-full w-full grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] overflow-hidden border-4 border-[#123b9a] bg-[#f4f8ff] font-mono text-[#10204e]"
      style={{ letterSpacing: "0.02em" }}
    >
      <section className="relative flex h-full flex-col border-r-4 border-[#1f4ac0] bg-[#f9fbff] p-3">
        <header className="mb-2 border-2 border-[#1f4ac0] bg-[#dce8ff] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#153379]">
          Georgian Express • Weight Manifest
        </header>

        <div
          className="relative flex-1 overflow-hidden border-2 border-[#1f4ac0] bg-white"
          style={{
            animation: shakeTick > 0 ? `${SHAKE_ANIMATION} 420ms cubic-bezier(.36,.07,.19,.97)` : undefined,
          }}
        >
          <div className="grid grid-cols-[1fr_auto_auto] border-b border-[#8ea8e8] bg-[#edf3ff] px-2 py-1 text-[9px] font-bold uppercase">
            <span>Passenger</span>
            <span className="px-2">Declared</span>
            <span className="px-2">Actual</span>
          </div>

          {manifest.map((passenger) => (
            <div
              key={passenger.name}
              className="grid grid-cols-[1fr_auto_auto] border-b border-[#d5e0fb] px-2 py-1 text-[9px] md:text-[10px]"
            >
              <span>{passenger.name}</span>
              <span className="px-2 text-right">{passenger.declaredKg}kg</span>
              <span className={`px-2 text-right ${revealed ? "text-[#9e1530]" : "text-[#1a2b67]"}`}>
                {revealed ? `${passenger.actualKg}kg` : "—"}
              </span>
            </div>
          ))}

          <div className="absolute bottom-0 left-0 right-0 border-t-2 border-[#1f4ac0] bg-[#eef4ff] px-2 py-1 text-[10px] font-bold uppercase">
            Total payload: {revealed ? actualTotal : declaredTotal}kg
            {revealed && <span className="ml-2 text-[#a30d2d]">(+{overload}kg)</span>}
          </div>
        </div>

        <button
          type="button"
          onClick={shakeManifest}
          className="mt-3 border-2 border-[#8f112b] bg-[#d01e2f] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#b5142a]"
        >
          Shake Manifest
        </button>

        <div className="mt-2 text-[9px] uppercase text-[#304f9b]">Tap once to force re-weigh and recompute center of gravity.</div>
      </section>

      <section className="flex h-full flex-col bg-[#0d2a73] p-3 text-[#f2f6ff]">
        <div className="mb-2 flex items-center justify-between border border-[#8aacff] bg-[#1b3f9f] px-2 py-1 text-[9px] uppercase tracking-[0.12em]">
          <span>{revealed ? "⚠ Weight deviation detected" : "Cleared for departure ✓"}</span>
          <span>{plottedWeight}kg</span>
        </div>

        <svg viewBox="0 0 100 100" className="h-full w-full border border-[#7d9df2] bg-[#16368b]" role="img" aria-label="Weight and balance envelope chart">
          <rect x="0" y="0" width="100" height="100" fill="#16368b" />
          {[20, 40, 60, 80].map((line) => (
            <line key={`h-${line}`} x1="8" y1={line} x2="95" y2={line} stroke="#5f82dd" strokeWidth="0.6" opacity="0.55" />
          ))}
          {[20, 40, 60, 80].map((line) => (
            <line key={`v-${line}`} x1={line} y1="8" x2={line} y2="94" stroke="#5f82dd" strokeWidth="0.6" opacity="0.55" />
          ))}

          <polygon points="36,76 38,31 62,31 64,76" fill="#2458d0" stroke="#b8ccff" strokeWidth="1.1" />

          <line x1={envelopeMin} y1="78" x2={envelopeMin} y2="28" stroke="#ffe48b" strokeWidth="0.8" strokeDasharray="2.2 1.6" />
          <line x1={envelopeMax} y1="78" x2={envelopeMax} y2="28" stroke="#ffe48b" strokeWidth="0.8" strokeDasharray="2.2 1.6" />

          <circle cx={declaredCg} cy="46" r="2.7" fill="#90f078" stroke="#f2fff0" strokeWidth="0.8" opacity={revealed ? 0.35 : 1} />
          <circle cx={actualCg} cy="62" r="3" fill="#ff4d6d" stroke="#ffe7ec" strokeWidth="0.9" opacity={revealed ? 1 : 0} />

          <line
            x1={declaredCg}
            y1="46"
            x2={actualCg}
            y2="62"
            stroke="#ffd670"
            strokeWidth="1"
            strokeDasharray="3 2"
            opacity={revealed ? 0.9 : 0}
          />

          <text x="9" y="13" fill="#dbe7ff" fontSize="4" fontFamily="var(--font-geist-mono), monospace" letterSpacing="0.4">
            CG ENVELOPE
          </text>
          <text x="9" y="90" fill="#dbe7ff" fontSize="3.2" fontFamily="var(--font-geist-mono), monospace">
            SAFE RANGE 37–63
          </text>
          <text x="9" y="95" fill="#dbe7ff" fontSize="3.2" fontFamily="var(--font-geist-mono), monospace">
            CURRENT {plottedCg.toFixed(1)}
          </text>
        </svg>

        <div className="mt-2 grid grid-cols-[auto_1fr] items-center gap-2 border border-[#7d9df2] bg-[#1a3f9f] px-2 py-1 text-[9px] uppercase">
          <span
            className="h-3 w-3 rounded-full border border-[#e4ecff]"
            style={{
              background: statusLamp,
              boxShadow: `0 0 ${revealed ? 8 : 5}px ${revealed ? "#ff6d8a" : "#8dffa1"}`,
              animation: `${BREATH_ANIMATION} 1800ms ease-in-out infinite`,
            }}
          />
          <span>{revealed ? "Load breach: hold departure" : "Gate confidence: excessive"}</span>
        </div>
      </section>

      <style jsx>{`
        @keyframes ${SHAKE_ANIMATION} {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          18% {
            transform: translate(-2px, 1px) rotate(-0.7deg);
          }
          36% {
            transform: translate(2px, -1px) rotate(0.7deg);
          }
          54% {
            transform: translate(-3px, 0px) rotate(-0.8deg);
          }
          72% {
            transform: translate(2px, 1px) rotate(0.5deg);
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
        }
        @keyframes ${BREATH_ANIMATION} {
          0%,
          100% {
            transform: scale(0.95);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
