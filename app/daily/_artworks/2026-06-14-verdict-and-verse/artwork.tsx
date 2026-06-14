"use client";

import { useEffect, useRef, useReducer, useCallback } from "react";

declare global {
  interface Window {
    verdict_and_verse_render_to_text?: () => string;
    verdict_and_verse_advance?: (steps: number) => void;
  }
}

const SOURCE_WORDS = ["every", "ruling", "is", "already", "a", "kind", "of", "lament"] as const;

type Side = "verdict" | "verse";

type State = {
  queue: string[];
  verdict: string[];
  verse: string[];
};

type Action = { type: "sort"; side: Side } | { type: "reset" };

function init(): State {
  return { queue: [...SOURCE_WORDS], verdict: [], verse: [] };
}

function reducer(state: State, action: Action): State {
  if (action.type === "reset") return init();
  if (action.type === "sort") {
    const [word, ...rest] = state.queue;
    if (!word) return state;
    return {
      queue: rest,
      verdict: action.side === "verdict" ? [...state.verdict, word] : state.verdict,
      verse: action.side === "verse" ? [...state.verse, word] : state.verse,
    };
  }
  return state;
}

export default function VerdictAndVerse() {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const sortVerdict = useCallback(() => dispatch({ type: "sort", side: "verdict" }), []);
  const sortVerse = useCallback(() => dispatch({ type: "sort", side: "verse" }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") dispatch({ type: "sort", side: "verdict" });
      if (e.key === "ArrowRight") dispatch({ type: "sort", side: "verse" });
    };
    window.addEventListener("keydown", handleKey);

    window.verdict_and_verse_render_to_text = () => {
      const s = stateRef.current;
      return `verdict-and-verse | verdict:${s.verdict.length} verse:${s.verse.length} queue:${s.queue.length}`;
    };
    window.verdict_and_verse_advance = (steps: number) => {
      const n = Math.max(0, Math.floor(steps));
      for (let i = 0; i < n; i += 1) {
        dispatch({ type: "sort", side: i % 2 === 0 ? "verdict" : "verse" });
      }
    };

    return () => {
      window.removeEventListener("keydown", handleKey);
      delete window.verdict_and_verse_render_to_text;
      delete window.verdict_and_verse_advance;
    };
  }, []);

  const done = state.queue.length === 0;
  const current = state.queue[0];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-geist-mono), monospace",
        display: "flex",
      }}
      aria-label="Verdict and Verse — sort each word left into the verdict or right into the verse"
    >
      <button
        type="button"
        style={{
          flex: "1 1 50%",
          background: "#171615",
          border: "none",
          cursor: current ? "w-resize" : "default",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "clamp(12px, 6%, 40px) clamp(12px, 6%, 40px) 0",
          gap: "clamp(2px, 0.8vw, 8px)",
          overflow: "hidden",
          pointerEvents: current ? "auto" : "none",
        }}
        onClick={sortVerdict}
        aria-label="File into verdict"
      >
        <span
          style={{
            color: "#3a3837",
            fontSize: "clamp(9px, 1.6vw, 12px)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: "clamp(6px, 4%, 20px)",
            userSelect: "none",
          }}
        >
          verdict
        </span>
        {state.verdict.map((word, i) => (
          <span
            key={`v-${i}`}
            style={{
              color: "#d0ccc8",
              fontSize: "clamp(18px, 4vw, 32px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              lineHeight: 1.05,
              userSelect: "none",
            }}
          >
            {word}
          </span>
        ))}
      </button>

      <div style={{ width: "1px", background: "#2e2e2e", flexShrink: 0 }} />

      <button
        type="button"
        style={{
          flex: "1 1 50%",
          background: "#f2eee7",
          border: "none",
          cursor: current ? "e-resize" : "default",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "clamp(12px, 6%, 40px) clamp(12px, 6%, 40px) 0",
          gap: "clamp(2px, 0.8vw, 8px)",
          overflow: "hidden",
          pointerEvents: current ? "auto" : "none",
        }}
        onClick={sortVerse}
        aria-label="File into verse"
      >
        <span
          style={{
            color: "#b8b0a4",
            fontSize: "clamp(9px, 1.6vw, 12px)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: "clamp(6px, 4%, 20px)",
            userSelect: "none",
          }}
        >
          verse
        </span>
        {state.verse.map((word, i) => (
          <span
            key={`r-${i}`}
            style={{
              color: "#3a3028",
              fontSize: "clamp(18px, 4vw, 32px)",
              fontStyle: "italic",
              fontWeight: 300,
              letterSpacing: "0.08em",
              lineHeight: 1.05,
              userSelect: "none",
            }}
          >
            {word}
          </span>
        ))}
      </button>

      {current && (
        <div
          style={{
            position: "absolute",
            bottom: "clamp(16px, 9%, 56px)",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "clamp(6px, 1.8vw, 14px)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: "#555", fontSize: "clamp(11px, 1.8vw, 15px)", userSelect: "none" }}>←</span>
          <span
            style={{
              background: "#5c6068",
              color: "#edeae5",
              fontSize: "clamp(14px, 3vw, 24px)",
              letterSpacing: "0.05em",
              padding: "clamp(4px, 1vw, 9px) clamp(10px, 2.5vw, 22px)",
              userSelect: "none",
            }}
          >
            {current}
          </span>
          <span style={{ color: "#aaa", fontSize: "clamp(11px, 1.8vw, 15px)", userSelect: "none" }}>→</span>
        </div>
      )}

      {done && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(12, 11, 11, 0.62)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(10px, 3vw, 24px)",
          }}
        >
          <span
            style={{
              color: "#c0b8b0",
              fontSize: "clamp(10px, 1.8vw, 14px)",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              userSelect: "none",
            }}
          >
            filed
          </span>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "transparent",
              border: "1px solid #666",
              color: "#999",
              fontSize: "clamp(10px, 1.6vw, 13px)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "clamp(5px, 1.2vw, 10px) clamp(14px, 3.5vw, 28px)",
              cursor: "pointer",
              fontFamily: "var(--font-geist-mono), monospace",
            }}
          >
            again
          </button>
        </div>
      )}
    </div>
  );
}
