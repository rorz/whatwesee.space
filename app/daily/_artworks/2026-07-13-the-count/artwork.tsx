"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    the_count_render_to_text?: () => string;
    the_count_advance?: (steps: number) => void;
  }
}

type Status = "counting" | "risen" | "out";

interface Impact {
  id: number;
  x: number;
  y: number;
}

const FORCE_PER_CLICK = 12;
const FORCE_MAX = 100;
const COUNT_MS = 1400;

export default function TheCount() {
  const [count, setCount] = useState(1);
  const [force, setForce] = useState(0);
  const [status, setStatus] = useState<Status>("counting");
  const [impacts, setImpacts] = useState<Impact[]>([]);

  const stateRef = useRef({ count: 1, force: 0, status: "counting" as Status });
  const impactIdRef = useRef(0);
  const pendingTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    stateRef.current.count = count;
  }, [count]);
  useEffect(() => {
    stateRef.current.force = force;
  }, [force]);
  useEffect(() => {
    stateRef.current.status = status;
  }, [status]);

  // Inject keyframes, cleaned up on unmount
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent =
      "@keyframes tc-drop{from{opacity:0;transform:translateX(-50%) translateY(-18%)}to{opacity:1;transform:translateX(-50%) translateY(0)}}" +
      "@keyframes tc-ring{0%{opacity:.55;transform:translate(-50%,-50%) scale(.25)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.6)}}";
    document.head.appendChild(el);
    return () => {
      document.head.removeChild(el);
    };
  }, []);

  // Count auto-advance
  useEffect(() => {
    if (status !== "counting") return;
    const id = setInterval(() => {
      setCount((prev) => {
        const next = prev + 1;
        if (next >= 10) {
          setStatus("out");
          return 10;
        }
        return next;
      });
    }, COUNT_MS);
    return () => clearInterval(id);
  }, [status]);

  // Clear all pending impact timeouts on unmount
  useEffect(() => {
    const ts = pendingTimeoutsRef.current;
    return () => {
      for (const t of ts) clearTimeout(t);
    };
  }, []);

  // Testability hooks
  useEffect(() => {
    window.the_count_render_to_text = () => {
      const s = stateRef.current;
      return `The Count | count:${s.count}/10 | force:${s.force}% | status:${s.status}`;
    };
    window.the_count_advance = (steps: number) => {
      const n = Math.max(1, Math.floor(steps));
      setCount((prev) => {
        const next = Math.min(10, prev + n);
        if (next >= 10) setStatus("out");
        return next;
      });
    };
    return () => {
      delete window.the_count_render_to_text;
      delete window.the_count_advance;
    };
  }, []);

  const reset = () => {
    setCount(1);
    setForce(0);
    setStatus("counting");
    setImpacts([]);
    stateRef.current = { count: 1, force: 0, status: "counting" };
  };

  const addForce = () => {
    setForce((prev) => {
      const next = Math.min(FORCE_MAX, prev + FORCE_PER_CLICK);
      if (next >= FORCE_MAX) setStatus("risen");
      return next;
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (status !== "counting") {
      reset();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = ++impactIdRef.current;
    setImpacts((prev) => [...prev, { id, x, y }]);
    const t = setTimeout(() => {
      setImpacts((prev) => prev.filter((imp) => imp.id !== id));
      pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((pt) => pt !== t);
    }, 750);
    pendingTimeoutsRef.current.push(t);

    addForce();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (status !== "counting") {
      reset();
    } else {
      addForce();
    }
  };

  const isRisen = status === "risen";
  const isOut = status === "out";

  const fighterWidth = isRisen ? "8%" : isOut ? "34%" : "28%";
  const fighterHeight = isRisen ? "13%" : isOut ? "5.5%" : "4.5%";
  const fighterBottom = isRisen ? "30%" : "12%";
  const forcePercent = (force / FORCE_MAX) * 100;
  const forceColor = force >= 80 ? "#1848a8" : "#4868a8";

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: "#c8d8e8", cursor: status === "counting" ? "crosshair" : "pointer", touchAction: "manipulation" }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={
        status === "counting"
          ? `Referee count: ${count} of 10. Click to push against the canvas.`
          : status === "risen"
            ? "Fighter rose. Click to reset."
            : "Knocked out. Click to reset."
      }
    >
      {/* Arena ceiling — dark gradient overhead */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, #081428 0%, #1a3060 16%, #3050a0 24%, #c8d8e8 38%)",
          pointerEvents: "none",
        }}
      />

      {/* Blue corner post (left) */}
      <div
        style={{
          position: "absolute",
          left: "2%",
          top: "18%",
          width: "3.5%",
          height: "22%",
          background: "#1848a8",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Red corner post (right) */}
      <div
        style={{
          position: "absolute",
          right: "2%",
          top: "18%",
          width: "3.5%",
          height: "22%",
          background: "#a82018",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Rope 1 — top */}
      <div
        style={{
          position: "absolute",
          left: "4%",
          right: "4%",
          top: "20%",
          height: "2.5%",
          background: "#4868c0",
          borderRadius: "2px",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />
      {/* Rope 2 — middle */}
      <div
        style={{
          position: "absolute",
          left: "4%",
          right: "4%",
          top: "28%",
          height: "2%",
          background: "#5878c8",
          borderRadius: "2px",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />
      {/* Rope 3 — lower */}
      <div
        style={{
          position: "absolute",
          left: "4%",
          right: "4%",
          top: "36%",
          height: "1.5%",
          background: "#6888d0",
          borderRadius: "2px",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* Canvas apron — floor edge */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "14%",
          background: "#b0c2d8",
          borderTop: "2px solid #8898c0",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Fighter silhouette */}
      <div
        style={{
          position: "absolute",
          bottom: fighterBottom,
          left: "50%",
          width: fighterWidth,
          height: fighterHeight,
          background: "#2a3848",
          borderRadius: "50%",
          transform: "translateX(-50%)",
          opacity: isOut ? 0.95 : 0.6,
          transition: "width 0.7s ease-out, height 0.7s ease-out, bottom 0.8s ease-out, opacity 0.3s",
          zIndex: 4,
          pointerEvents: "none",
        }}
      />

      {/* Count numeral */}
      {status === "counting" && (
        <div
          key={count}
          style={{
            position: "absolute",
            top: "38%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "clamp(56px, 26vmin, 160px)",
            fontWeight: 800,
            color: "#0a1820",
            lineHeight: 1,
            letterSpacing: "-0.05em",
            fontVariantNumeric: "tabular-nums",
            animation: "tc-drop 0.2s ease-out",
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          {count}
        </div>
      )}

      {/* OUT state */}
      {isOut && (
        <div
          style={{
            position: "absolute",
            top: "38%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "clamp(40px, 20vmin, 124px)",
            fontWeight: 900,
            color: "#0a1820",
            letterSpacing: "0.1em",
            zIndex: 6,
            pointerEvents: "none",
          }}
        >
          OUT
        </div>
      )}

      {/* RISEN state */}
      {isRisen && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "clamp(16px, 8vmin, 50px)",
            fontWeight: 700,
            color: "#1848a8",
            letterSpacing: "0.14em",
            whiteSpace: "nowrap",
            zIndex: 6,
            pointerEvents: "none",
          }}
        >
          STANDING
        </div>
      )}

      {/* Force meter — right side */}
      <div
        style={{
          position: "absolute",
          right: "7%",
          top: "38%",
          width: "2.5%",
          height: "32%",
          background: "#90a8c0",
          zIndex: 5,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${forcePercent}%`,
            background: forceColor,
            transition: "height 0.15s ease-out, background-color 0.3s",
          }}
        />
      </div>

      {/* Impact ripple effects */}
      {impacts.map((impact) => (
        <div
          key={impact.id}
          style={{
            position: "absolute",
            left: `${impact.x}%`,
            top: `${impact.y}%`,
            width: "clamp(18px, 8vmin, 52px)",
            height: "clamp(18px, 8vmin, 52px)",
            border: "1.5px solid #2a3848",
            borderRadius: "50%",
            animation: "tc-ring 0.75s ease-out forwards",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Status strip */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "9%",
          background: "#0a1820",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 8,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            color: "#6888a8",
            fontSize: "clamp(6px, 1.6vmin, 10px)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "var(--font-geist-mono, monospace)",
          }}
        >
          {status === "counting"
            ? `${count} · click to rise`
            : status === "risen"
              ? "standing · click to reset"
              : "ten · click to reset"}
        </span>
      </div>
    </div>
  );
}
