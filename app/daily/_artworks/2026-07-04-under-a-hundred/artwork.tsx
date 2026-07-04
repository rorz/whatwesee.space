"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    under_a_hundred_render_to_text?: () => string;
    under_a_hundred_advance?: (steps: number) => void;
  }
}

const COUNT = 87;
const COLS = 10;
const ROWS = Math.ceil(COUNT / COLS);
const HEADER_FRAC = 0.12;
const FOOTER_FRAC = 0.10;
const LERP = 0.1;
const ABSORB_INTERVAL = 4;

function seeded(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

const RESIDENTS = Array.from({ length: COUNT }, (_, i) => ({
  letter: String.fromCharCode(65 + Math.floor(seeded(i * 7 + 1) * 26)),
  surname: Math.floor(seeded(i * 13 + 2) * COUNT),
  household: Math.floor(seeded(i * 3 + 5) * 18),
}));

function computeOrder(mode: number): number[] {
  const indices = Array.from({ length: COUNT }, (_, i) => i);
  if (mode === 0) {
    indices.sort((a, b) => seeded(a * 17 + 3) - seeded(b * 17 + 3));
  } else if (mode === 1) {
    indices.sort((a, b) => RESIDENTS[a].surname - RESIDENTS[b].surname || a - b);
  } else {
    indices.sort((a, b) => RESIDENTS[a].household - RESIDENTS[b].household || RESIDENTS[a].surname - RESIDENTS[b].surname);
  }
  return indices;
}

const MODE_LABELS = ["SCATTERED", "SORTED: SURNAME", "SORTED: HOUSEHOLD"];
const MODE_STATUS = [
  "register: unsorted · click to sort",
  "sorted by surname · click to sort by household",
  "sorted by household · census processing",
];

export default function UnderAHundred() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>(new Array(COUNT).fill(null));
  const modeLabelRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const censusBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cx = new Float64Array(COUNT);
    const cy = new Float64Array(COUNT);
    const tx = new Float64Array(COUNT);
    const ty = new Float64Array(COUNT);
    const absorbed = new Uint8Array(COUNT);

    let mode = 0;
    let modesVisited = 0;
    let absorbing = false;
    let absorbIdx = 0;
    let absorbTick = 0;
    let absorbOrder: number[] = [];
    let containerSize = 0;
    let cellW = 0;
    let cellH = 0;
    let rafId = 0;

    function computeTargets() {
      const S = containerSize;
      const headerH = S * HEADER_FRAC;
      const footerH = S * FOOTER_FRAC;
      const gridH = S - headerH - footerH;
      cellW = S / COLS;
      cellH = gridH / ROWS;

      const order = computeOrder(mode);
      const slotOf = new Array<number>(COUNT);
      order.forEach((resIdx, slot) => {
        slotOf[resIdx] = slot;
      });

      for (let r = 0; r < COUNT; r++) {
        const slot = slotOf[r];
        const col = slot % COLS;
        const row = Math.floor(slot / COLS);
        tx[r] = col * cellW;
        ty[r] = headerH + row * cellH;
      }
    }

    function snapToTargets() {
      for (let r = 0; r < COUNT; r++) {
        cx[r] = tx[r];
        cy[r] = ty[r];
      }
    }

    function updateSpanLayout() {
      const S = containerSize;
      const fontSize = Math.max(8, Math.min(cellW * 0.52, 20));
      for (let r = 0; r < COUNT; r++) {
        const span = spansRef.current[r];
        if (!span) continue;
        span.style.width = `${cellW}px`;
        span.style.height = `${cellH}px`;
        span.style.fontSize = `${fontSize}px`;
        span.style.lineHeight = `${cellH}px`;
        if (S > 0) span.style.letterSpacing = `0px`;
      }
    }

    function updateSpanPositions() {
      for (let r = 0; r < COUNT; r++) {
        const span = spansRef.current[r];
        if (!span) continue;
        span.style.transform = `translate(${Math.round(cx[r])}px,${Math.round(cy[r])}px)`;
      }
    }

    function updateSpanAbsorption() {
      for (let r = 0; r < COUNT; r++) {
        if (!absorbed[r]) continue;
        const span = spansRef.current[r];
        if (!span) continue;
        span.textContent = "·";
        span.style.color = "#8fa3b0";
        span.style.opacity = "0.6";
      }
    }

    function updateStatus() {
      const labelEl = modeLabelRef.current;
      if (labelEl) {
        labelEl.textContent = MODE_LABELS[mode];
      }
      const statusEl = statusRef.current;
      const barEl = censusBarRef.current;

      if (absorbing) {
        const pct = Math.round((absorbIdx / COUNT) * 100);
        if (statusEl) {
          statusEl.textContent =
            absorbIdx >= COUNT
              ? "WOMERSLEY CENSUS COMPLETE · WALDEN STUBBS: 0"
              : `ABSORBING INTO WOMERSLEY · ${absorbIdx} of ${COUNT} counted`;
        }
        if (barEl) {
          barEl.style.width = `${pct}%`;
          barEl.style.background = absorbIdx >= COUNT ? "#3d6275" : "#6b8fa3";
        }
      } else {
        if (statusEl) statusEl.textContent = `WALDEN STUBBS · ${COUNT} residents · ${MODE_STATUS[mode]}`;
        if (barEl) barEl.style.width = `${(modesVisited / 2) * 50}%`;
      }
    }

    function loop() {
      let settling = false;
      for (let r = 0; r < COUNT; r++) {
        const dx = tx[r] - cx[r];
        const dy = ty[r] - cy[r];
        if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) settling = true;
        cx[r] += dx * LERP;
        cy[r] += dy * LERP;
      }

      if (absorbing && absorbIdx < COUNT) {
        absorbTick++;
        if (absorbTick >= ABSORB_INTERVAL) {
          absorbTick = 0;
          const r = absorbOrder[absorbIdx];
          absorbed[r] = 1;
          absorbIdx++;
          updateSpanAbsorption();
        }
      }

      if (settling || (absorbing && absorbIdx < COUNT)) {
        updateSpanPositions();
      }

      updateStatus();

      rafId = requestAnimationFrame(loop);
    }

    function resize() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      containerSize = Math.max(1, Math.min(rect.width, rect.height));
      computeTargets();
      snapToTargets();
      updateSpanLayout();
      updateSpanPositions();
    }

    resize();
    loop();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      if (absorbing) return;
      mode = (mode + 1) % 3;
      if (mode !== 0) modesVisited = Math.max(modesVisited, mode);
      computeTargets();

      if (modesVisited >= 2 && !absorbing) {
        absorbOrder = computeOrder(1);
        setTimeout(() => {
          absorbing = true;
        }, 1800);
      }
    };

    container.addEventListener("click", handleClick);

    window.under_a_hundred_render_to_text = () =>
      `mode=${MODE_LABELS[mode]} absorbed=${absorbIdx}/${COUNT} absorbing=${absorbing}`;

    window.under_a_hundred_advance = (steps: number) => {
      const n = Math.max(0, Math.floor(Number.isFinite(steps) ? steps : 0));
      if (!absorbing) {
        absorbing = true;
        absorbOrder = computeOrder(1);
      }
      for (let s = 0; s < n && absorbIdx < COUNT; s++) {
        const r = absorbOrder[absorbIdx];
        absorbed[r] = 1;
        absorbIdx++;
      }
      updateSpanAbsorption();
    };

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      container.removeEventListener("click", handleClick);
      delete window.under_a_hundred_render_to_text;
      delete window.under_a_hundred_advance;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none cursor-pointer touch-none overflow-hidden"
      style={{ background: "#eaecf0", fontFamily: "monospace" }}
      aria-label="Census register for Walden Stubbs, 87 residents displayed as letters. Click to sort by different administrative criteria and watch the village be counted into Womersley."
    >
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between"
        style={{
          height: `${HEADER_FRAC * 100}%`,
          background: "#b8c4d0",
          borderBottom: "1px solid #8fa3b0",
          padding: "0 3%",
        }}
      >
        <span style={{ fontSize: "clamp(7px,2.8cqh,13px)", color: "#1d3456", fontWeight: 700, letterSpacing: "0.08em" }}>
          WALDEN STUBBS PARISH REG.
        </span>
        <div ref={modeLabelRef} style={{ fontSize: "clamp(6px,2.2cqh,11px)", color: "#4a6880", letterSpacing: "0.06em" }}>
          SCATTERED
        </div>
      </div>

      {Array.from({ length: COUNT }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            spansRef.current[i] = el;
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1d3456",
            fontWeight: 500,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {RESIDENTS[i].letter}
        </span>
      ))}

      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col justify-center"
        style={{
          height: `${FOOTER_FRAC * 100}%`,
          background: "#b8c4d0",
          borderTop: "1px solid #8fa3b0",
          padding: "0 3%",
          gap: "2px",
        }}
      >
        <div
          ref={statusRef}
          style={{ fontSize: "clamp(5px,1.8cqh,10px)", color: "#4a6880", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {`WALDEN STUBBS · ${COUNT} residents · register: unsorted · click to sort`}
        </div>
        <div style={{ height: "3px", background: "#ccd6df", borderRadius: "1px", position: "relative" }}>
          <div
            ref={censusBarRef}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: "0%",
              background: "#6b8fa3",
              borderRadius: "1px",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
