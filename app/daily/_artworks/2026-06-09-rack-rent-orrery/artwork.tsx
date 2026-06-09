"use client";

import { useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    rack_rent_orrery_render_to_text?: () => string;
    rack_rent_orrery_advance?: (steps: number) => void;
  }
}

type KnobKey = "gain" | "lease" | "focus";
type KnobState = Record<KnobKey, number>;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function nearestScale(input: number): number {
  const steps = [0.16, 0.31, 0.48, 0.63, 0.79, 0.93];
  let nearest = steps[0];
  let nearestDistance = Math.abs(input - nearest);
  for (const step of steps) {
    const distance = Math.abs(input - step);
    if (distance < nearestDistance) {
      nearest = step;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export default function RackRentOrrery() {
  const [knobs, setKnobs] = useState<KnobState>({ gain: 0.22, lease: 0.71, focus: 0.34 });
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let frame = 0;
    let rafId = 0;

    const tick = () => {
      frame += 1;
      setPhase(frame / 60);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const tuning = useMemo(() => {
    const snappedGain = nearestScale(knobs.gain);
    const snappedLease = nearestScale(knobs.lease);
    const snappedFocus = nearestScale(knobs.focus);
    const harmony = 1 - (Math.abs(knobs.gain - snappedGain) + Math.abs(knobs.lease - snappedLease) + Math.abs(knobs.focus - snappedFocus)) / 1.4;
    const meter = clamp(harmony, 0, 1);
    const note = meter > 0.84 ? "aria-ready" : meter > 0.62 ? "warming" : meter > 0.41 ? "misaligned" : "rent-noise";
    return { meter, note };
  }, [knobs]);

  useEffect(() => {
    window.rack_rent_orrery_render_to_text = () =>
      `rack-rent-orrery|meter:${tuning.meter.toFixed(2)}|note:${tuning.note}|gain:${knobs.gain.toFixed(2)}|lease:${knobs.lease.toFixed(2)}|focus:${knobs.focus.toFixed(2)}`;

    window.rack_rent_orrery_advance = (steps: number) => {
      const safeSteps = Math.max(0, Math.floor(steps));
      setPhase((current) => current + safeSteps / 60);
    };

    return () => {
      delete window.rack_rent_orrery_render_to_text;
      delete window.rack_rent_orrery_advance;
    };
  }, [knobs, tuning]);

  const misalignX = Math.sin(phase * 1.8) * 10;
  const misalignY = Math.cos(phase * 1.2) * 6;
  const lungLift = Math.sin(phase * 2.2) * 12;
  const meterOffset = (1 - tuning.meter) * 20;

  const knobControl = (key: KnobKey, label: string) => (
    <label key={key} style={{ display: "grid", gap: 4, fontSize: 11, lineHeight: 1.2 }}>
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(knobs[key] * 100)}
        onChange={(event) => {
          const value = Number(event.target.value) / 100;
          setKnobs((current) => ({ ...current, [key]: value }));
        }}
        aria-label={label}
        style={{ width: 92, height: 12 }}
      />
    </label>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#ff5a1f",
        color: "#2a0f00",
        display: "grid",
        gridTemplateRows: "1fr auto",
        padding: 10,
        boxSizing: "border-box",
        gap: 8,
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label="Rack rent orrery instrument">
        <rect x="2" y="2" width="96" height="96" rx="5" fill="#ff8f36" stroke="#3b1200" strokeWidth="1.2" />
        <rect x="11" y="14" width="78" height="72" rx="4" fill="#ffce7a" stroke="#4a1800" strokeWidth="1.3" />

        <g transform={`translate(${45 + misalignX * 0.08} ${41 + misalignY * 0.08})`}>
          <ellipse cx="0" cy={2 + lungLift * 0.04} rx="20" ry="12" fill="#ff2f69" />
          <ellipse cx="0" cy={8 + lungLift * 0.03} rx="17" ry="8" fill="#ff7d3f" />
          <rect x="-22" y="-16" width="44" height="42" rx="3" fill="none" stroke="#5f1300" strokeWidth="1.4" />
          <line x1="-10" y1="-16" x2="-10" y2="26" stroke="#5f1300" strokeWidth="1" />
          <line x1="4" y1="-16" x2="4" y2="26" stroke="#5f1300" strokeWidth="1" />
          <line x1="17" y1="-16" x2="17" y2="26" stroke="#5f1300" strokeWidth="1" />
        </g>

        <g transform={`translate(${22 + meterOffset * 0.12} ${22 + misalignY * 0.04})`}>
          <rect x="0" y="0" width="22" height="10" rx="1.4" fill="#1e2f13" stroke="#9ef86d" strokeWidth="0.7" />
          <rect x="1.5" y="2" width={Math.max(1, tuning.meter * 19)} height="6" rx="0.6" fill="#85ff5f" />
          <text x="11" y="7.2" textAnchor="middle" fontSize="2.8" fill="#d4ffd4" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            {tuning.note}
          </text>
        </g>

        <g fill="#2c1000" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
          <text x="13" y="13" fontSize="3">HKO RENT RACK</text>
          <text x="63" y="13" fontSize="2.8">yield choir</text>
          <text x="13" y="90" fontSize="2.8">tune all knobs until the dome stops whining</text>
        </g>
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 6,
          alignItems: "center",
          padding: "4px 2px 0",
          borderTop: "1px solid rgba(70, 20, 0, 0.45)",
        }}
      >
        {knobControl("gain", "gain µ")}
        {knobControl("lease", "lease µ")}
        {knobControl("focus", "focus µ")}
      </div>
    </div>
  );
}
