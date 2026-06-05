"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    preferred_term_render_to_text?: () => string;
    preferred_term_advance?: (steps: number) => void;
  }
}

type Planting = {
  id: number;
  x: number;
  y: number;
  age: number;
  sway: number;
  lean: number;
  bulb: number;
  phase: number;
  label: string;
  stem: string;
  bloom: string;
  ticket: string;
};

type Scene = {
  pulse: number;
  plantings: Planting[];
};

const labels = ["AUTO", "PHYSIO", "PSYCHIC", "BREATH", "REED", "LADY", "TERM", "CTI"];
const palette = [
  { stem: "#7b3918", bloom: "#d8ff3e", ticket: "#ffd15c" },
  { stem: "#9f4618", bloom: "#ff8b2f", ticket: "#fff0a8" },
  { stem: "#67482f", bloom: "#74f5b2", ticket: "#f7b0a5" },
  { stem: "#845221", bloom: "#ff5d5d", ticket: "#e6ff86" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createPlanting(id: number, x: number, y: number): Planting {
  const swatch = palette[id % palette.length];
  return {
    id,
    x,
    y,
    age: 0,
    sway: 0.8 + (id % 4) * 0.35,
    lean: 0.2 + ((id * 7) % 5) * 0.05,
    bulb: 12 + (id % 4) * 3,
    phase: (id * 57) % 360,
    label: labels[id % labels.length],
    stem: swatch.stem,
    bloom: swatch.bloom,
    ticket: swatch.ticket,
  };
}

function advanceScene(scene: Scene, steps: number): Scene {
  if (steps <= 0) {
    return scene;
  }

  return {
    pulse: (scene.pulse + steps) % 720,
    plantings: scene.plantings.map((planting) => ({
      ...planting,
      age: Math.min(planting.age + steps, 140),
    })),
  };
}

export default function PreferredTerm() {
  const [scene, setScene] = useState<Scene>({ pulse: 0, plantings: [] });
  const sceneRef = useRef(scene);
  const nextIdRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    let mounted = true;

    const tick = () => {
      if (!mounted) {
        return;
      }
      setScene((current) => advanceScene(current, 1));
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      mounted = false;
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    window.preferred_term_render_to_text = () => {
      const latest = sceneRef.current.plantings.slice(-3).map((planting) => planting.label).join("/") || "none";
      return `Preferred Term | planted:${sceneRef.current.plantings.length} | latest:${latest} | pulse:${sceneRef.current.pulse}`;
    };

    window.preferred_term_advance = (steps: number) => {
      const delta = Math.max(0, Math.floor(steps));
      setScene((current) => advanceScene(current, delta));
    };

    return () => {
      delete window.preferred_term_render_to_text;
      delete window.preferred_term_advance;
    };
  }, []);

  const admissionLine = useMemo(
    () => scene.plantings.slice(-4).map((planting) => planting.label).join(" • ") || "ADMISSION BED EMPTY",
    [scene.plantings],
  );

  const handlePlant = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 10, 88);
    const rawY = ((event.clientY - rect.top) / rect.height) * 100;
    const y = clamp(rawY < 60 ? 74 + (rawY % 7) : rawY, 68, 89);
    const id = nextIdRef.current;
    nextIdRef.current += 1;

    setScene((current) => ({
      pulse: (current.pulse + 9) % 720,
      plantings: [...current.plantings, createPlanting(id, x, y)].slice(-11),
    }));
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#dec19e] text-[#2d1808]">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full touch-none"
        role="img"
        aria-label="An earth-toned rehearsal room where planted word bulbs grow into crooked brass reeds beneath a pinball backglass wall"
        onPointerDown={handlePlant}
      >
        <rect width="100" height="100" fill="#dec19e" />
        <rect y="0" width="100" height="56" fill="#d8b089" />
        <path d="M0 55 L100 49 L100 100 L0 100 Z" fill="#b8824f" />
        <path d="M0 61 L100 56 L100 100 L0 100 Z" fill="#946239" />
        <path d="M65 18 Q75 6 85 18 L85 49 L65 49 Z" fill="#85512f" stroke="#2b1508" strokeWidth="0.8" />
        <path d="M18 15 Q34 2 50 15 L50 48 L18 48 Z" fill="#6a4127" stroke="#2b1508" strokeWidth="0.9" />
        <path d="M20 17 Q34 7 48 17 L48 46 L20 46 Z" fill="#2f241d" stroke="#dbff67" strokeWidth="0.7" />
        <rect x="23" y="20" width="22" height="8" fill="#584637" stroke="#ffcf58" strokeWidth="0.5" />
        <rect x="23" y="31" width="9" height="10" fill="#6a3017" stroke="#75f4bc" strokeWidth="0.5" />
        <rect x="35" y="31" width="10" height="10" fill="#693314" stroke="#ff6e61" strokeWidth="0.5" />
        <text x="24.6" y="25.2" fill="#dbff67" fontSize="3.2" letterSpacing="0.55" fontFamily="var(--font-geist-mono), monospace">
          AUTO / PHYSIO / PSYCHIC
        </text>
        <text x="24.5" y="36.4" fill="#fff5ca" fontSize="2.4" letterSpacing="0.24" fontFamily="var(--font-geist-mono), monospace">
          HOUSE TERM
        </text>
        <text x="36.6" y="36.4" fill="#fff5ca" fontSize="2.4" letterSpacing="0.18" fontFamily="var(--font-geist-mono), monospace">
          ROOT QUEUE
        </text>
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const x = [21.5, 26.7, 31.3, 37.9, 42.2, 46.4][index];
          const y = [13.2, 12.5, 11.6, 12.8, 11.4, 13.1][index];
          const fill = ["#ffb14d", "#d8ff3e", "#7bf3bf", "#ff6958", "#fff2a4", "#d8ff3e"][index];
          return <circle key={x} cx={x} cy={y} r="1.3" fill={fill} stroke="#2b1508" strokeWidth="0.4" />;
        })}
        <rect x="7" y="64" width="54" height="20" rx="2" fill="#744627" stroke="#2b1508" strokeWidth="0.7" />
        <path d="M9 69 C18 65, 24 66, 31 69 S47 73, 59 67" fill="none" stroke="#4f301a" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M8 78 C19 74, 26 79, 33 76 S47 79, 60 74" fill="none" stroke="#c99359" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="62" y="64" width="30" height="24" rx="2" fill="#5e3922" stroke="#2b1508" strokeWidth="0.7" />
        <path d="M63 66 L90 63 L92 87 L66 89 Z" fill="#744a2a" opacity="0.45" />
        <text x="64" y="69" fill="#d7ff5a" fontSize="2.3" letterSpacing="0.18" fontFamily="var(--font-geist-mono), monospace">
          ADMISSION
        </text>
        <text x="64" y="72.2" fill="#fff1c9" fontSize="1.9" letterSpacing="0.12" fontFamily="var(--font-geist-mono), monospace">
          {scene.plantings.length.toString().padStart(2, "0")} rooted
        </text>

        {scene.plantings.map((planting) => {
          const growth = Math.min(planting.age / 90, 1);
          const bend = (84 - planting.x) * (0.22 + planting.lean * 0.28) * growth;
          const sway = Math.sin((scene.pulse + planting.phase) / 20) * planting.sway;
          const headX = planting.x + bend + sway;
          const headY = planting.y - (10 + planting.bulb) * growth + Math.cos((scene.pulse + planting.phase) / 24) * 0.6;
          const controlX = planting.x + bend * 0.45 - sway * 0.3;
          const controlY = planting.y - planting.bulb * 0.35 * growth;
          const bloomOpen = 2.4 + growth * 2.6;
          const ticketX = 72 + ((planting.id * 9) % 18) + Math.sin((scene.pulse + planting.phase) / 26) * 0.35;
          const ticketY = 75 + ((planting.id * 11) % 10) - growth * 1.8;
          const ticketRotation = -11 + ((planting.id * 17) % 20);

          return (
            <g key={planting.id}>
              <ellipse cx={planting.x} cy={planting.y + 0.3} rx="3.8" ry="1.4" fill="#3b2011" opacity="0.35" />
              <path
                d={`M ${planting.x} ${planting.y} C ${planting.x - 2.3} ${planting.y - 4}, ${controlX} ${controlY}, ${headX} ${headY}`}
                fill="none"
                stroke={planting.stem}
                strokeWidth={1.4 + growth * 0.7}
                strokeLinecap="round"
              />
              <path
                d={`M ${headX - bloomOpen} ${headY + 0.6} Q ${headX + 0.4} ${headY - bloomOpen}, ${headX + bloomOpen + 0.8} ${headY + 1.1}`}
                fill="none"
                stroke={planting.bloom}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx={headX + bloomOpen + 0.9} cy={headY + 0.9} r={1.1 + growth * 0.5} fill={planting.bloom} stroke="#2b1508" strokeWidth="0.35" />
              <circle cx={headX - bloomOpen * 0.85} cy={headY + 0.8} r={0.75 + growth * 0.35} fill={planting.ticket} stroke="#2b1508" strokeWidth="0.3" />
              <text
                x={headX + 2.2}
                y={headY - 0.5}
                fill="#fff7d8"
                fontSize="1.95"
                letterSpacing="0.18"
                fontFamily="var(--font-geist-mono), monospace"
                transform={`rotate(${ticketRotation * 0.28} ${headX + 2.2} ${headY - 0.5})`}
              >
                {planting.label}
              </text>
              <g transform={`translate(${ticketX} ${ticketY}) rotate(${ticketRotation})`}>
                <rect width="10.3" height="3.8" rx="0.4" fill={planting.ticket} stroke="#2b1508" strokeWidth="0.35" />
                <text x="0.9" y="2.55" fill="#4a220f" fontSize="1.5" letterSpacing="0.12" fontFamily="var(--font-geist-mono), monospace">
                  {planting.label}
                </text>
              </g>
            </g>
          );
        })}

        <text x="8" y="91" fill="#fff3d4" fontSize="3.2" letterSpacing="0.36" fontFamily="var(--font-geist-mono), monospace">
          TAP THE TRAY TO PLANT THE TERM
        </text>
        <text x="8" y="95.2" fill="#4b2a15" fontSize="2.1" letterSpacing="0.18" fontFamily="var(--font-geist-mono), monospace">
          {admissionLine}
        </text>
      </svg>
    </div>
  );
}
