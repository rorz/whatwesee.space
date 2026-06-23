"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    before_nine_render_to_text?: () => string;
    before_nine_advance?: (steps: number) => void;
  }
}

const PROPS = [
  {
    id: "window" as const,
    label: "window",
    note: "She does not open it.",
    top: 6,
    left: 31,
    width: 22,
    height: 11,
  },
  {
    id: "clock" as const,
    label: "clock",
    note: "Seven forty-five. Plenty of time.",
    top: 7,
    left: 72,
    width: 10,
    height: 9,
  },
  {
    id: "phone" as const,
    label: "wall phone",
    note: "She has decided who not to call.",
    top: 26,
    left: 9,
    width: 10,
    height: 8,
  },
  {
    id: "candy-dish" as const,
    label: "candy dish",
    note: "She fills it. Not for herself — for after.",
    top: 34,
    left: 44,
    width: 14,
    height: 6,
  },
  {
    id: "sofa" as const,
    label: "sofa",
    note: "They have sat here before. Not like this.",
    top: 46,
    left: 26,
    width: 36,
    height: 14,
  },
  {
    id: "coffee-maker" as const,
    label: "coffee maker",
    note: "Set for morning. Mama will find it.",
    top: 34,
    left: 73,
    width: 15,
    height: 7,
  },
  {
    id: "stove" as const,
    label: "stove",
    note: "All burners off. She checked twice.",
    top: 46,
    left: 71,
    width: 19,
    height: 14,
  },
  {
    id: "door" as const,
    label: "bedroom door",
    note: "At eight-thirty she says good night and means it.",
    top: 43,
    left: 5,
    width: 9,
    height: 22,
  },
] as const;

type PropId = (typeof PROPS)[number]["id"];
type ObjStatus = "idle" | "held" | "memorized";

const HOLD_NOTE_MS = 550;
const HOLD_COMMIT_MS = 1900;

const IDLE_BG = "#c8c0b6";
const IDLE_BORDER = "#a09890";
const HELD_BG = "#dbd4ca";
const HELD_BORDER = "#908880";
const MEM_BG = "#c8b898";
const MEM_BORDER = "#a08860";
const IDLE_TEXT = "#4a4440";
const MEM_TEXT = "#5a3e28";

function makeInitialStates(): Record<PropId, ObjStatus> {
  return Object.fromEntries(PROPS.map((p) => [p.id, "idle"])) as Record<PropId, ObjStatus>;
}

export default function BeforeNine() {
  const [statuses, setStatuses] = useState<Record<PropId, ObjStatus>>(makeInitialStates);
  const [activeId, setActiveId] = useState<PropId | null>(null);
  const [noteShown, setNoteShown] = useState(false);

  const statusesRef = useRef(statuses);
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    statusesRef.current = statuses;
  }, [statuses]);

  const clearTimers = useCallback(() => {
    if (noteTimerRef.current !== null) {
      clearTimeout(noteTimerRef.current);
      noteTimerRef.current = null;
    }
    if (commitTimerRef.current !== null) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
  }, []);

  const handleHoldStart = useCallback(
    (id: PropId) => {
      clearTimers();
      setActiveId(id);
      setNoteShown(false);
      noteTimerRef.current = setTimeout(() => {
        setNoteShown(true);
        commitTimerRef.current = setTimeout(() => {
          setStatuses((prev) => {
            const next = { ...prev, [id]: "memorized" as ObjStatus };
            statusesRef.current = next;
            return next;
          });
        }, HOLD_COMMIT_MS - HOLD_NOTE_MS);
      }, HOLD_NOTE_MS);
    },
    [clearTimers],
  );

  const handleHoldEnd = useCallback(() => {
    clearTimers();
    setActiveId(null);
    setNoteShown(false);
  }, [clearTimers]);

  useEffect(() => {
    window.before_nine_render_to_text = () => {
      const count = Object.values(statusesRef.current).filter((s) => s === "memorized").length;
      return `memorized=${count}/${PROPS.length}`;
    };

    window.before_nine_advance = (steps: number) => {
      const n = Math.max(0, Math.min(Math.floor(Number.isFinite(steps) ? steps : 0), PROPS.length));
      setStatuses((prev) => {
        const next = { ...prev };
        let count = 0;
        for (const p of PROPS) {
          if (count >= n) break;
          if (next[p.id] !== "memorized") {
            next[p.id] = "memorized";
            count++;
          }
        }
        statusesRef.current = next as Record<PropId, ObjStatus>;
        return next as Record<PropId, ObjStatus>;
      });
    };

    return () => {
      delete window.before_nine_render_to_text;
      delete window.before_nine_advance;
    };
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const memorizedCount = Object.values(statuses).filter((s) => s === "memorized").length;
  const activeProp = PROPS.find((p) => p.id === activeId) ?? null;

  return (
    <div
      className="relative w-full h-full select-none"
      style={{ background: "#ede8e2", touchAction: "none" }}
      onPointerUp={handleHoldEnd}
      onPointerCancel={handleHoldEnd}
      onPointerLeave={handleHoldEnd}
    >
      {/* Back wall */}
      <div
        className="absolute inset-x-0"
        style={{ top: 0, height: "40%", background: "#f4f0eb", borderBottom: "1.5px solid #c0b8b0" }}
      />

      {/* Objects */}
      {PROPS.map((prop) => {
        const status = statuses[prop.id];
        const isActive = activeId === prop.id;
        const isMemorized = status === "memorized";

        const bg = isMemorized ? MEM_BG : isActive ? HELD_BG : IDLE_BG;
        const border = isMemorized ? MEM_BORDER : isActive ? HELD_BORDER : IDLE_BORDER;
        const textColor = isMemorized ? MEM_TEXT : IDLE_TEXT;

        return (
          <div
            key={prop.id}
            style={{
              position: "absolute",
              left: `${prop.left}%`,
              top: `${prop.top}%`,
              width: `${prop.width}%`,
              height: `${prop.height}%`,
              background: bg,
              border: `1.5px solid ${border}`,
              cursor: "pointer",
              transition: "background 0.25s, border-color 0.25s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleHoldStart(prop.id);
            }}
          >
            <span
              style={{
                fontSize: "clamp(6px, 1.5vmin, 9px)",
                color: textColor,
                letterSpacing: "0.04em",
                pointerEvents: "none",
                textAlign: "center",
                lineHeight: 1.2,
                padding: "0 2px",
              }}
            >
              {prop.label}
            </span>
          </div>
        );
      })}

      {/* Info panel */}
      <div
        className="absolute inset-x-0"
        style={{
          bottom: 0,
          height: "18%",
          background: "#f4f0eb",
          borderTop: "1.5px solid #c0b8b0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 5%",
          gap: "2px",
        }}
      >
        {activeId && noteShown && activeProp ? (
          <>
            <span
              style={{ fontSize: "clamp(7px, 1.4vmin, 9px)", color: "#8a8078", letterSpacing: "0.06em" }}
            >
              {activeProp.label}
            </span>
            <span
              style={{
                fontSize: "clamp(7px, 1.5vmin, 10px)",
                color: "#5a4e46",
                fontStyle: "italic",
                lineHeight: 1.3,
              }}
            >
              {activeProp.note}
            </span>
          </>
        ) : (
          <span
            style={{ fontSize: "clamp(7px, 1.4vmin, 9px)", color: "#8a8078", letterSpacing: "0.06em" }}
          >
            {memorizedCount === 0
              ? "hold each object"
              : memorizedCount === PROPS.length
                ? "the room remembers"
                : `${memorizedCount} of ${PROPS.length} held`}
          </span>
        )}
      </div>
    </div>
  );
}
