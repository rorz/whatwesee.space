"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    held_line_render_to_text?: () => string;
    held_line_advance?: (steps: number) => void;
  }
}

const LAMP_COUNT = 48;
const labels = ["HOLD", "LINE", "PUBLIC", "ALARM", "REPEAT", "UNTIL", "TRUE", "LOUD"];

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export default function HeldLine() {
  const pressureRef = useRef(0);
  const frameRef = useRef(0);
  const holdingRef = useRef(false);
  const [pressure, setPressure] = useState(0);
  const [frame, setFrame] = useState(0);

  const lamps = useMemo(
    () =>
      Array.from({ length: LAMP_COUNT }, (_, index) => ({
        x: index % 8,
        y: Math.floor(index / 8),
        color: ["#ff2638", "#ffe600", "#0cf6ff", "#20ff78"][index % 4],
        phase: index * 0.41,
      })),
    [],
  );

  useEffect(() => {
    let rafId = 0;

    const step = (boost = 0) => {
      const direction = holdingRef.current ? 0.032 : -0.018;
      pressureRef.current = clamp01(pressureRef.current + direction + boost);
      frameRef.current += 1;
      if (frameRef.current % 2 === 0) {
        setPressure(pressureRef.current);
        setFrame(frameRef.current);
      }
    };

    const loop = () => {
      step();
      rafId = window.requestAnimationFrame(loop);
    };

    window.held_line_render_to_text = () =>
      `Held Line | pressure:${pressureRef.current.toFixed(3)} | holding:${holdingRef.current ? 1 : 0} | frame:${frameRef.current}`;

    window.held_line_advance = (steps: number) => {
      for (let i = 0; i < steps; i += 1) {
        step(0.006);
      }
      setPressure(pressureRef.current);
      setFrame(frameRef.current);
    };

    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
      delete window.held_line_render_to_text;
      delete window.held_line_advance;
    };
  }, []);

  const beginHold = () => {
    holdingRef.current = true;
    pressureRef.current = clamp01(pressureRef.current + 0.08);
    setPressure(pressureRef.current);
  };

  const endHold = () => {
    holdingRef.current = false;
    setPressure(pressureRef.current);
  };

  const siren = Math.sin(frame * 0.18) * 0.5 + 0.5;
  const hot = pressure > 0.62;

  return (
    <div
      className="relative h-full w-full touch-none select-none overflow-hidden bg-[#09090d]"
      onPointerDown={beginHold}
      onPointerUp={endHold}
      onPointerCancel={endHold}
      onPointerLeave={endHold}
      aria-label="A warning panel that only stays alive while pressed."
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgba(255,38,56,0.34), transparent 30%), linear-gradient(135deg, #09090d 0%, #10131a 44%, #050507 100%)",
        }}
      />

      <div className="absolute inset-[4%] grid grid-cols-[1fr_1.1fr] gap-[4%]">
        <div className="relative overflow-hidden border-[6px] border-[#f2f2f2] bg-[#ffe600] shadow-[0_0_36px_rgba(255,230,0,0.34)]">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#050507_0,#050507_18px,#ff2638_18px,#ff2638_36px)] opacity-35" />
          <div
            className="absolute left-1/2 top-1/2 aspect-square w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[10px] border-[#050507] bg-[#ff2638] shadow-[0_0_42px_rgba(255,38,56,0.8)]"
            style={{ transform: `translate(-50%, -50%) scale(${0.88 + pressure * 0.18})` }}
          />
          <div className="absolute left-1/2 top-1/2 flex aspect-square w-[45%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#f2f2f2] font-mono text-[clamp(1.2rem,5vw,3.2rem)] font-black text-[#050507]">
            HOLD
          </div>
          <div
            className="absolute bottom-[7%] left-[8%] right-[8%] h-[8%] bg-[#050507]"
            style={{ boxShadow: `0 0 ${18 + pressure * 44}px rgba(5,5,7,0.65)` }}
          />
        </div>

        <div className="relative overflow-hidden border-[6px] border-[#262b36] bg-[#111827]">
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-[1.6%] p-[5%]">
            {lamps.map((lamp, index) => {
              const active = pressure + Math.sin(frame * 0.12 + lamp.phase) * 0.22 > (index % 7) / 7;
              return (
                <span
                  key={`${lamp.x}-${lamp.y}`}
                  className="rounded-[2px] border border-white/10"
                  style={{
                    background: active ? lamp.color : "#141923",
                    boxShadow: active ? `0 0 ${10 + pressure * 28}px ${lamp.color}` : "inset 0 0 0 1px rgba(255,255,255,0.04)",
                    opacity: active ? 0.9 : 0.45,
                  }}
                />
              );
            })}
          </div>
          <div
            className="absolute left-0 top-0 h-full w-full mix-blend-screen"
            style={{
              background: `linear-gradient(${90 + siren * 140}deg, transparent 0%, rgba(12,246,255,${0.08 + pressure * 0.22}) 40%, transparent 72%)`,
            }}
          />
          <div className="absolute bottom-[5%] left-[5%] right-[5%] grid grid-cols-4 gap-[2%]">
            {labels.map((label, index) => (
              <div
                key={label}
                className="truncate border border-white/20 bg-[#050507] px-[4%] py-[6%] text-center font-mono text-[clamp(0.48rem,1.8vw,0.86rem)] font-black uppercase text-white"
                style={{
                  color: hot && index % 2 === 0 ? "#ffe600" : "#f2f2f2",
                  transform: `translateY(${Math.sin(frame * 0.18 + index) * pressure * 7}px)`,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="absolute left-0 right-0 top-0 h-[9%] bg-[#ff2638]"
        style={{
          opacity: 0.18 + pressure * 0.58,
          transform: `translateY(${hot ? Math.sin(frame * 0.5) * 8 : 0}px)`,
        }}
      />
      <div className="absolute bottom-[3%] left-[5%] right-[5%] h-[2%] overflow-hidden bg-white/10">
        <div className="h-full bg-[#0cf6ff]" style={{ width: `${Math.round(pressure * 100)}%` }} />
      </div>
    </div>
  );
}
