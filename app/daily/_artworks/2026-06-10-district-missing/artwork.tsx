"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    district_missing_render_to_text?: () => string;
    district_missing_advance?: (steps: number) => void;
  }
}

type SlotKey = "county" | "slough" | "elevation" | "district";

type Model = {
  phase: number;
  filed: Array<SlotKey>;
  districtIndex: number;
  jamCount: number;
  presses: number;
};

const DISTRICT_LABELS = [
  "reclamation district ?",
  "reclamation district — no match",
  "not managed by any reclamation district",
] as const;

const SLOT_LABELS: Record<Exclude<SlotKey, "district">, string> = {
  county: "solano county",
  slough: "suisun slough",
  elevation: "16 ft / 4.9 m",
};

const INITIAL_MODEL: Model = {
  phase: 0,
  filed: [],
  districtIndex: 0,
  jamCount: 0,
  presses: 0,
};

function includesSlot(list: Array<SlotKey>, slot: SlotKey): boolean {
  return list.includes(slot);
}

function isFinished(model: Model): boolean {
  return includesSlot(model.filed, "county")
    && includesSlot(model.filed, "slough")
    && includesSlot(model.filed, "elevation")
    && includesSlot(model.filed, "district");
}

function advanceModel(model: Model, steps: number): Model {
  return {
    ...model,
    phase: model.phase + steps,
  };
}

function pressSlot(model: Model, slot: SlotKey): Model {
  const next = {
    ...model,
    phase: model.phase + 1,
    presses: model.presses + 1,
  };

  if (slot === "district") {
    const districtIndex = Math.min(DISTRICT_LABELS.length - 1, next.districtIndex + 1);
    const filed: Array<SlotKey> = districtIndex === DISTRICT_LABELS.length - 1 && !includesSlot(next.filed, "district")
      ? [...next.filed, "district"]
      : next.filed;
    return {
      ...next,
      districtIndex,
      jamCount: next.jamCount + (districtIndex === DISTRICT_LABELS.length - 1 ? 0 : 1),
      filed,
    };
  }

  if (includesSlot(next.filed, slot)) {
    return next;
  }

  return {
    ...next,
    filed: [...next.filed, slot],
  };
}

function strapShift(phase: number, row: number, filled: boolean): string {
  const x = Math.sin((phase + row * 2) * 0.55) * (filled ? 2.5 : 4);
  const y = Math.cos((phase + row * 3) * 0.4) * (filled ? 1.5 : 2.2);
  return `translate(${x}px, ${y}px) rotate(${Math.sin((phase + row) * 0.3) * (filled ? 0.3 : 0.7)}deg)`;
}

export default function DistrictMissing() {
  const [model, setModel] = useState<Model>(INITIAL_MODEL);
  const modelRef = useRef<Model>(INITIAL_MODEL);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setModel((current) => advanceModel(current, 1));
    }, 220);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    window.district_missing_render_to_text = () => {
      const current = modelRef.current;
      return [
        "district-missing",
        `phase:${current.phase}`,
        `filed:${current.filed.join(",") || "none"}`,
        `district:${current.districtIndex}`,
        `jams:${current.jamCount}`,
        `finished:${isFinished(current) ? 1 : 0}`,
      ].join("|");
    };
    window.district_missing_advance = (steps: number) => {
      const safeSteps = Math.max(0, Math.floor(steps));
      setModel((current) => advanceModel(current, safeSteps));
    };
    return () => {
      delete window.district_missing_render_to_text;
      delete window.district_missing_advance;
    };
  }, []);

  const districtFiled = includesSlot(model.filed, "district");
  const finished = isFinished(model);
  const districtLabel = DISTRICT_LABELS[model.districtIndex];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "1fr auto",
        background:
          "linear-gradient(180deg, #7f8a58 0%, #808a56 18%, #90986a 18%, #90986a 100%)",
        color: "#273016",
        fontFamily: "var(--font-geist-mono), monospace",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(244, 239, 221, 0.08) 0 1px, transparent 1px 100%), linear-gradient(180deg, rgba(244, 239, 221, 0.08) 0 1px, transparent 1px 100%)",
          backgroundSize: "28px 28px",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", padding: "5.2% 5.2% 0" }}>
        <div
          style={{
            position: "relative",
            height: "100%",
            borderRadius: "24px 24px 20px 20px",
            background: "#ece4c7",
            boxShadow: "inset 0 0 0 2px rgba(82, 93, 49, 0.16)",
            padding: "5.5% 5.5% 7%",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "-2%",
              top: "12%",
              width: "19%",
              height: "34%",
              background: "#90986a",
              clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0 100%, 12% 78%, 0 54%, 12% 28%)",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "4%",
              marginBottom: "5%",
            }}
          >
            <div>
              <div style={{ fontSize: "clamp(10px, 1.8vw, 13px)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                goat island intake
              </div>
              <div
                style={{
                  marginTop: "2%",
                  fontSize: "clamp(28px, 6vw, 54px)",
                  lineHeight: 0.9,
                  textTransform: "uppercase",
                  color: "#32401f",
                }}
              >
                district
                <br />
                missing
              </div>
            </div>
            <div
              style={{
                width: "26%",
                textAlign: "right",
                fontSize: "clamp(10px, 1.7vw, 13px)",
                lineHeight: 1.45,
                textTransform: "uppercase",
              }}
            >
              38°12′51″n
              <br />
              122°02′03″w
              <br />
              suisun bench 16 ft
            </div>
          </div>

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: "19% 6% 23%",
              width: "88%",
              height: "58%",
              pointerEvents: "none",
              opacity: 0.9,
            }}
          >
            {[0, 1, 2, 3].map((row) => {
              const filed = row === 0
                ? includesSlot(model.filed, "county")
                : row === 1
                  ? includesSlot(model.filed, "slough")
                  : row === 2
                    ? includesSlot(model.filed, "elevation")
                    : districtFiled;
              const sway = Math.sin((model.phase + row * 4) * 0.35) * 2;
              return (
                <path
                  key={row}
                  d={`M 7 ${78 + row * 5} C 26 ${74 + row * 2 + sway}, 42 ${32 + row * 12}, 84 ${18 + row * 20}`}
                  fill="none"
                  stroke={filed ? "#cb4a3f" : "#8f9a6b"}
                  strokeWidth="3.2"
                  strokeDasharray={filed ? "16 6" : "8 8"}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          <div style={{ display: "grid", gap: "3.2%", position: "relative" }}>
            {(["county", "slough", "elevation", "district"] as const).map((slot, index) => {
              const filed = includesSlot(model.filed, slot);
              const label = slot === "district" ? districtLabel : SLOT_LABELS[slot];
              return (
                <div
                  key={slot}
                  style={{
                    transform: strapShift(model.phase, index, filed),
                    transition: "transform 180ms ease-out, background-color 180ms ease-out, color 180ms ease-out",
                    display: "grid",
                    gridTemplateColumns: "18% 1fr",
                    alignItems: "stretch",
                    minHeight: "clamp(42px, 9vw, 62px)",
                    borderRadius: "18px",
                    overflow: "hidden",
                    background: filed ? "#cb4a3f" : slot === "district" ? "#d6c98d" : "#bcc58e",
                    color: filed ? "#fff7eb" : "#293217",
                    boxShadow: "0 2px 0 rgba(40, 48, 22, 0.14)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      placeItems: "center",
                      background: filed ? "rgba(47, 18, 15, 0.18)" : "rgba(61, 74, 37, 0.12)",
                      fontSize: "clamp(9px, 1.3vw, 11px)",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                  >
                    {slot}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "0 4.5%",
                      fontSize: slot === "district" ? "clamp(11px, 2vw, 15px)" : "clamp(13px, 2.6vw, 20px)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "5.5%",
              right: "23%",
              bottom: "6.5%",
              display: "flex",
              justifyContent: "space-between",
              gap: "4%",
              fontSize: "clamp(9px, 1.6vw, 12px)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            <span>jams {model.jamCount.toString().padStart(2, "0")}</span>
            <span>{finished ? "admission accepted" : "bench still arguing"}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          padding: "3.8% 4.8% 5%",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "3.2%",
        }}
      >
        {(["county", "slough", "elevation", "district"] as const).map((slot, index) => {
          const filled = includesSlot(model.filed, slot);
          const canGlow = slot === "district" ? !districtFiled : !filled;
          const subtitle = slot === "district"
            ? districtFiled
              ? "truth filed"
              : model.districtIndex === 0
                ? "missing page"
                : "still jamming"
            : filled
              ? "filed"
              : "press to file";
          return (
            <button
              key={slot}
              type="button"
              onClick={() => {
                setModel((current) => pressSlot(current, slot));
              }}
              style={{
                border: "none",
                borderRadius: "18px",
                background: filled || districtFiled && slot === "district" ? "#f0e7cb" : "#31401c",
                color: filled || districtFiled && slot === "district" ? "#293317" : "#eff0d8",
                minHeight: "clamp(62px, 14vw, 92px)",
                padding: "0 6%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
                gap: "5%",
                textAlign: "left",
                cursor: "pointer",
                transform: `translateY(${Math.sin((model.phase + index) * 0.45) * 1.8}px)`,
                transition: "transform 180ms ease-out, background-color 180ms ease-out, color 180ms ease-out",
                boxShadow: canGlow ? "inset 0 -3px 0 rgba(255, 255, 255, 0.12)" : "inset 0 -3px 0 rgba(39, 49, 22, 0.1)",
              }}
            >
              <span style={{ fontSize: "clamp(13px, 2.9vw, 23px)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {slot}
              </span>
              <span style={{ fontSize: "clamp(9px, 1.5vw, 12px)", letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.82 }}>
                {subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
