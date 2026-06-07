"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    mbp_triage_render_to_text?: () => string;
    mbp_triage_advance?: (steps: number) => void;
  }
}

type Receptor = {
  id: number;
  x: number;
  y: number;
  drift: number;
  stamped: number;
  lastCollisionTick: number;
};

type Model = {
  tick: number;
  collisions: number;
  potency: number;
  puckX: number;
  puckY: number;
  receptors: Array<Receptor>;
};

function createInitialModel(): Model {
  return {
    tick: 0,
    collisions: 0,
    potency: 1,
    puckX: 0.2,
    puckY: 0.5,
    receptors: [],
  };
}

export default function MbpTriage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<Model>(createInitialModel());
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [modelView, setModelView] = useState<Model>(createInitialModel());

  const initialReceptors = useMemo<Array<Receptor>>(
    () =>
      Array.from({ length: 9 }, (_, index) => ({
        id: index,
        x: 0.12 + ((index * 0.17) % 0.76),
        y: 0.18 + (index % 3) * 0.27,
        drift: (index % 2 === 0 ? 1 : -1) * (0.003 + (index % 4) * 0.0004),
        stamped: 0,
        lastCollisionTick: -1000,
      })),
    [],
  );

  const syncView = () => {
    const model = modelRef.current;
    setModelView({
      ...model,
      receptors: model.receptors.map((receptor) => ({ ...receptor })),
    });
  };

  useEffect(() => {
    modelRef.current.receptors = initialReceptors.map((receptor) => ({ ...receptor }));
    setModelView({
      ...modelRef.current,
      receptors: modelRef.current.receptors.map((receptor) => ({ ...receptor })),
    });
  }, [initialReceptors]);

  useEffect(() => {
    const step = () => {
      const model = modelRef.current;
      model.tick += 1;

      for (const receptor of model.receptors) {
        receptor.x += receptor.drift;
        if (receptor.x < 0.08 || receptor.x > 0.92) {
          receptor.drift *= -1;
          receptor.x = Math.max(0.08, Math.min(0.92, receptor.x));
        }

        receptor.y += Math.sin(model.tick * 0.08 + receptor.id) * 0.0008;
        receptor.y = Math.max(0.1, Math.min(0.9, receptor.y));
        receptor.stamped *= 0.92;

        const dx = receptor.x - model.puckX;
        const dy = receptor.y - model.puckY;
        const distance = Math.hypot(dx, dy);
        if (distance < 0.09 && model.tick - receptor.lastCollisionTick > 12) {
          receptor.lastCollisionTick = model.tick;
          receptor.stamped = 1;
          model.collisions += 1;
          model.potency = Math.min(1_000_000_000, model.potency * 10);
        }
      }

      syncView();
    };

    const loop = () => {
      step();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onPointerUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  useEffect(() => {
    window.mbp_triage_render_to_text = () => {
      const { tick, collisions, potency, puckX, puckY } = modelRef.current;
      return `mbp-triage|tick:${tick}|collisions:${collisions}|potency:${potency}|puck:${puckX.toFixed(2)},${puckY.toFixed(2)}`;
    };
    window.mbp_triage_advance = (steps: number) => {
      const safeSteps = Math.max(0, Math.floor(steps));
      for (let i = 0; i < safeSteps; i += 1) {
        const model = modelRef.current;
        model.tick += 1;
        for (const receptor of model.receptors) {
          receptor.x += receptor.drift;
          if (receptor.x < 0.08 || receptor.x > 0.92) {
            receptor.drift *= -1;
            receptor.x = Math.max(0.08, Math.min(0.92, receptor.x));
          }
        }
      }
      syncView();
    };
    return () => {
      delete window.mbp_triage_render_to_text;
      delete window.mbp_triage_advance;
    };
  }, []);

  const updatePuck = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    modelRef.current.puckX = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
    modelRef.current.puckY = Math.max(0.05, Math.min(0.95, (clientY - rect.top) / rect.height));
    setModelView((current) => ({
      ...current,
      puckX: modelRef.current.puckX,
      puckY: modelRef.current.puckY,
    }));
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "62% 38%",
        background:
          "linear-gradient(125deg, #8d95a4 0%, #69738d 46%, #3f4964 47%, #1f2a44 100%)",
        color: "#ecf1ff",
        fontFamily: "var(--font-geist-mono), monospace",
        userSelect: "none",
      }}
    >
      <div
        ref={stageRef}
        style={{ position: "relative", borderRight: "2px solid rgba(219, 231, 255, 0.45)" }}
        onPointerDown={(event) => {
          draggingRef.current = true;
          updatePuck(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) {
            updatePuck(event.clientX, event.clientY);
          }
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${modelView.puckX * 100}%`,
            top: `${modelView.puckY * 100}%`,
            width: "12%",
            aspectRatio: "1 / 1",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: "#ffb42d",
            border: "2px solid #341f00",
            boxShadow: "0 0 0 3px rgba(255, 226, 162, 0.35)",
          }}
        />
        {modelView.receptors.map((receptor) => (
          <div
            key={receptor.id}
            style={{
              position: "absolute",
              left: `${receptor.x * 100}%`,
              top: `${receptor.y * 100}%`,
              width: "11%",
              aspectRatio: "1 / 1",
              borderRadius: "10%",
              transform: `translate(-50%, -50%) scale(${1 + receptor.stamped * 0.38})`,
              background: receptor.stamped > 0.2 ? "#ff475f" : "#d8e2ff",
              color: receptor.stamped > 0.2 ? "#fff8f9" : "#2a3451",
              display: "grid",
              placeItems: "center",
              fontSize: "clamp(8px, 1.5vw, 12px)",
              border: "1px solid rgba(33, 45, 74, 0.75)",
            }}
          >
            R{receptor.id + 1}
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: "5%",
            bottom: "4%",
            fontSize: "clamp(9px, 1.4vw, 13px)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          collide marker with moving receptors
        </div>
      </div>

      <div style={{ padding: "6% 7%", display: "flex", flexDirection: "column", gap: "2.5%" }}>
        <div style={{ fontSize: "clamp(9px, 1.3vw, 12px)", textTransform: "uppercase", opacity: 0.9 }}>
          triage operating sheet
        </div>
        <div style={{ border: "1px solid rgba(216, 226, 255, 0.5)", padding: "6%", background: "rgba(0, 0, 0, 0.2)" }}>
          <div style={{ fontSize: "clamp(15px, 3.2vw, 26px)", lineHeight: 1.1 }}>
            potency × {modelView.potency.toLocaleString()}
          </div>
          <div style={{ marginTop: "5%", fontSize: "clamp(9px, 1.5vw, 13px)" }}>
            stamped collisions: {modelView.collisions}
          </div>
          <div style={{ marginTop: "4%", fontSize: "clamp(8px, 1.3vw, 11px)", opacity: 0.82 }}>
            reference: MBP noted up to thousandfold stronger than BPA
          </div>
        </div>
        <div style={{ flex: 1, border: "1px solid rgba(216, 226, 255, 0.5)", background: "rgba(11, 18, 33, 0.35)", padding: "6%", overflow: "hidden" }}>
          {modelView.receptors.slice(0, 6).map((receptor) => (
            <div
              key={`log-${receptor.id}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "clamp(8px, 1.2vw, 11px)",
                padding: "3% 0",
                borderBottom: "1px dashed rgba(216, 226, 255, 0.22)",
                color: receptor.stamped > 0.25 ? "#ffd4db" : "#d9e5ff",
              }}
            >
              <span>R-{receptor.id + 1}</span>
              <span>{receptor.stamped > 0.25 ? "STAMPED" : "watch"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
