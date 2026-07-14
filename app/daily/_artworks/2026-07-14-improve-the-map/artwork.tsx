"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    improve_the_map_render_to_text?: () => string;
    improve_the_map_advance?: (steps: number) => void;
  }
}

interface Annotation {
  id: number;
  x: number;
  y: number;
  text: string;
}

const AMBER = "#b86c14";
const DARK = "#1c0e04";
const CREAM = "#f4e8c8";
const SHADOW = "#7a4a08";

const LABELS: {
  x: number;
  y: number;
  text: string;
  rotate?: number;
  size?: number;
  italic?: boolean;
}[] = [
  { x: 28, y: 52, text: "HILLS (approx.)", size: 7, italic: true },
  { x: 88, y: 132, text: "River, probably", size: 7, italic: true, rotate: -8 },
  { x: 152, y: 232, text: "SETTLED AREA", size: 6.5 },
  { x: 268, y: 220, text: "NEW SUFFICIENT", size: 6, italic: true },
  { x: 82, y: 316, text: "OUTPOST (?)", size: 6, italic: true },
  { x: 338, y: 90, text: "S  E  A", size: 7, rotate: 90 },
  { x: 200, y: 318, text: "BRIDGE (PLANNED)", size: 6 },
  { x: 155, y: 265, text: "ADMINISTRATION", size: 6, italic: true },
  { x: 165, y: 275, text: "(suspected)", size: 5.5, italic: true },
  { x: 28, y: 378, text: "Note: survey not verified. Corrections welcomed.", size: 5.5, italic: true },
  { x: 32, y: 25, text: "N ↑", size: 13 },
  { x: 32, y: 36, text: "(approx.)", size: 5.5, italic: true },
];

const SEA_LINES = Array.from({ length: 55 }, (_, i) => 10 + i * 7);
const GRID_LINES = [100, 200, 300];
const SCALE_TICKS = [28, 69, 110];

export default function ImproveTheMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [active, setActive] = useState<{ x: number; y: number } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const idRef = useRef(0);
  const activeRef = useRef<{ x: number; y: number } | null>(null);
  const inputValueRef = useRef("");

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  const finalizeActive = useCallback(() => {
    const a = activeRef.current;
    const v = inputValueRef.current;
    if (a && v.trim()) {
      setAnnotations((prev) => [
        ...prev,
        { id: idRef.current++, x: a.x, y: a.y, text: v.trim() },
      ]);
    }
    setActive(null);
    setInputValue("");
  }, []);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      finalizeActive();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setActive({ x, y });
      setInputValue("");
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [finalizeActive],
  );

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent =
      "@keyframes itm-stamp{0%{transform:translate(-2px,-1em) scale(1.4);opacity:0}to{transform:translate(-2px,-1em) scale(1);opacity:1}}" +
      "@keyframes itm-blink{0%,100%{opacity:1}50%{opacity:0}}" +
      ".itm-final{animation:itm-stamp 0.18s cubic-bezier(.2,.8,.2,1) forwards}" +
      ".itm-cursor{display:inline-block;width:0.45em;background:#f4e8c8;animation:itm-blink 0.8s step-end infinite;vertical-align:baseline}";
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    window.improve_the_map_render_to_text = () =>
      `Improve the Map | annotations:${annotations.length} | active:${active ? "yes" : "no"} | typing:${JSON.stringify(inputValue)}`;
    window.improve_the_map_advance = () => {};
    return () => {
      delete window.improve_the_map_render_to_text;
      delete window.improve_the_map_advance;
    };
  }, [annotations, active, inputValue]);

  const baseAnnotationStyle: React.CSSProperties = {
    position: "absolute",
    fontFamily: "var(--font-geist-mono, monospace)",
    fontSize: "clamp(13px, 3.5vmin, 22px)",
    fontWeight: "700",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: CREAM,
    textShadow: `1px 1px 0 ${SHADOW}, -1px -1px 0 ${SHADOW}`,
    pointerEvents: "none",
    whiteSpace: "nowrap",
    lineHeight: "1.1",
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative w-full h-full overflow-hidden cursor-crosshair select-none touch-none"
      style={{ background: AMBER }}
      aria-label="A colonial survey map. Click anywhere to plant a mark, then type your observation."
    >
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") {
            e.preventDefault();
            finalizeActive();
          }
        }}
        style={{
          position: "absolute",
          opacity: 0,
          width: 1,
          height: 1,
          pointerEvents: "none",
          top: active ? `${active.y}%` : 0,
          left: active ? `${active.x}%` : 0,
        }}
        aria-hidden="true"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <svg
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <pattern id="itm-h1" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke={DARK} strokeWidth="0.6" />
          </pattern>
          <pattern id="itm-h2" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke={DARK} strokeWidth="0.5" />
          </pattern>
        </defs>

        <polygon
          points="10,10 145,10 155,88 122,142 62,158 10,132"
          fill="url(#itm-h1)"
          stroke={DARK}
          strokeWidth="0.8"
          opacity="0.65"
        />
        <polygon
          points="10,10 145,10 155,88 122,142 62,158 10,132"
          fill="url(#itm-h2)"
          stroke="none"
          opacity="0.45"
        />

        {SEA_LINES.map((y) => (
          <line key={y} x1="314" y1={y} x2="395" y2={y} stroke={DARK} strokeWidth="0.45" opacity="0.35" />
        ))}

        <path
          d="M 310,5 C 318,38 313,70 323,102 C 333,134 318,166 326,198 C 334,230 319,262 327,294 C 335,326 320,358 326,395"
          fill="none"
          stroke={DARK}
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          d="M 10,82 Q 52,90 88,108 Q 132,133 168,153 Q 208,177 244,194 Q 278,210 310,232"
          fill="none"
          stroke={DARK}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M 202,188 Q 248,238 280,270 Q 304,292 322,302"
          fill="none"
          stroke={DARK}
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M 28,208 Q 82,204 138,214 Q 192,224 244,219 Q 278,214 310,232"
          fill="none"
          stroke={DARK}
          strokeWidth="0.9"
          strokeDasharray="6,4"
          strokeLinecap="round"
        />

        <circle cx="168" cy="212" r="5" fill="none" stroke={DARK} strokeWidth="1.4" />
        <circle cx="168" cy="212" r="2" fill={DARK} />
        <circle cx="278" cy="200" r="4" fill="none" stroke={DARK} strokeWidth="1.2" />
        <circle cx="278" cy="200" r="1.5" fill={DARK} />
        <rect x="80" y="298" width="8" height="8" fill="none" stroke={DARK} strokeWidth="1.2" />
        <rect x="82.5" y="300.5" width="3" height="3" fill={DARK} />

        {GRID_LINES.map((n) => (
          <line key={`v${n}`} x1={n} y1="0" x2={n} y2="400" stroke={DARK} strokeWidth="0.25" opacity="0.3" />
        ))}
        {GRID_LINES.map((n) => (
          <line key={`h${n}`} x1="0" y1={n} x2="400" y2={n} stroke={DARK} strokeWidth="0.25" opacity="0.3" />
        ))}

        <line x1="28" y1="358" x2="110" y2="358" stroke={DARK} strokeWidth="1" />
        {SCALE_TICKS.map((x) => (
          <line key={x} x1={x} y1="354" x2={x} y2="362" stroke={DARK} strokeWidth="1" />
        ))}
        <text x="69" y="350" fontFamily="serif" fontSize="5.5" fill={DARK} textAnchor="middle">
          1 DAY&#39;S WALK
        </text>

        {LABELS.map(({ x, y, text, rotate, size = 7, italic }) => (
          <text
            key={`${x}-${y}`}
            x={x}
            y={y}
            fontFamily="serif"
            fontSize={size}
            fill={DARK}
            fontStyle={italic ? "italic" : "normal"}
            opacity="0.88"
            transform={rotate !== undefined ? `rotate(${rotate},${x},${y})` : undefined}
          >
            {text}
          </text>
        ))}
      </svg>

      {annotations.map((a) => (
        <div
          key={a.id}
          className="itm-final"
          style={{
            ...baseAnnotationStyle,
            left: `${a.x}%`,
            top: `${a.y}%`,
          }}
        >
          {a.text}
        </div>
      ))}

      {active && (
        <div
          style={{
            ...baseAnnotationStyle,
            left: `${active.x}%`,
            top: `${active.y}%`,
            transform: "translate(-2px, -1em)",
          }}
        >
          {inputValue}
          <span className="itm-cursor">&nbsp;</span>
        </div>
      )}

      {annotations.length === 0 && !active && (
        <div
          style={{
            position: "absolute",
            bottom: "6%",
            right: "4%",
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "clamp(9px, 1.8vmin, 11px)",
            color: DARK,
            opacity: 0.65,
            pointerEvents: "none",
            textAlign: "right",
          }}
        >
          click to annotate
        </div>
      )}
    </div>
  );
}
