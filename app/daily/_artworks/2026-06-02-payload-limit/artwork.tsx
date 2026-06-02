"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    payload_limit_render_to_text?: () => string;
    payload_limit_advance?: (steps: number) => void;
  }
}

// Georgian Express Flight 126 — representative passenger load data
// Pelee Island → Windsor, Ontario — 17 January 2004 — Cessna 208B Grand Caravan
const PASSENGERS = [
  { seat: "1A", name: "R. HOLT", wt: 194 },
  { seat: "1B", name: "B. HOLT", wt: 162 },
  { seat: "2A", name: "T. KRAWEC", wt: 218 },
  { seat: "2B", name: "P. KRAWEC", wt: 171 },
  { seat: "3A", name: "D. LEMIEUX", wt: 208 },
  { seat: "3B", name: "M. TUREK", wt: 188 },
  { seat: "4A", name: "G. POHL", wt: 183 },
  { seat: "4B", name: "A. BESTER", wt: 186 },
  { seat: "5A", name: "C. WOOD", wt: 197 },
  { seat: "5B", name: "L. RIES", wt: 161 },
] as const;

const TOTAL_PAX_WT = PASSENGERS.reduce((s, p) => s + p.wt, 0); // 1868 lbs
const MAX_PAYLOAD_LBS = 1750; // certified payload limit for this configuration and fuel load
const OVER_LBS = TOTAL_PAX_WT - MAX_PAYLOAD_LBS; // 118 lbs

// CG positions as normalized fraction of the aft-limit boundary
// 0.0 = at the forward limit; 1.0 = exactly at the aft limit; >1.0 = beyond aft limit
// Dispatcher's recorded CG (using stated weights): just inside the safe zone
const CG_OFFICIAL = 0.82;
// Actual CG computed from field-measured weights and aft-heavy seating distribution
const CG_ACTUAL = 1.17;

// The CG envelope SVG: safe zone occupies the middle band of the diagram
// X axis (horizontal): CG position (left = forward limit, right = aft limit boundary + margin)
// Envelope SVG is 200×130 viewBox
const ENV_W = 200;
const ENV_H = 130;
// Safe zone X coordinates
const ENV_SAFE_X1 = 20; // forward limit
const ENV_SAFE_X2 = 140; // aft limit
const ENV_SAFE_Y1 = 15; // top of zone
const ENV_SAFE_Y2 = 110; // bottom of zone

// Convert normalized CG to SVG X coordinate
function cgToX(cg: number): number {
  // CG 0.0 maps to ENV_SAFE_X1, CG 1.0 maps to ENV_SAFE_X2
  return ENV_SAFE_X1 + cg * (ENV_SAFE_X2 - ENV_SAFE_X1);
}

// CG dot Y position (midpoint of safe zone)
const DOT_Y = (ENV_SAFE_Y1 + ENV_SAFE_Y2) / 2;

const KIOSK_STYLES = {
  NAVY: "#002060",
  RED: "#D01E2F",
  YELLOW: "#FFB700",
  WHITE: "#FFFFFF",
  LIGHT: "#F4F6FA",
  MID: "#DDE3F0",
  GREEN: "#006B3C",
} as const;

export default function PayloadLimit() {
  const [isShaking, setIsShaking] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const shakeActiveRef = useRef(false);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerShake = useCallback(() => {
    if (shakeActiveRef.current) return;
    shakeActiveRef.current = true;
    setIsShaking(true);
    setRevealed(true);

    setTimeout(() => {
      setIsShaking(false);
      shakeActiveRef.current = false;
    }, 550);

    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    revealTimerRef.current = setTimeout(() => {
      setRevealed(false);
    }, 5000);
  }, []);

  // Testability hooks
  useEffect(() => {
    window.payload_limit_render_to_text = () =>
      `state:${revealed ? "revealed" : "nominal"};payload:${TOTAL_PAX_WT}lbs;limit:${MAX_PAYLOAD_LBS}lbs;over:${OVER_LBS}lbs;cg:${revealed ? CG_ACTUAL.toFixed(2) : CG_OFFICIAL.toFixed(2)}`;

    window.payload_limit_advance = (steps: number) => {
      if (steps > 0) {
        setRevealed(true);
        if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
        revealTimerRef.current = setTimeout(() => setRevealed(false), 5000);
      }
    };

    return () => {
      delete window.payload_limit_render_to_text;
      delete window.payload_limit_advance;
    };
  }, [revealed]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  // Weight bar fill: how full is the payload (capped at 130% for display)
  const barOverPct = Math.min((OVER_LBS / MAX_PAYLOAD_LBS) * 100, 30);

  // CG dot position in the SVG
  const cgX = cgToX(revealed ? CG_ACTUAL : CG_OFFICIAL);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#C8CEDB",
        fontFamily: "'Courier New', Courier, monospace",
        userSelect: "none",
        cursor: "pointer",
        overflow: "hidden",
        padding: "2%",
        boxSizing: "border-box",
      }}
      onClick={triggerShake}
      role="button"
      aria-label="Shake the departure kiosk to inspect the weight and balance"
    >
      <style>{`
        @keyframes kiosk-shake {
          0%   { transform: translate(0,0) rotate(0deg); }
          10%  { transform: translate(-7px,2px) rotate(-0.6deg); }
          20%  { transform: translate(7px,-2px) rotate(0.6deg); }
          30%  { transform: translate(-6px,1px) rotate(-0.4deg); }
          40%  { transform: translate(6px,-1px) rotate(0.4deg); }
          50%  { transform: translate(-4px,1px) rotate(-0.2deg); }
          60%  { transform: translate(4px,-1px) rotate(0.2deg); }
          70%  { transform: translate(-2px,0px); }
          80%  { transform: translate(2px,0px); }
          90%  { transform: translate(-1px,0px); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        @keyframes pl-breathe {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.38; }
        }
        @keyframes pl-cg-slide {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Kiosk body */}
      <div
        style={{
          animation: isShaking ? "kiosk-shake 0.55s ease-in-out" : undefined,
          width: "100%",
          maxWidth: "600px",
          height: "100%",
          maxHeight: "580px",
          background: KIOSK_STYLES.WHITE,
          border: `4px solid ${KIOSK_STYLES.NAVY}`,
          borderRadius: "6px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 4px 18px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: KIOSK_STYLES.NAVY,
            color: KIOSK_STYLES.WHITE,
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: "clamp(8px,2vw,13px)", fontWeight: "bold", letterSpacing: "0.08em" }}>
              GEORGIAN EXPRESS AIRLINES
            </div>
            <div style={{ fontSize: "clamp(6px,1.5vw,10px)", opacity: 0.75, letterSpacing: "0.06em" }}>
              FLT 126 &nbsp;·&nbsp; PELEE ISLAND → WINDSOR &nbsp;·&nbsp; 17-JAN-2004
            </div>
          </div>
          {/* Breathing status indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: revealed ? KIOSK_STYLES.RED : KIOSK_STYLES.GREEN,
                animation: revealed ? undefined : "pl-breathe 2s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: "clamp(6px,1.4vw,9px)",
                fontWeight: "bold",
                letterSpacing: "0.05em",
                color: revealed ? KIOSK_STYLES.YELLOW : KIOSK_STYLES.WHITE,
                whiteSpace: "nowrap",
              }}
            >
              {revealed ? "⚠ WEIGHT DEVIATION" : "CLEARED FOR DEPARTURE ✓"}
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "flex",
            background: KIOSK_STYLES.MID,
            borderBottom: `2px solid ${KIOSK_STYLES.NAVY}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "60%",
              padding: "3px 8px",
              fontSize: "clamp(6px,1.4vw,9px)",
              fontWeight: "bold",
              color: KIOSK_STYLES.NAVY,
              letterSpacing: "0.1em",
              borderRight: `2px solid ${KIOSK_STYLES.NAVY}`,
            }}
          >
            PASSENGER MANIFEST
          </div>
          <div
            style={{
              width: "40%",
              padding: "3px 8px",
              fontSize: "clamp(6px,1.4vw,9px)",
              fontWeight: "bold",
              color: KIOSK_STYLES.NAVY,
              letterSpacing: "0.1em",
            }}
          >
            WEIGHT &amp; BALANCE
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
          }}
        >
          {/* Left panel — passenger manifest (60%) */}
          <div
            style={{
              width: "60%",
              borderRight: `2px solid ${KIOSK_STYLES.NAVY}`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Passenger rows */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              {PASSENGERS.map((p, i) => (
                <div
                  key={p.seat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    background: i % 2 === 0 ? KIOSK_STYLES.WHITE : KIOSK_STYLES.LIGHT,
                    borderBottom: `1px solid ${KIOSK_STYLES.MID}`,
                  }}
                >
                  {/* Seat */}
                  <div
                    style={{
                      width: "22%",
                      fontSize: "clamp(6px,1.4vw,9px)",
                      color: KIOSK_STYLES.NAVY,
                      fontWeight: "bold",
                    }}
                  >
                    {p.seat}
                  </div>
                  {/* Name */}
                  <div
                    style={{
                      flex: 1,
                      fontSize: "clamp(6px,1.5vw,10px)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {p.name}
                  </div>
                  {/* Weight */}
                  <div
                    style={{
                      width: "30%",
                      textAlign: "right",
                      fontSize: "clamp(6px,1.5vw,10px)",
                      fontWeight: "bold",
                    }}
                  >
                    {p.wt} LBS
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div
              style={{
                borderTop: `2px solid ${KIOSK_STYLES.NAVY}`,
                padding: "4px 8px",
                background: KIOSK_STYLES.LIGHT,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "clamp(6px,1.4vw,9px)",
                  marginBottom: "2px",
                  color: KIOSK_STYLES.NAVY,
                }}
              >
                <span>TOTAL PAX</span>
                <span style={{ fontWeight: "bold", color: revealed ? KIOSK_STYLES.RED : KIOSK_STYLES.NAVY }}>
                  {TOTAL_PAX_WT} LBS
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "clamp(6px,1.4vw,9px)",
                  marginBottom: "4px",
                  color: KIOSK_STYLES.NAVY,
                }}
              >
                <span>MAX PAYLOAD</span>
                <span>{MAX_PAYLOAD_LBS} LBS</span>
              </div>

              {/* Weight bar */}
              <div
                style={{
                  height: "10px",
                  background: KIOSK_STYLES.MID,
                  border: `1px solid ${KIOSK_STYLES.NAVY}`,
                  borderRadius: "2px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Green safe fill */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${Math.min((MAX_PAYLOAD_LBS / (MAX_PAYLOAD_LBS * 1.3)) * 100, 76.9)}%`,
                    background: KIOSK_STYLES.GREEN,
                    transition: "width 0.3s",
                  }}
                />
                {/* Red overload fill */}
                {revealed && (
                  <div
                    style={{
                      position: "absolute",
                      left: `76.9%`,
                      top: 0,
                      height: "100%",
                      width: `${barOverPct / 1.3}%`,
                      background: KIOSK_STYLES.RED,
                      transition: "width 0.3s",
                    }}
                  />
                )}
                {/* Max marker */}
                <div
                  style={{
                    position: "absolute",
                    left: "76.9%",
                    top: 0,
                    height: "100%",
                    width: "2px",
                    background: KIOSK_STYLES.NAVY,
                  }}
                />
              </div>

              {revealed && (
                <div
                  style={{
                    fontSize: "clamp(5px,1.2vw,8px)",
                    color: KIOSK_STYLES.RED,
                    fontWeight: "bold",
                    textAlign: "right",
                    marginTop: "2px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {OVER_LBS} LBS OVER MAX PAYLOAD
                </div>
              )}
            </div>
          </div>

          {/* Right panel — CG envelope (40%) */}
          <div
            style={{
              width: "40%",
              display: "flex",
              flexDirection: "column",
              padding: "6px 6px 4px",
              background: KIOSK_STYLES.LIGHT,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: "clamp(5px,1.2vw,8px)",
                color: KIOSK_STYLES.NAVY,
                fontWeight: "bold",
                letterSpacing: "0.08em",
                marginBottom: "4px",
                flexShrink: 0,
              }}
            >
              C.G. ENVELOPE — CESSNA 208B
            </div>

            {/* SVG diagram */}
            <svg
              viewBox={`0 0 ${ENV_W} ${ENV_H}`}
              style={{ width: "100%", flex: 1, overflow: "visible" }}
              aria-label="Weight and balance CG envelope diagram"
            >
              {/* Background */}
              <rect x={0} y={0} width={ENV_W} height={ENV_H} fill={KIOSK_STYLES.WHITE} stroke={KIOSK_STYLES.NAVY} strokeWidth={1} />

              {/* Safe zone (green trapezoid — simplified as rectangle) */}
              <rect
                x={ENV_SAFE_X1}
                y={ENV_SAFE_Y1}
                width={ENV_SAFE_X2 - ENV_SAFE_X1}
                height={ENV_SAFE_Y2 - ENV_SAFE_Y1}
                fill="#d4edda"
                stroke={KIOSK_STYLES.GREEN}
                strokeWidth={1.5}
              />

              {/* "SAFE" label */}
              <text
                x={(ENV_SAFE_X1 + ENV_SAFE_X2) / 2}
                y={DOT_Y - 12}
                textAnchor="middle"
                fontSize={8}
                fill={KIOSK_STYLES.GREEN}
                fontFamily="Courier New, monospace"
                fontWeight="bold"
              >
                SAFE
              </text>
              <text
                x={(ENV_SAFE_X1 + ENV_SAFE_X2) / 2}
                y={DOT_Y}
                textAnchor="middle"
                fontSize={8}
                fill={KIOSK_STYLES.GREEN}
                fontFamily="Courier New, monospace"
                fontWeight="bold"
              >
                ZONE
              </text>

              {/* Aft danger zone */}
              <rect
                x={ENV_SAFE_X2}
                y={ENV_SAFE_Y1}
                width={ENV_W - ENV_SAFE_X2 - 8}
                height={ENV_SAFE_Y2 - ENV_SAFE_Y1}
                fill={revealed ? "rgba(208,30,47,0.15)" : "rgba(200,200,200,0.3)"}
              />

              {/* Axis labels */}
              <text
                x={ENV_SAFE_X1}
                y={ENV_H - 3}
                textAnchor="middle"
                fontSize={7}
                fill={KIOSK_STYLES.NAVY}
                fontFamily="Courier New, monospace"
              >
                FWD
              </text>
              <text
                x={ENV_SAFE_X2}
                y={ENV_H - 3}
                textAnchor="middle"
                fontSize={7}
                fill={revealed ? KIOSK_STYLES.RED : KIOSK_STYLES.NAVY}
                fontWeight={revealed ? "bold" : "normal"}
                fontFamily="Courier New, monospace"
              >
                AFT LIM
              </text>

              {/* Forward limit line */}
              <line
                x1={ENV_SAFE_X1}
                y1={ENV_SAFE_Y1 - 2}
                x2={ENV_SAFE_X1}
                y2={ENV_SAFE_Y2 + 2}
                stroke={KIOSK_STYLES.NAVY}
                strokeWidth={1.5}
                strokeDasharray="3,2"
              />

              {/* Aft limit line */}
              <line
                x1={ENV_SAFE_X2}
                y1={ENV_SAFE_Y1 - 2}
                x2={ENV_SAFE_X2}
                y2={ENV_SAFE_Y2 + 2}
                stroke={revealed ? KIOSK_STYLES.RED : KIOSK_STYLES.NAVY}
                strokeWidth={revealed ? 2 : 1.5}
                strokeDasharray="3,2"
              />

              {/* CG dot — official position (shown in normal state) */}
              {!revealed && (
                <circle
                  cx={cgToX(CG_OFFICIAL)}
                  cy={DOT_Y}
                  r={6}
                  fill={KIOSK_STYLES.NAVY}
                  stroke={KIOSK_STYLES.WHITE}
                  strokeWidth={1.5}
                />
              )}

              {/* CG dot — actual position (shown after shake) */}
              {revealed && (
                <>
                  {/* Ghost of official position */}
                  <circle
                    cx={cgToX(CG_OFFICIAL)}
                    cy={DOT_Y}
                    r={4}
                    fill="none"
                    stroke={KIOSK_STYLES.NAVY}
                    strokeWidth={1}
                    strokeDasharray="2,2"
                    opacity={0.5}
                  />
                  {/* Actual position (outside aft limit) */}
                  <circle
                    cx={cgX}
                    cy={DOT_Y}
                    r={7}
                    fill={KIOSK_STYLES.RED}
                    stroke={KIOSK_STYLES.WHITE}
                    strokeWidth={1.5}
                    style={{ animation: "pl-cg-slide 0.3s ease-out" }}
                  />
                  {/* X marker for violation */}
                  <text
                    x={cgX}
                    y={DOT_Y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9}
                    fill={KIOSK_STYLES.WHITE}
                    fontWeight="bold"
                    fontFamily="Courier New, monospace"
                    style={{ animation: "pl-cg-slide 0.3s ease-out" }}
                  >
                    ✕
                  </text>
                </>
              )}

              {/* CG annotation */}
              {revealed && (
                <text
                  x={cgX + 10}
                  y={DOT_Y - 8}
                  fontSize={7}
                  fill={KIOSK_STYLES.RED}
                  fontWeight="bold"
                  fontFamily="Courier New, monospace"
                  style={{ animation: "pl-cg-slide 0.3s ease-out" }}
                >
                  AFT OF LIMIT
                </text>
              )}
            </svg>

            {/* CG value readout */}
            <div
              style={{
                fontSize: "clamp(5px,1.1vw,7px)",
                color: revealed ? KIOSK_STYLES.RED : KIOSK_STYLES.NAVY,
                fontWeight: "bold",
                textAlign: "center",
                letterSpacing: "0.06em",
                marginTop: "2px",
                flexShrink: 0,
              }}
            >
              {revealed ? `C.G.: ${CG_ACTUAL.toFixed(2)} — AFT LIMIT EXCEEDED` : `C.G.: ${CG_OFFICIAL.toFixed(2)} — WITHIN LIMITS`}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            background: KIOSK_STYLES.NAVY,
            color: KIOSK_STYLES.WHITE,
            padding: "4px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: "clamp(5px,1.2vw,8px)", opacity: 0.7, letterSpacing: "0.06em" }}>
            GEORGIAN EXPRESS AIRLINES · REG: C-FEXC · CESSNA 208B GRAND CARAVAN
          </div>
          <div
            style={{
              fontSize: "clamp(5px,1.2vw,8px)",
              color: KIOSK_STYLES.YELLOW,
              fontWeight: "bold",
              letterSpacing: "0.06em",
              flexShrink: 0,
            }}
          >
            {revealed ? "SHAKE AGAIN TO RESET" : "← SHAKE TO INSPECT"}
          </div>
        </div>
      </div>
    </div>
  );
}
