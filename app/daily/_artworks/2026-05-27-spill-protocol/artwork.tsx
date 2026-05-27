"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    spill_protocol_render_to_text?: () => string;
    spill_protocol_advance?: (steps: number) => void;
  }
}

type Category = "PLANT" | "ANIMAL" | "FUNGUS" | "UNKNOWN";

type Specimen = {
  name: string;
  category: Category;
  hint: string;
  color: string;
  glow: string;
  shape: string; // border-radius CSS value for the blob
};

const SPECIMENS: Specimen[] = [
  {
    name: "Globular Mucosa Primus",
    category: "FUNGUS",
    hint: "Damp. Possibly self-aware.",
    color: "#7fff4f",
    glow: "#3fdf00",
    shape: "62% 38% 54% 46% / 45% 55% 45% 55%",
  },
  {
    name: "Bilateral Sprocket Moth",
    category: "ANIMAL",
    hint: "Vibrates at 40 Hz when observed.",
    color: "#ff8c3f",
    glow: "#cc5000",
    shape: "40% 60% 70% 30% / 60% 30% 70% 40%",
  },
  {
    name: "Pendant Chloroplast Vine",
    category: "PLANT",
    hint: "Absorbs light. Also attention.",
    color: "#20ffb0",
    glow: "#00bf80",
    shape: "50% 50% 30% 70% / 50% 70% 30% 50%",
  },
  {
    name: "Ambulatory Bracket Node",
    category: "FUNGUS",
    hint: "Moves when the lights are off.",
    color: "#dfff30",
    glow: "#9fbf00",
    shape: "73% 27% 44% 56% / 37% 63% 37% 63%",
  },
  {
    name: "Crimson Axial Crawler",
    category: "ANIMAL",
    hint: "Has made formal complaints before.",
    color: "#ff3060",
    glow: "#cc0030",
    shape: "33% 67% 55% 45% / 55% 45% 55% 45%",
  },
  {
    name: "Celadon Lung Frond",
    category: "PLANT",
    hint: "Exhales twice as much as it inhales.",
    color: "#40ffcf",
    glow: "#00bfa5",
    shape: "58% 42% 66% 34% / 42% 58% 42% 58%",
  },
  {
    name: "Asymmetric Spore Vessel",
    category: "FUNGUS",
    hint: "Smells like accounting.",
    color: "#cfff20",
    glow: "#8fbf00",
    shape: "45% 55% 38% 62% / 62% 38% 62% 38%",
  },
  {
    name: "Vestigial Claw Cluster",
    category: "ANIMAL",
    hint: "Legally furniture in two countries.",
    color: "#ff50a0",
    glow: "#cc0060",
    shape: "67% 33% 50% 50% / 50% 50% 67% 33%",
  },
  {
    name: "Photosynthetic Spike Column",
    category: "PLANT",
    hint: "Prefers overhead lighting exclusively.",
    color: "#40ff60",
    glow: "#00cc30",
    shape: "30% 70% 60% 40% / 70% 30% 70% 30%",
  },
  {
    name: "Translucent Cyst Tendril",
    category: "UNKNOWN",
    hint: "Do not touch. Do not ask.",
    color: "#c0b0ff",
    glow: "#8060e0",
    shape: "55% 45% 55% 45% / 45% 55% 45% 55%",
  },
];

const CATEGORIES: Category[] = ["PLANT", "ANIMAL", "FUNGUS", "UNKNOWN"];

const CATEGORY_KEYS: Record<Category, string> = {
  PLANT: "P",
  ANIMAL: "A",
  FUNGUS: "F",
  UNKNOWN: "X",
};

type Phase = "awaiting" | "correct" | "wrong" | "ejecting" | "done";

const WRONG_MESSAGES = [
  "MISCLASSIFICATION LOGGED. THIS WILL FOLLOW YOU.",
  "INCORRECT. THE SPECIMEN IS DISAPPOINTED.",
  "CLASSIFICATION REJECTED. SPILL ADDED TO YOUR RECORD.",
  "WRONG. THE MACHINE HAS NOTED THIS DOWN.",
  "ERROR. THAT WAS VISIBLY THE WRONG BUTTON.",
];

const CORRECT_MESSAGES = [
  "CLASSIFICATION ACCEPTED.",
  "CORRECT. PROCESSING NEXT SPECIMEN.",
  "CONFIRMED. EXCELLENT PROTOCOL ADHERENCE.",
  "MATCH VERIFIED. THE SPECIMEN ACCEPTS ITS FATE.",
  "CLASSIFICATION VALID. PROCEED.",
];

export default function SpillProtocol() {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [spills, setSpills] = useState(0);
  const [phase, setPhase] = useState<Phase>("awaiting");
  const [message, setMessage] = useState("SPECIMEN READY FOR CLASSIFICATION");
  const [blobAnim, setBlobAnim] = useState<"pulse" | "shake" | "fly" | "eject">("pulse");
  const msgIdxRef = useRef(0);

  const scoreRef = useRef(score);
  const spillsRef = useRef(spills);
  const idxRef = useRef(idx);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    spillsRef.current = spills;
  }, [spills]);
  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  const specimen = SPECIMENS[idx] ?? SPECIMENS[SPECIMENS.length - 1];
  const isLast = idx >= SPECIMENS.length - 1;
  const totalSorted = idx + (phase === "correct" || phase === "done" ? 1 : 0);

  const handleSort = useCallback(
    (choice: Category) => {
      if (phase !== "awaiting") return;

      const correct = choice === specimen.category;

      if (correct) {
        setBlobAnim("fly");
        setScore((s) => s + 10);
        setPhase("correct");
        const msg = CORRECT_MESSAGES[msgIdxRef.current % CORRECT_MESSAGES.length];
        msgIdxRef.current++;
        setMessage(`${msg} ${specimen.name} → ${choice}.`);
        setTimeout(() => {
          if (isLast) {
            setPhase("done");
            setMessage("PROTOCOL COMPLETE. ALL SPECIMENS PROCESSED. WELL DONE. MOSTLY.");
          } else {
            setIdx((i) => i + 1);
            setPhase("awaiting");
            setBlobAnim("pulse");
            setMessage("NEXT SPECIMEN READY FOR CLASSIFICATION");
          }
        }, 1100);
      } else {
        setBlobAnim("shake");
        setSpills((s) => s + 1);
        setPhase("wrong");
        const msg = WRONG_MESSAGES[msgIdxRef.current % WRONG_MESSAGES.length];
        msgIdxRef.current++;
        setMessage(`⚠ ${msg}`);
        setTimeout(() => {
          setBlobAnim("pulse");
          setPhase("awaiting");
          setMessage("RE-ATTEMPT. THE SPECIMEN REMAINS.");
        }, 1600);
      }
    },
    [phase, specimen, isLast],
  );

  const handleEject = useCallback(() => {
    if (phase === "ejecting" || phase === "done") return;
    setBlobAnim("eject");
    setSpills((s) => s + 3);
    setPhase("ejecting");
    setMessage("⚠⚠ EMERGENCY EJECT INITIATED. THREE SPILLS LOGGED AUTOMATICALLY. ⚠⚠");
    setTimeout(() => {
      setPhase("done");
      setMessage("UNIT TERMINATED. SPILL COUNT IS NOW PART OF YOUR PERMANENT RECORD.");
    }, 2200);
  }, [phase]);

  useEffect(() => {
    window.spill_protocol_render_to_text = () =>
      `specimen=${idxRef.current + 1}/${SPECIMENS.length} score=${scoreRef.current} spills=${spillsRef.current}`;
    window.spill_protocol_advance = (steps: number) => {
      setIdx((i) => Math.min(SPECIMENS.length - 1, i + steps));
      setPhase("awaiting");
      setBlobAnim("pulse");
      setMessage("SPECIMEN READY FOR CLASSIFICATION");
    };
    return () => {
      delete window.spill_protocol_render_to_text;
      delete window.spill_protocol_advance;
    };
  }, []);

  const isInteractive = phase === "awaiting";
  const progressPct = Math.round((totalSorted / SPECIMENS.length) * 100);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#060e1c",
        color: "#00e87a",
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "0",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes sp-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.04); filter: brightness(1.15); }
        }
        @keyframes sp-shake {
          0% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-8px) rotate(-3deg); }
          25% { transform: translateX(12px) rotate(4deg); }
          40% { transform: translateX(-10px) rotate(-4deg); }
          55% { transform: translateX(8px) rotate(3deg); }
          70% { transform: translateX(-6px) rotate(-2deg); }
          85% { transform: translateX(4px) rotate(1deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        @keyframes sp-fly {
          0% { transform: scale(1) translateY(0); opacity: 1; }
          60% { transform: scale(0.6) translateY(-18%) rotate(8deg); opacity: 0.8; }
          100% { transform: scale(0.1) translateY(-60%) rotate(20deg); opacity: 0; }
        }
        @keyframes sp-eject {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          30% { transform: scale(1.3) rotate(-8deg); opacity: 1; }
          70% { transform: scale(0.4) translateY(60%) rotate(25deg); opacity: 0.5; }
          100% { transform: scale(0) translateY(120%) rotate(45deg); opacity: 0; }
        }
        @keyframes sp-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes sp-scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "4% 5% 2%",
          borderBottom: "1px solid #003d20",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "clamp(7px, 1.6vw, 13px)", letterSpacing: "0.12em", fontWeight: "bold" }}>
          BIOME SORT PROTOCOL
        </span>
        <span style={{ fontSize: "clamp(6px, 1.2vw, 10px)", color: "#004d28", letterSpacing: "0.08em" }}>
          UNIT 7-C / REV 4
        </span>
      </div>

      {/* Specimen counter */}
      <div
        style={{
          padding: "1.5% 5% 0%",
          fontSize: "clamp(6px, 1.1vw, 9px)",
          color: "#005f32",
          letterSpacing: "0.1em",
          flexShrink: 0,
        }}
      >
        SPECIMEN {Math.min(idx + 1, SPECIMENS.length)} / {SPECIMENS.length} &nbsp;·&nbsp; QUEUE ACTIVE
      </div>

      {/* Organism display */}
      <div
        style={{
          flex: "1 1 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2% 4%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {phase !== "done" ? (
          <>
            {/* Blob */}
            <div
              style={{
                width: "clamp(80px, 38%, 200px)",
                aspectRatio: "1",
                borderRadius: specimen.shape,
                background: `radial-gradient(circle at 38% 36%, ${specimen.color}cc, ${specimen.glow} 70%, #020810 100%)`,
                boxShadow: `0 0 clamp(8px, 3vw, 28px) ${specimen.glow}99, inset 0 0 clamp(4px, 1.5vw, 14px) ${specimen.color}40`,
                animation:
                  blobAnim === "pulse"
                    ? "sp-pulse 2.4s ease-in-out infinite"
                    : blobAnim === "shake"
                      ? "sp-shake 0.6s ease-in-out"
                      : blobAnim === "fly"
                        ? "sp-fly 1.0s ease-in forwards"
                        : "sp-eject 2.0s ease-in forwards",
                flexShrink: 0,
                position: "relative",
              }}
            />

            {/* Specimen name */}
            <div
              style={{
                marginTop: "3%",
                textAlign: "center",
                maxWidth: "90%",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(8px, 1.8vw, 14px)",
                  letterSpacing: "0.08em",
                  color: specimen.color,
                  fontWeight: "bold",
                  lineHeight: 1.3,
                }}
              >
                {specimen.name}
              </div>
              <div
                style={{
                  marginTop: "2%",
                  fontSize: "clamp(6px, 1.2vw, 10px)",
                  color: "#006640",
                  fontStyle: "italic",
                  letterSpacing: "0.06em",
                }}
              >
                {specimen.hint}
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "0 8%",
            }}
          >
            <div
              style={{
                fontSize: "clamp(10px, 2.4vw, 18px)",
                fontWeight: "bold",
                letterSpacing: "0.1em",
                lineHeight: 1.5,
                color: spills > 3 ? "#ff3060" : "#00e87a",
              }}
            >
              {spills > 3 ? "PROTOCOL FAILED" : "PROTOCOL COMPLETE"}
            </div>
            <div
              style={{
                marginTop: "4%",
                fontSize: "clamp(7px, 1.4vw, 11px)",
                color: "#005f32",
                letterSpacing: "0.06em",
              }}
            >
              FINAL SCORE: {score} &nbsp;|&nbsp; SPILLS: {spills}
            </div>
          </div>
        )}
      </div>

      {/* Status message */}
      <div
        style={{
          padding: "1% 5%",
          fontSize: "clamp(6px, 1.2vw, 10px)",
          letterSpacing: "0.06em",
          minHeight: "3em",
          display: "flex",
          alignItems: "center",
          color: phase === "wrong" || phase === "ejecting" ? "#ff5060" : phase === "correct" ? "#40ff80" : "#007840",
          borderTop: "1px solid #002810",
          flexShrink: 0,
          animation: phase === "wrong" ? "sp-blink 0.4s ease-in-out 3" : "none",
        }}
      >
        {message}
      </div>

      {/* Sort buttons — no-even-spacing: deliberate irregular gaps */}
      <div
        style={{
          padding: "2% 5% 1%",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: "clamp(5px, 1vw, 8px)",
            letterSpacing: "0.12em",
            color: "#004d28",
            marginBottom: "1.5%",
          }}
        >
          CLASSIFY AS:
        </div>
        <div
          style={{
            display: "flex",
            gap: "0",
            alignItems: "flex-end",
          }}
        >
          {CATEGORIES.map((cat, i) => {
            // no-even-spacing: deliberate varied gaps between sort buttons
            const gaps = ["0", "clamp(2px, 1.2%, 8px)", "clamp(6px, 2.8%, 18px)", "clamp(3px, 1.6%, 10px)"];
            return (
              <button
                key={cat}
                onClick={() => handleSort(cat)}
                disabled={!isInteractive}
                style={{
                  marginLeft: i === 0 ? "0" : gaps[i],
                  padding: "clamp(4px, 1.2%, 8px) clamp(6px, 2%, 14px)",
                  background: isInteractive ? "#030e1e" : "#010608",
                  border: `1px solid ${isInteractive ? "#006640" : "#002010"}`,
                  color: isInteractive ? "#00e87a" : "#003020",
                  fontFamily: "monospace",
                  fontSize: "clamp(7px, 1.5vw, 12px)",
                  letterSpacing: "0.1em",
                  cursor: isInteractive ? "pointer" : "default",
                  transition: "background 0.1s, border-color 0.1s",
                  outline: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (isInteractive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "#001a0c";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#00e87a";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = isInteractive ? "#030e1e" : "#010608";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = isInteractive ? "#006640" : "#002010";
                }}
              >
                [{CATEGORY_KEYS[cat]}] {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Score + spill progress bar */}
      <div
        style={{
          padding: "1% 5% 1.5%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "4%",
        }}
      >
        <div
          style={{
            fontSize: "clamp(6px, 1.1vw, 9px)",
            color: "#005f32",
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          SCORE: {score}
        </div>
        <div
          style={{
            flex: 1,
            height: "clamp(3px, 0.6vw, 5px)",
            background: "#001a0c",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${progressPct}%`,
              background: "#00e87a",
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <div
          style={{
            fontSize: "clamp(6px, 1.1vw, 9px)",
            color: spills > 0 ? "#ff5060" : "#005f32",
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          SPILLS: {spills}
        </div>
      </div>

      {/* Emergency eject button — button-with-consequences, oversized */}
      <div
        style={{
          padding: "1% 5% 4%",
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleEject}
          disabled={phase === "ejecting" || phase === "done"}
          style={{
            width: "100%",
            padding: "clamp(6px, 2%, 14px)",
            background: phase === "ejecting" ? "#3a0010" : "#1a0008",
            border: `2px solid ${phase === "ejecting" ? "#ff3060" : "#660020"}`,
            color: phase === "ejecting" ? "#ff3060" : "#991040",
            fontFamily: "monospace",
            fontSize: "clamp(7px, 1.4vw, 11px)",
            letterSpacing: "0.14em",
            cursor: phase === "ejecting" || phase === "done" ? "default" : "pointer",
            fontWeight: "bold",
            transition: "background 0.2s, border-color 0.2s",
            outline: "none",
            animation: phase === "ejecting" ? "sp-blink 0.3s ease-in-out infinite" : "none",
          }}
          onMouseEnter={(e) => {
            if (phase !== "ejecting" && phase !== "done") {
              (e.currentTarget as HTMLButtonElement).style.background = "#2a0012";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#cc0030";
              (e.currentTarget as HTMLButtonElement).style.color = "#ff3060";
            }
          }}
          onMouseLeave={(e) => {
            if (phase !== "ejecting" && phase !== "done") {
              (e.currentTarget as HTMLButtonElement).style.background = "#1a0008";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#660020";
              (e.currentTarget as HTMLButtonElement).style.color = "#991040";
            }
          }}
        >
          ⚠ EMERGENCY EJECT — PRESS ONLY IF NECESSARY ⚠
        </button>
      </div>
    </div>
  );
}
