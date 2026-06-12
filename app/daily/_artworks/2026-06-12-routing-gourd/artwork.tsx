"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    routing_gourd_render_to_text?: () => string;
    routing_gourd_advance?: (steps: number) => void;
  }
}

type Model = {
  phase: number;
  presses: number;
  spent: number;
  routes: number;
  forecastIndex: number;
};

type Blister = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  fill: string;
};

type RouteTag = {
  x: number;
  y: number;
  rotation: number;
  label: string;
  fill: string;
};

const FORECASTS = ["mist", "drizzle", "queue", "surge", "hail", "steam"] as const;
const BASE_BALANCE = 138;
const INITIAL_MODEL: Model = {
  phase: 0,
  presses: 0,
  spent: 0,
  routes: 12,
  forecastIndex: 0,
};

const BLISTERS: Array<Blister> = [
  { cx: 26, cy: 47, rx: 12, ry: 14, fill: "#bde85c" },
  { cx: 42, cy: 31, rx: 14, ry: 12, fill: "#d3ef73" },
  { cx: 54, cy: 49, rx: 15, ry: 17, fill: "#9fda3b" },
  { cx: 37, cy: 63, rx: 13, ry: 11, fill: "#c8eb73" },
  { cx: 61, cy: 34, rx: 10, ry: 12, fill: "#f3ca52" },
  { cx: 66, cy: 56, rx: 11, ry: 13, fill: "#f59d2b" },
  { cx: 49, cy: 73, rx: 10, ry: 9, fill: "#f5bb46" },
  { cx: 21, cy: 66, rx: 9, ry: 10, fill: "#99d13d" },
];

const ROUTE_TAGS: Array<RouteTag> = [
  { x: 12, y: 19, rotation: -12, label: "dn42", fill: "#ef6d2f" },
  { x: 70, y: 18, rotation: 11, label: "hop 7", fill: "#f4c64b" },
  { x: 78, y: 46, rotation: 8, label: "mist", fill: "#8ed8e8" },
  { x: 8, y: 69, rotation: -10, label: "bill", fill: "#f27f45" },
  { x: 63, y: 78, rotation: 13, label: "leaf", fill: "#f1d86a" },
  { x: 31, y: 12, rotation: -7, label: "scan", fill: "#ffc26d" },
];

function advanceModel(model: Model, steps: number): Model {
  return {
    ...model,
    phase: model.phase + steps,
  };
}

function pressModel(model: Model): Model {
  const presses = model.presses + 1;
  const charge = 8 + presses * 6;
  return {
    phase: model.phase + 1,
    presses,
    spent: model.spent + charge,
    routes: Math.min(96, model.routes + 4 + presses * 2),
    forecastIndex: (model.forecastIndex + 1) % FORECASTS.length,
  };
}

function balanceFor(model: Model): number {
  return BASE_BALANCE - model.spent;
}

function isBankrupt(model: Model): boolean {
  return balanceFor(model) < 0;
}

function formatCoins(value: number): string {
  return `${value < 0 ? "-" : ""}${Math.abs(value).toString().padStart(3, "0")}`;
}

export default function RoutingGourd() {
  const [model, setModel] = useState<Model>(INITIAL_MODEL);
  const modelRef = useRef<Model>(INITIAL_MODEL);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setModel((current) => advanceModel(current, 1));
    }, 180);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    window.routing_gourd_render_to_text = () => {
      const current = modelRef.current;
      return [
        "routing-gourd",
        `phase:${current.phase}`,
        `presses:${current.presses}`,
        `routes:${current.routes}`,
        `balance:${balanceFor(current)}`,
        `bankrupt:${isBankrupt(current) ? 1 : 0}`,
      ].join("|");
    };
    window.routing_gourd_advance = (steps: number) => {
      const safeSteps = Math.max(0, Math.floor(steps));
      setModel((current) => advanceModel(current, safeSteps));
    };
    return () => {
      delete window.routing_gourd_render_to_text;
      delete window.routing_gourd_advance;
    };
  }, []);

  const balance = balanceFor(model);
  const bankrupt = isBankrupt(model);
  const visibleBlisters = Math.min(BLISTERS.length, 4 + model.presses);
  const visibleTags = Math.min(ROUTE_TAGS.length, 2 + Math.floor(model.presses / 2));
  const forecast = FORECASTS[model.forecastIndex];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "72% 28%",
        background: "#fffdf6",
        color: "#332612",
        fontFamily: "var(--font-geist-mono), monospace",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onPointerDown={() => {
          setModel((current) => pressModel(current));
        }}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          padding: "0",
          border: "0",
          background: "linear-gradient(180deg, #fffdf6 0%, #fff8e8 100%)",
          cursor: "pointer",
          textAlign: "left",
        }}
        aria-label="Press the routing gourd to buy another DN42 scan."
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <defs>
            <linearGradient id="routing-gourd-skin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d7f06b" />
              <stop offset="48%" stopColor="#9bd43a" />
              <stop offset="100%" stopColor="#f29a29" />
            </linearGradient>
            <linearGradient id="routing-gourd-core" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff4ce" />
              <stop offset="100%" stopColor="#ffd76a" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="#fffdf6" />
          <path
            d="M12 92C23 85 29 88 38 82C47 76 53 79 63 72C71 67 78 68 88 63L88 100L12 100Z"
            fill="#f2e8cb"
          />
          <path
            d="M56 12C63 12 67 16 67 21C67 27 61 31 55 31C47 31 41 28 40 21C39 15 47 12 56 12Z"
            fill="#52761f"
          />
          <path
            d="M50 13C55 7 63 4 71 7C76 9 79 14 79 18C79 20 77 21 75 19C70 14 64 13 58 15C54 16 48 18 50 13Z"
            fill="#7da72f"
          />
          <path
            d="M5 17C28 18 41 16 56 18C71 20 84 26 90 39C96 52 92 70 81 80C70 90 53 95 34 91C18 88 4 76 1 59C-2 42 2 28 5 17Z"
            fill="url(#routing-gourd-skin)"
          />
          {BLISTERS.map((blister, index) => {
            const active = index < visibleBlisters;
            const pulse = active ? 1 + Math.sin((model.phase + index * 2) * 0.28) * 0.06 : 0.92;
            const shiftX = Math.sin((model.phase + index * 3) * 0.18) * (active ? 0.7 : 0.2);
            const shiftY = Math.cos((model.phase + index * 2) * 0.2) * (active ? 0.9 : 0.3);
            return (
              <ellipse
                key={`${blister.cx}-${blister.cy}`}
                cx={blister.cx + shiftX}
                cy={blister.cy + shiftY}
                rx={blister.rx * pulse}
                ry={blister.ry * pulse}
                fill={blister.fill}
                opacity={active ? 0.97 : 0.46}
              />
            );
          })}
          <ellipse
            cx={48}
            cy={49}
            rx={16 + Math.sin(model.phase * 0.24) * 0.5}
            ry={18 + Math.cos(model.phase * 0.2) * 0.5}
            fill="url(#routing-gourd-core)"
            opacity={0.72}
          />
          <path
            d="M6 18C30 18 41 18 57 20C71 22 82 28 87 39C92 50 90 67 79 78"
            fill="none"
            stroke="#fff8de"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M31 18C28 29 29 40 34 49C39 58 39 70 34 84"
            fill="none"
            stroke="#ef7d34"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M53 21C49 32 50 44 56 55C61 65 61 77 56 87"
            fill="none"
            stroke="#ef7d34"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M71 28C67 37 68 48 73 56C77 63 77 72 73 82"
            fill="none"
            stroke="#ef7d34"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M77 56C89 56 92 59 96 69C97 73 98 79 96 84"
            fill="none"
            stroke="#ef6d2f"
            strokeWidth="1.8"
            strokeDasharray="2 2"
          />
          {ROUTE_TAGS.map((tag, index) => {
            if (index >= visibleTags) {
              return null;
            }
            const wobble = Math.sin((model.phase + index * 5) * 0.22) * 1.5;
            return (
              <g
                key={tag.label}
                transform={`translate(${tag.x + wobble} ${tag.y + wobble}) rotate(${tag.rotation + wobble})`}
              >
                <rect x="0" y="0" rx="1.8" ry="1.8" width="14" height="6" fill={tag.fill} />
                <text
                  x="7"
                  y="4.2"
                  textAnchor="middle"
                  fontSize="2.5"
                  fontFamily="var(--font-geist-mono), monospace"
                  fill="#29180b"
                >
                  {tag.label}
                </text>
              </g>
            );
          })}
          <path
            d="M78 58C84 60 88 63 92 66"
            fill="none"
            stroke="#7d5227"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M89 66C94 66 98 67 100 68L100 100L92 100C90 94 88 90 87 83C86 77 87 71 89 66Z"
            fill="#fff1c2"
          />
          <line x1="90" y1="72" x2="98" y2="72" stroke="#7b5d39" strokeWidth="1.2" />
          <line x1="90" y1="76" x2="98" y2="76" stroke="#7b5d39" strokeWidth="1.2" />
          <line x1="90" y1="80" x2="98" y2="80" stroke="#7b5d39" strokeWidth="1.2" />
          <line x1="90" y1="84" x2="97" y2="84" stroke="#7b5d39" strokeWidth="1.2" />
          <circle cx="18" cy="22" r="1.6" fill="#ef6d2f" />
          <circle cx="24" cy="79" r="1.2" fill="#8ed8e8" />
        </svg>

        <div
          style={{
            position: "absolute",
            left: "4.5%",
            top: "5%",
            maxWidth: "44%",
            fontSize: "clamp(10px, 1.4vw, 12px)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            lineHeight: 1.25,
          }}
        >
          route weather
          <br />
          dn42 produce
        </div>
        <div
          style={{
            position: "absolute",
            left: "4.5%",
            bottom: "6%",
            maxWidth: "40%",
            fontSize: "clamp(13px, 2.05vw, 18px)",
            lineHeight: 1.15,
          }}
        >
          press the belly
        </div>
      </button>

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "stretch",
          padding: "3.5% 5% 3.5% 0",
        }}
      >
        <div
          style={{
            width: "100%",
            background: bankrupt ? "#f36f33" : "#ffe9b8",
            borderLeft: "2px solid #6b512d",
            borderBottom: "2px solid #6b512d",
            borderRight: "2px solid #6b512d",
            padding: "10% 11% 8%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transform: `translateY(${Math.sin(model.phase * 0.18) * 0.6}px)`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "clamp(10px, 1.7vw, 13px)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "8%",
              }}
            >
              stall slip
            </div>
            <div style={{ fontSize: "clamp(21px, 3.8vw, 35px)", lineHeight: 0.9, marginBottom: "10%" }}>
              {bankrupt ? "empty" : "still good"}
            </div>
            <div style={{ fontSize: "clamp(10px, 1.55vw, 12px)", lineHeight: 1.45, textTransform: "uppercase" }}>
              forecast
              <br />
              {forecast}
              <br />
              routes {model.routes}
            </div>
          </div>

          <div
            style={{
              borderTop: "2px dashed rgba(51, 38, 18, 0.45)",
              marginTop: "8%",
              paddingTop: "8%",
              display: "grid",
              gap: "7%",
              fontSize: "clamp(10px, 1.55vw, 12px)",
              textTransform: "uppercase",
            }}
          >
            <div>
              spent
              <br />
              {formatCoins(model.spent)}
            </div>
            <div>
              balance
              <br />
              {formatCoins(balance)}
            </div>
            <div>
              presses
              <br />
              {model.presses.toString().padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
