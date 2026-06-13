"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    declaration_squall_render_to_text?: () => string;
    declaration_squall_advance?: (steps: number) => void;
  }
}

type Verdict = "release" | "quarantine";

type BagTemplate = {
  headline: string;
  detail: string;
  verdict: Verdict;
  shell: string;
  tag: string;
};

type Bag = BagTemplate & {
  id: number;
};

type Model = {
  phase: number;
  selectedId: number | null;
  queue: Array<Bag>;
  release: Array<Bag>;
  quarantine: Array<Bag>;
  nextTemplateIndex: number;
  nextId: number;
  correct: number;
  mistakes: number;
};

const BAG_TEMPLATES: Array<BagTemplate> = [
  { headline: "COOKIE", detail: "LOGGER", verdict: "release", shell: "#81502d", tag: "#f6d279" },
  { headline: "MACRO", detail: "SCRIPT", verdict: "release", shell: "#8d5f3a", tag: "#ffd98e" },
  { headline: "KEYLOG", detail: "SYRUP", verdict: "release", shell: "#744726", tag: "#f9cf7a" },
  { headline: "TRACKER", detail: "WAFER", verdict: "release", shell: "#92623f", tag: "#ffd483" },
  { headline: "NUCLEAR", detail: "MINT", verdict: "quarantine", shell: "#6e3527", tag: "#ff8f71" },
  { headline: "BIOLOGIC", detail: "TAFFY", verdict: "quarantine", shell: "#7a3224", tag: "#ff7a6b" },
  { headline: "WEAPONS", detail: "NOUGAT", verdict: "quarantine", shell: "#5d281e", tag: "#ff9f5e" },
  { headline: "PAYLOAD", detail: "RIND", verdict: "release", shell: "#845833", tag: "#f5cf84" },
];

const WEATHER_WORDS = ["NUCLEAR", "BIOLOGICAL", "WEAPONS", "SPYWARE", "MALWARE", "COOKIE", "MACRO", "TRACKER"] as const;

function appendBag(model: Model): Model {
  const template = BAG_TEMPLATES[model.nextTemplateIndex % BAG_TEMPLATES.length];
  return {
    ...model,
    queue: [...model.queue, { id: model.nextId, ...template }],
    nextTemplateIndex: model.nextTemplateIndex + 1,
    nextId: model.nextId + 1,
  };
}

function topUpQueue(model: Model): Model {
  let next = model;
  while (next.queue.length < 2) {
    next = appendBag(next);
  }
  return next;
}

function createInitialModel(): Model {
  return topUpQueue({
    phase: 0,
    selectedId: null,
    queue: [],
    release: [],
    quarantine: [],
    nextTemplateIndex: 0,
    nextId: 1,
    correct: 0,
    mistakes: 0,
  });
}

function advanceModel(model: Model, steps: number): Model {
  return {
    ...model,
    phase: model.phase + steps,
  };
}

function selectBag(model: Model, bagId: number): Model {
  return {
    ...model,
    selectedId: model.selectedId === bagId ? null : bagId,
  };
}

function fileSelected(model: Model, verdict: Verdict): Model {
  if (model.selectedId === null) {
    return model;
  }

  const bagIndex = model.queue.findIndex((bag) => bag.id === model.selectedId);
  if (bagIndex === -1) {
    return model;
  }

  const bag = model.queue[bagIndex];
  const queue = model.queue.filter((queuedBag) => queuedBag.id !== bag.id);
  const correct = verdict === bag.verdict;
  const nextModel: Model = {
    ...model,
    phase: model.phase + 1,
    selectedId: null,
    queue,
    release: verdict === "release" ? [bag, ...model.release].slice(0, 4) : model.release,
    quarantine: verdict === "quarantine" ? [bag, ...model.quarantine].slice(0, 4) : model.quarantine,
    correct: model.correct + (correct ? 1 : 0),
    mistakes: model.mistakes + (correct ? 0 : 1),
  };
  return topUpQueue(nextModel);
}

function handleKeyActivate(event: ReactKeyboardEvent<SVGGElement>, action: () => void): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

const INITIAL_MODEL = createInitialModel();

export default function DeclarationSquall() {
  const [model, setModel] = useState<Model>(INITIAL_MODEL);
  const modelRef = useRef<Model>(INITIAL_MODEL);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setModel((current) => advanceModel(current, 1));
    }, 240);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    window.declaration_squall_render_to_text = () => {
      const current = modelRef.current;
      return [
        "declaration-squall",
        `phase:${current.phase}`,
        `selected:${current.selectedId ?? "none"}`,
        `queue:${current.queue.map((bag) => bag.headline).join(",")}`,
        `release:${current.release.length}`,
        `quarantine:${current.quarantine.length}`,
        `mistakes:${current.mistakes}`,
      ].join("|");
    };
    window.declaration_squall_advance = (steps: number) => {
      const safeSteps = Math.max(0, Math.floor(steps));
      setModel((current) => advanceModel(current, safeSteps));
    };

    return () => {
      delete window.declaration_squall_render_to_text;
      delete window.declaration_squall_advance;
    };
  }, []);

  return (
    <div className="h-full w-full overflow-hidden bg-[#c45732] text-[#2d140d]">
      <svg viewBox="0 0 100 100" className="h-full w-full touch-none select-none" aria-label="A split-screen customs desk with edible weather warnings above and tagged luggage sorted below.">
        <rect x="0" y="0" width="100" height="100" fill="#c45732" />
        <rect x="4" y="4" width="92" height="29" rx="5" fill="#f0cf8f" />
        <rect x="4" y="36" width="92" height="60" rx="5" fill="#f4ead8" />
        <rect x="4" y="33" width="92" height="3" fill="#7a3224" />
        <text x="8" y="10" fill="#6d2d1f" fontSize="4.4" fontWeight="800" letterSpacing="0.45" fontFamily="var(--font-geist-mono), monospace">
          DECLARATION SQUALL
        </text>
        <text x="8" y="15.5" fill="#7f4a31" fontSize="2.35" letterSpacing="0.24" fontFamily="var(--font-geist-mono), monospace">
          BORROWED PANIC WORDS IN TRANSIT
        </text>
        <text x="74" y="10" fill="#6d2d1f" fontSize="2.85" fontWeight="700" letterSpacing="0.18" fontFamily="var(--font-geist-mono), monospace">
          CLEAR {model.correct.toString().padStart(2, "0")}
        </text>
        <text x="74" y="15.4" fill="#6d2d1f" fontSize="2.85" fontWeight="700" letterSpacing="0.18" fontFamily="var(--font-geist-mono), monospace">
          JAM {model.mistakes.toString().padStart(2, "0")}
        </text>

        {WEATHER_WORDS.map((word, index) => {
          const x = ((model.phase * 2.3 + index * 13.4) % 118) - 9;
          const y = 18 + (index % 3) * 4.4 + Math.sin((model.phase + index * 2) * 0.32) * 1.3;
          const width = Math.max(13, word.length * 1.85);
          const fill = index < 3 ? "#ff8e6e" : "#ffe0a4";
          const stroke = index < 3 ? "#7a3224" : "#8f6135";

          return (
            <g key={word} transform={`translate(${x} ${y}) rotate(${Math.sin((model.phase + index) * 0.18) * 3})`}>
              <rect x="0" y="0" width={width} height="5.1" rx="2.55" fill={fill} stroke={stroke} strokeWidth="0.6" />
              <text
                x={width / 2}
                y="3.5"
                textAnchor="middle"
                fill="#592217"
                fontSize="2.1"
                fontWeight="800"
                letterSpacing="0.12"
                fontFamily="var(--font-geist-mono), monospace"
              >
                {word}
              </text>
            </g>
          );
        })}

        <path
          d={`M 9 27 C 24 ${24 + Math.sin(model.phase * 0.18) * 2}, 39 ${30 + Math.cos(model.phase * 0.13) * 1.8}, 52 25 S 79 ${23 + Math.sin(model.phase * 0.2) * 1.5}, 92 27`}
          fill="none"
          stroke="#7a3224"
          strokeWidth="1.4"
          strokeDasharray="2.8 2.2"
          opacity="0.8"
        />

        <text x="8" y="42.5" fill="#6d2d1f" fontSize="2.8" fontWeight="700" letterSpacing="0.28" fontFamily="var(--font-geist-mono), monospace">
          SELECT BAG
        </text>
        <text x="72" y="42.5" fill="#6d2d1f" fontSize="2.8" fontWeight="700" letterSpacing="0.28" fontFamily="var(--font-geist-mono), monospace">
          FILE IT
        </text>

        <g
          role="button"
          tabIndex={0}
          onClick={() => setModel((current) => fileSelected(current, "release"))}
          onKeyDown={(event) => handleKeyActivate(event, () => setModel((current) => fileSelected(current, "release")))}
          style={{ cursor: "pointer" }}
          transform={`translate(7 ${67 + Math.sin(model.phase * 0.22) * 0.5})`}
        >
          <rect x="0" y="0" width="23" height="16.5" rx="3.5" fill="#ffd483" stroke="#7a4e1f" strokeWidth="1" />
          <text x="11.5" y="6.3" textAnchor="middle" fill="#6d2d1f" fontSize="2.7" fontWeight="800" letterSpacing="0.18" fontFamily="var(--font-geist-mono), monospace">
            RELEASE
          </text>
          <text x="11.5" y="11.2" textAnchor="middle" fill="#8a5b2f" fontSize="2" letterSpacing="0.12" fontFamily="var(--font-geist-mono), monospace">
            ORDINARY CODE
          </text>
        </g>

        <g
          role="button"
          tabIndex={0}
          onClick={() => setModel((current) => fileSelected(current, "quarantine"))}
          onKeyDown={(event) => handleKeyActivate(event, () => setModel((current) => fileSelected(current, "quarantine")))}
          style={{ cursor: "pointer" }}
          transform={`translate(70 ${67 + Math.cos(model.phase * 0.22) * 0.5})`}
        >
          <rect x="0" y="0" width="23" height="16.5" rx="3.5" fill="#ff8f71" stroke="#7a3224" strokeWidth="1" />
          <text x="11.5" y="6.3" textAnchor="middle" fill="#5a2017" fontSize="2.25" fontWeight="800" letterSpacing="0.08" fontFamily="var(--font-geist-mono), monospace">
            QUARAN-
          </text>
          <text x="11.5" y="9.9" textAnchor="middle" fill="#5a2017" fontSize="2.25" fontWeight="800" letterSpacing="0.08" fontFamily="var(--font-geist-mono), monospace">
            TINE
          </text>
          <text x="11.5" y="13.4" textAnchor="middle" fill="#7a3224" fontSize="1.95" letterSpacing="0.12" fontFamily="var(--font-geist-mono), monospace">
            CATASTROPHE
          </text>
        </g>

        {model.release.map((bag, index) => (
          <g key={`release-${bag.id}`} transform={`translate(${9 + index * 2.2} ${87 - index * 2.3}) rotate(${-6 + index * 1.4})`}>
            <rect x="0" y="0" width="16" height="7" rx="1.8" fill="#f9e0a3" stroke="#7a4e1f" strokeWidth="0.7" />
            <text x="8" y="4.5" textAnchor="middle" fill="#6d2d1f" fontSize="1.9" fontWeight="800" letterSpacing="0.08" fontFamily="var(--font-geist-mono), monospace">
              {bag.headline}
            </text>
          </g>
        ))}

        {model.quarantine.map((bag, index) => (
          <g key={`quarantine-${bag.id}`} transform={`translate(${75 - index * 2.2} ${87 - index * 2.3}) rotate(${5 - index * 1.4})`}>
            <rect x="0" y="0" width="16" height="7" rx="1.8" fill="#ffc0a4" stroke="#7a3224" strokeWidth="0.7" />
            <text x="8" y="4.5" textAnchor="middle" fill="#5a2017" fontSize="1.9" fontWeight="800" letterSpacing="0.08" fontFamily="var(--font-geist-mono), monospace">
              {bag.headline}
            </text>
          </g>
        ))}

        {model.queue.map((bag, index) => {
          const selected = bag.id === model.selectedId;
          const baseX = 31 + index * 30;
          const swayX = Math.sin((model.phase + index * 3) * 0.28) * 0.9;
          const swayY = Math.cos((model.phase + index * 2) * 0.24) * 0.5 - (selected ? 5.2 : 0);
          const stroke = selected ? "#2d140d" : "#6d2d1f";

          return (
            <g
              key={bag.id}
              role="button"
              tabIndex={0}
              onClick={() => setModel((current) => selectBag(current, bag.id))}
              onKeyDown={(event) => handleKeyActivate(event, () => setModel((current) => selectBag(current, bag.id)))}
              style={{ cursor: "pointer" }}
              transform={`translate(${baseX + swayX} ${59 + swayY}) rotate(${Math.sin((model.phase + index) * 0.19) * 1.2})`}
            >
              <path d="M 5 4 C 5 2.3 6.6 1 8.6 1 h 4.8 c 2 0 3.6 1.3 3.6 3" fill="none" stroke={stroke} strokeWidth="0.9" />
              <rect x="1.5" y="4" width="18" height="12.2" rx="3.2" fill={bag.shell} stroke={stroke} strokeWidth={selected ? 1.2 : 0.8} />
              <line x1="14.2" y1="7.6" x2="19.2" y2="4.4" stroke={stroke} strokeWidth="0.6" />
              <rect x="14.2" y="0.4" width="16.5" height="9.9" rx="2.2" fill={bag.tag} stroke={stroke} strokeWidth={selected ? 1.1 : 0.8} />
              <text x="22.45" y="3.9" textAnchor="middle" fill="#5a2017" fontSize="1.85" fontWeight="900" letterSpacing="0.04" fontFamily="var(--font-geist-mono), monospace">
                {bag.headline}
              </text>
              <text x="22.45" y="6.9" textAnchor="middle" fill="#6d2d1f" fontSize="1.65" fontWeight="700" letterSpacing="0.04" fontFamily="var(--font-geist-mono), monospace">
                {bag.detail}
              </text>
              <text x="10.5" y="11.8" textAnchor="middle" fill="#f8e9d2" fontSize="2.2" fontWeight="700" letterSpacing="0.08" fontFamily="var(--font-geist-mono), monospace">
                BAG
              </text>
            </g>
          );
        })}

        <text x="50" y="95" textAnchor="middle" fill="#6d2d1f" fontSize="2.5" letterSpacing="0.12" fontFamily="var(--font-geist-mono), monospace">
          TAP A BAG, THEN STAMP ITS WORDS TO THE CORRECT SIDE
        </text>
      </svg>
    </div>
  );
}
