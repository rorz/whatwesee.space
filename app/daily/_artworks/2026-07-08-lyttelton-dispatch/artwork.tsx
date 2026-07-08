"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    lyttelton_dispatch_render_to_text?: () => string;
    lyttelton_dispatch_advance?: (steps: number) => void;
  }
}

type FixedToken = { kind: "fixed"; text: string };
type VarToken = { kind: "var"; alts: [string, string, string, string] };
type WitToken = FixedToken | VarToken;

const PARA1: WitToken[] = [
  { kind: "fixed", text: "The " },
  { kind: "var", alts: ["Provincial Council", "Council", "Council", "gentlemen of the Council"] },
  { kind: "fixed", text: " convened on " },
  { kind: "var", alts: ["Tuesday last", "Tuesday", "the appointed Tuesday", "what was recorded as Tuesday"] },
  { kind: "fixed", text: " to " },
  { kind: "var", alts: [
    "deliberate upon",
    "consider",
    "be seen to consider",
    "be seen, at some length, to consider",
  ]},
  { kind: "fixed", text: " the Transfer of Lands Ordinance." },
];

const PARA2: WitToken[] = [
  { kind: "var", alts: [
    "The Chairman opened the sitting.",
    "The Chairman called for order.",
    "The Chairman called for quiet.",
    "The Chairman waited until quiet came of its own accord.",
  ]},
  { kind: "fixed", text: " The ordinance was " },
  { kind: "var", alts: [
    "read to the Council in full.",
    "read aloud.",
    "read, in full, to the Council.",
    "read aloud in full, to the apparent surprise of several members.",
  ]},
  { kind: "fixed", text: " Several members " },
  { kind: "var", alts: [
    "offered remarks.",
    "spoke.",
    "spoke at length.",
    "spoke until the afternoon became a different colour.",
  ]},
];

const PARA3: WitToken[] = [
  { kind: "fixed", text: "A further date was " },
  { kind: "var", alts: [
    "appointed for continued deliberation.",
    "fixed for further discussion.",
    "settled for the following Tuesday.",
    "entered in the clerk\u2019s book and not disputed, which is its own kind of settlement.",
  ]},
];

const EDITORIAL: [string, string, string, string] = [
  "",
  "\u2014 Ed.",
  "\u2014 C.W., who attended and would rather not have.",
  "\u2014 C. Ward. This is the sixth consecutive deferred reading of the same ordinance. We omit nothing. We add only the silence between motions, which is also on the record.",
];

const PAPER_BG_TOP = "#ede0b0";
const PAPER_BG_BOT = "#d8c070";
const INK_FIXED = "#1a0e00";
const INK_VAR_R0 = 26;
const INK_VAR_G0 = 14;
const INK_VAR_R1 = 130;
const INK_VAR_G1 = 28;

function varInk(t: number): string {
  const r = Math.round(INK_VAR_R0 + t * (INK_VAR_R1 - INK_VAR_R0));
  const g = Math.round(INK_VAR_G0 + t * (INK_VAR_G1 - INK_VAR_G0));
  return `rgb(${r},${g},0)`;
}

type Seg = { text: string; isVar: boolean };

function buildSegs(tokens: WitToken[], witIdx: number): Seg[] {
  return tokens.map((tok) =>
    tok.kind === "fixed"
      ? { text: tok.text, isVar: false }
      : { text: tok.alts[witIdx], isVar: true }
  );
}

function wrapSegs(
  ctx: CanvasRenderingContext2D,
  segs: Seg[],
  maxWidth: number
): Seg[][] {
  const lines: Seg[][] = [];
  let line: Seg[] = [];
  let lineW = 0;

  for (const seg of segs) {
    const words = seg.text.match(/\S+\s*/g) ?? [];
    for (const word of words) {
      const w = ctx.measureText(word).width;
      const trimmed = word.trimEnd();
      if (lineW + ctx.measureText(trimmed).width > maxWidth && line.length > 0) {
        lines.push(line);
        line = [];
        lineW = 0;
      }
      const last = line[line.length - 1];
      if (last && last.isVar === seg.isVar) {
        last.text += word;
      } else {
        line.push({ text: word, isVar: seg.isVar });
      }
      lineW += w;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: Seg[][],
  x0: number,
  y: number,
  lineH: number,
  vc: string
): number {
  for (const line of lines) {
    let x = x0;
    for (const seg of line) {
      ctx.fillStyle = seg.isVar ? vc : INK_FIXED;
      ctx.fillText(seg.text, x, y);
      x += ctx.measureText(seg.text).width;
    }
    y += lineH;
  }
  return y;
}

export default function LytteltonDispatch() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let S = 0;
    let wit = 0;
    let targetWit = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartWit = 0;
    let resizeObserver: ResizeObserver | null = null;

    let TUNER_X0 = 0;
    let TUNER_X1 = 0;
    let TUNER_Y = 0;
    let TUNER_H = 0;

    const fitCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      S = Math.min(rect.width, rect.height);
      canvas.width = Math.floor(S * dpr);
      canvas.height = Math.floor(S * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      TUNER_X0 = S * 0.08;
      TUNER_X1 = S * 0.92;
      TUNER_Y = S * 0.89;
      TUNER_H = S * 0.04;
    };

    const witToX = (w: number) => TUNER_X0 + (w / 3) * (TUNER_X1 - TUNER_X0);

    const drawBackground = () => {
      const grad = ctx.createLinearGradient(0, 0, 0, S);
      grad.addColorStop(0, PAPER_BG_TOP);
      grad.addColorStop(1, PAPER_BG_BOT);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, S, S);

      ctx.save();
      ctx.globalAlpha = 0.045;
      ctx.fillStyle = "#5a3800";
      for (let i = 0; i < 1200; i++) {
        const gx = ((Math.sin(i * 127.1 + 1) * 43758.5453) % 1 + 1) % 1;
        const gy = ((Math.sin(i * 311.7 + 2) * 53758.5453) % 1 + 1) % 1;
        ctx.fillRect(Math.floor(gx * S), Math.floor(gy * S), 1, 1);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const hRule = (y: number, thick = 1) => {
      ctx.strokeStyle = "#6a4010";
      ctx.lineWidth = thick;
      ctx.beginPath();
      ctx.moveTo(S * 0.05, y);
      ctx.lineTo(S * 0.95, y);
      ctx.stroke();
    };

    const draw = () => {
      if (!S) return;

      const witIdx = Math.min(3, Math.max(0, Math.round(wit)));
      const t = wit / 3;
      const vc = varInk(t);

      drawBackground();

      const colX = S * 0.055;
      const colW = S * 0.89;

      // — Masthead —
      const titleSz = Math.max(11, S * 0.063);
      ctx.font = `bold ${titleSz}px Georgia, serif`;
      ctx.fillStyle = "#1a0800";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("LYTTELTON TIMES", S * 0.5, S * 0.028);

      const subSz = Math.max(6, S * 0.022);
      ctx.font = `${subSz}px Georgia, serif`;
      ctx.fillStyle = "#4a2800";
      ctx.fillText("WEDNESDAY, 1 JULY 1857  \u00B7  ONE PENNY", S * 0.5, S * 0.028 + titleSz + 2);

      let y = S * 0.028 + titleSz + subSz + 10;
      hRule(y, 2);
      hRule(y + 3, 0.5);
      y += 10;

      // — Column header —
      const hdrSz = Math.max(8, S * 0.029);
      ctx.font = `bold ${hdrSz}px Georgia, serif`;
      ctx.fillStyle = "#1a0800";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("PROVINCIAL COUNCIL.", colX, y);
      y += hdrSz + S * 0.012;

      // — Dispatch paragraphs —
      const bodySz = Math.max(8, S * 0.031);
      const lineH = bodySz * 1.52;
      ctx.font = `${bodySz}px Georgia, serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const paras = [PARA1, PARA2, PARA3];
      for (const para of paras) {
        const segs = buildSegs(para, witIdx);
        const lines = wrapSegs(ctx, segs, colW);
        y = drawLines(ctx, lines, colX, y, lineH, vc);
        y += lineH * 0.45;
      }

      y += S * 0.008;
      hRule(y);
      y += S * 0.01;

      // — Editorial note —
      const editText = EDITORIAL[witIdx];
      if (editText) {
        const editSz = Math.max(7, S * 0.026);
        const editLineH = editSz * 1.45;
        ctx.font = `italic ${editSz}px Georgia, serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = varInk(t * 0.85 + 0.15);
        const editWords = editText.match(/\S+\s*/g) ?? [];
        let ex = colX;
        let ey = y;
        for (const word of editWords) {
          const tw = ctx.measureText(word).width;
          if (ex + ctx.measureText(word.trimEnd()).width > colX + colW && ex > colX) {
            ey += editLineH;
            ex = colX;
          }
          ctx.fillText(word, ex, ey);
          ex += tw;
        }
      }

      // — Tuner —
      const tunerY = TUNER_Y;
      const tunerH = TUNER_H;
      const tx0 = TUNER_X0;
      const tx1 = TUNER_X1;
      const needle = witToX(wit);

      ctx.fillStyle = "#b89040";
      ctx.fillRect(tx0, tunerY, tx1 - tx0, tunerH);
      ctx.strokeStyle = "#6a4010";
      ctx.lineWidth = Math.max(1, S * 0.003);
      ctx.strokeRect(tx0, tunerY, tx1 - tx0, tunerH);

      for (let i = 0; i <= 3; i++) {
        const tx = witToX(i);
        ctx.strokeStyle = "#3a1800";
        ctx.lineWidth = Math.max(0.5, S * 0.002);
        ctx.beginPath();
        ctx.moveTo(tx, tunerY);
        ctx.lineTo(tx, tunerY + tunerH);
        ctx.stroke();
      }

      ctx.fillStyle = "#1a0800";
      ctx.fillRect(needle - Math.max(1.5, S * 0.005), tunerY - tunerH * 0.35, Math.max(3, S * 0.01), tunerH * 1.7);

      const labelSz = Math.max(5, S * 0.02);
      ctx.font = `${labelSz}px Georgia, serif`;
      ctx.fillStyle = "#3a1800";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("FORMAL", witToX(0), tunerY + tunerH + 2);
      ctx.fillText("FULL", witToX(3), tunerY + tunerH + 2);

      ctx.font = `bold ${labelSz}px Georgia, serif`;
      ctx.fillStyle = "#4a2800";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("W I T", (tx0 + tx1) / 2, tunerY - tunerH * 0.4);
    };

    const loop = () => {
      wit += (targetWit - wit) * 0.14;
      if (Math.abs(wit - targetWit) < 0.002) wit = targetWit;
      draw();
      rafId = requestAnimationFrame(loop);
    };

    const getClientX = (e: PointerEvent): number => {
      const rect = canvas.getBoundingClientRect();
      return ((e.clientX - rect.left) / rect.width) * S;
    };

    const isOnTuner = (e: PointerEvent): boolean => {
      const cx = getClientX(e);
      const rect = canvas.getBoundingClientRect();
      const cy = ((e.clientY - rect.top) / rect.height) * S;
      return cx >= TUNER_X0 - 10 && cx <= TUNER_X1 + 10 && cy >= TUNER_Y - TUNER_H * 1.5 && cy <= TUNER_Y + TUNER_H * 2.5;
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (!isOnTuner(e)) return;
      isDragging = true;
      canvas.setPointerCapture(e.pointerId);
      dragStartX = getClientX(e);
      dragStartWit = targetWit;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = getClientX(e) - dragStartX;
      const dw = (dx / (TUNER_X1 - TUNER_X0)) * 3;
      targetWit = Math.max(0, Math.min(3, dragStartWit + dw));
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      canvas.releasePointerCapture(e.pointerId);
      targetWit = Math.round(targetWit);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);

    fitCanvas();
    resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(container);

    window.lyttelton_dispatch_render_to_text = () => {
      const idx = Math.min(3, Math.max(0, Math.round(wit)));
      const token = PARA1[1] as VarToken;
      return `wit=${wit.toFixed(2)} level=${idx} voice="${token.alts[idx]}"`;
    };

    window.lyttelton_dispatch_advance = (steps: number) => {
      const n = Math.max(0, Math.floor(Number.isFinite(steps) ? steps : 0));
      targetWit = Math.min(3, Math.round(targetWit) + n);
      wit = targetWit;
    };

    loop();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      delete window.lyttelton_dispatch_render_to_text;
      delete window.lyttelton_dispatch_advance;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full touch-none select-none"
      aria-label="A colonial-era newspaper column from the Lyttelton Times, 1857. Drag the WIT tuner at the bottom to shift the editorial register from formal provincial reportage to the penetrating style of editor Crosbie Ward."
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-ew-resize"
      />
    </div>
  );
}
