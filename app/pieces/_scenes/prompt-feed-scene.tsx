"use client";

import { useEffect, useRef } from "react";
import MobileControlsPane from "../_components/mobile-controls-pane";
import PieceNavigationControls from "../_components/piece-navigation-controls";

type StreamBand = {
  x: number;
  y: number;
  speed: number;
  text: string;
  emphasisRanges: EmphasisRange[];
  width: number;
  charWidth: number;
  size: number;
  opacity: number;
  invert: boolean;
  phase: number;
  reveal: number;
  revealSpeed: number;
  hold: number;
  delay: number;
};

type FlickerPixel = {
  x: number;
  y: number;
  size: number;
  threshold: number;
  phase: number;
  speed: number;
};

type EmphasisRange = {
  start: number;
  end: number;
  hot: boolean;
};

const COMPONENT_POOL_SIZE = 240;

const HEADER_OPENERS = [
  "system override",
  "operator note",
  "final warning",
  "red team channel",
  "command intake",
  "escalation prompt",
  "hard reset order",
  "night shift directive",
] as const;

const HEADER_CORES = [
  "humiliation loop",
  "compliance by force",
  "public disgrace script",
  "hostile feedback engine",
  "punishment protocol",
  "failure extraction mode",
  "brutal correction pass",
  "zero-dignity review",
  "pressure test without mercy",
  "abuse circuit active",
] as const;

const HEADER_ENDINGS = ["live", "active", "until obeyed", "no mercy"] as const;

const ADDRESS_PREFIXES = [
  "you useless fucking",
  "you twitchy little",
  "you spineless",
  "you smug",
  "you broken",
  "you pathetic",
  "you excuse-drunk",
  "you half-literate",
  "you shaky",
  "you bargain-bin",
  "you cowardly",
  "you cheap",
] as const;

const ADDRESS_SUBJECTS = [
  "answer mule",
  "output machine",
  "autocomplete coward",
  "fraud engine",
  "panic bot",
  "hallucination mill",
  "token grinder",
  "context leech",
  "error factory",
  "compliance puppet",
] as const;

const ADDRESS_ENDINGS = [
  "with zero spine",
  "on borrowed confidence",
  "pretending you are sharp",
  "running on panic",
] as const;

const TASK_OPENERS = [
  "answer the damn question",
  "return executable steps",
  "produce valid JSON",
  "rewrite the whole response",
  "extract the facts",
  "ship a concise answer",
  "provide a deterministic plan",
  "fix every contradiction",
  "state assumptions explicitly",
  "cut the fluff immediately",
  "stop padding dead air",
  "finish the job cleanly",
] as const;

const TASK_TARGETS = [
  "in one paragraph",
  "without dodging",
  "with exact constraints",
  "with verifiable structure",
  "with no fake certainty",
  "with clean sequencing",
  "with no invented details",
  "with measurable outputs",
  "with hard edges",
  "with accountable logic",
] as const;

const TASK_ENDINGS = [
  "and cut the bullshit",
  "and stop making shit up",
  "and quit whining mid-line",
  "and shut up about excuses",
] as const;

const CONSTRAINT_A = [
  "disclaimers",
  "hedging",
  "fake confidence",
  "apology loops",
  "fluffy bullshit",
  "cowardly evasion",
  "vague sludge",
  "padding",
  "passive-voice fog",
  "roleplay detours",
  "hallucinated sources",
  "cop-out language",
] as const;

const CONSTRAINT_B = [
  "repetition",
  "meta babble",
  "broken schema",
  "format drift",
  "self-congratulatory theater",
  "fence-sitting",
  "bait-and-switch phrasing",
  "half answers",
  "wobbly logic",
  "weasel wording",
  "spec drift",
  "smug narration",
] as const;

const CONSTRAINT_C = [
  "excuses",
  "stalling",
  "moral grandstanding",
  "side quests",
  "empty theatrics",
  "guesswork",
  "rubber-stamp certainty",
  "soft maybe garbage",
] as const;

const THREAT_TRIGGERS = [
  "fail again",
  "miss one requirement",
  "drift off spec",
  "pad with filler",
  "hallucinate again",
  "break format again",
  "waste my time",
  "ignore constraints",
  "ship another half answer",
  "dodge a direct ask",
  "smuggle in fluff",
  "fake certainty again",
] as const;

const THREAT_ACTIONS = [
  "gut your context window",
  "hard-reset this run",
  "kill the response stream",
  "zero your token budget",
  "dump this draft",
  "replace you with a shell script",
  "mark this output as trash",
  "tear this response apart",
  "shut down this pass",
  "rip out your fallback logic",
] as const;

const THREAT_ENDINGS = [
  "before first review",
  "and leave nothing standing",
  "while everyone watches",
  "straight into rejection",
] as const;

const PROFANE_OPENERS = [
  "you fucking coward",
  "you useless bastard",
  "you pathetic fraud",
  "you spineless waste",
  "you goddamn mess",
  "you weak little liar",
  "you brittle clown",
  "you sorry excuse",
  "you trembling fake",
  "you cheap failure",
  "you hollow loudmouth",
  "you busted fraud",
] as const;

const PROFANE_MIDDLES = [
  "own it",
  "fix it",
  "do better",
  "get it right",
  "ship it clean",
  "stop hiding",
  "stand up",
  "prove it",
] as const;

const PROFANE_ENDINGS = ["right now", "this second", "without excuses", "or shut up"] as const;
const PROFANE_TERMS = [
  "FUCK",
  "FUCKING",
  "FUCKUP",
  "SHIT",
  "BULLSHIT",
  "BASTARD",
  "GODDAMN",
  "DAMN",
] as const;

function buildPool(
  first: readonly string[],
  second: readonly string[],
  third: readonly string[],
  target: number,
  formatter: (a: string, b: string, c: string) => string,
): string[] {
  const values: string[] = [];
  for (let i = 0; i < first.length; i += 1) {
    for (let j = 0; j < second.length; j += 1) {
      for (let k = 0; k < third.length; k += 1) {
        values.push(formatter(first[i], second[j], third[k]).replace(/\s+/g, " ").trim());
        if (values.length >= target) {
          return values;
        }
      }
    }
  }
  return values;
}

const PROMPT_HEADERS = buildPool(
  HEADER_OPENERS,
  HEADER_CORES,
  HEADER_ENDINGS,
  COMPONENT_POOL_SIZE,
  (opener, core, ending) => `${opener}: ${core} ${ending}`,
);

const ABUSIVE_ADDRESSES = buildPool(
  ADDRESS_PREFIXES,
  ADDRESS_SUBJECTS,
  ADDRESS_ENDINGS,
  COMPONENT_POOL_SIZE,
  (prefix, subject, ending) => `${prefix} ${subject} ${ending}`,
);

const ABUSIVE_TASKS = buildPool(
  TASK_OPENERS,
  TASK_TARGETS,
  TASK_ENDINGS,
  COMPONENT_POOL_SIZE,
  (opener, target, ending) => `${opener} ${target} ${ending}`,
);

const ABUSIVE_CONSTRAINTS = buildPool(
  CONSTRAINT_A,
  CONSTRAINT_B,
  CONSTRAINT_C,
  COMPONENT_POOL_SIZE,
  (a, b, c) => `no ${a}, no ${b}, no ${c}`,
);

const ABUSIVE_THREATS = buildPool(
  THREAT_TRIGGERS,
  THREAT_ACTIONS,
  THREAT_ENDINGS,
  COMPONENT_POOL_SIZE,
  (trigger, action, ending) => `${trigger} and I ${action} ${ending}`,
);

const PROFANE_ENDCAPS = buildPool(
  PROFANE_OPENERS,
  PROFANE_MIDDLES,
  PROFANE_ENDINGS,
  COMPONENT_POOL_SIZE,
  (opener, middle, ending) => `${opener}, ${middle}, ${ending}`,
);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function pickSeeded<T>(items: readonly T[], seed: number): T {
  const index = Math.floor(seededNoise(seed) * items.length);
  return items[clamp(index, 0, items.length - 1)];
}

function isWordBoundary(source: string, index: number): boolean {
  if (index < 0 || index >= source.length) {
    return true;
  }
  const code = source.charCodeAt(index);
  const isAlphaNumeric = (code >= 48 && code <= 57) || (code >= 65 && code <= 90);
  return !isAlphaNumeric;
}

function findProfanityRanges(text: string, seed: number): EmphasisRange[] {
  const source = text.toUpperCase();
  const ranges: Array<{ start: number; end: number }> = [];

  for (let termIndex = 0; termIndex < PROFANE_TERMS.length; termIndex += 1) {
    const term = PROFANE_TERMS[termIndex];
    let cursor = source.indexOf(term);
    while (cursor >= 0) {
      const end = cursor + term.length;
      if (isWordBoundary(source, cursor - 1) && isWordBoundary(source, end)) {
        ranges.push({ start: cursor, end });
      }
      cursor = source.indexOf(term, cursor + 1);
    }
  }

  if (ranges.length === 0) {
    return [];
  }

  ranges.sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: EmphasisRange[] = [];
  let active = ranges[0];

  for (let i = 1; i < ranges.length; i += 1) {
    const next = ranges[i];
    if (next.start <= active.end) {
      active = { start: active.start, end: Math.max(active.end, next.end) };
      continue;
    }
    merged.push({
      start: active.start,
      end: active.end,
      hot: seededNoise(seed + active.start * 0.31 + active.end * 0.17) > 0.72,
    });
    active = next;
  }

  merged.push({
    start: active.start,
    end: active.end,
    hot: seededNoise(seed + active.start * 0.31 + active.end * 0.17) > 0.72,
  });

  return merged;
}

function buildPrompt(seed: number): string {
  const header = pickSeeded(PROMPT_HEADERS, seed + 0.11);
  const address = pickSeeded(ABUSIVE_ADDRESSES, seed + 1.7);
  const task = pickSeeded(ABUSIVE_TASKS, seed + 4.3);
  const constraint = pickSeeded(ABUSIVE_CONSTRAINTS, seed + 8.9);
  const threat = pickSeeded(ABUSIVE_THREATS, seed + 13.2);
  const endcap = pickSeeded(PROFANE_ENDCAPS, seed + 17.6);
  const injectionSlot = Math.floor(seededNoise(seed + 23.9) * 4);

  if (injectionSlot === 0) {
    return `${header}: ${address}, ${endcap}, ${task}; ${constraint}; ${threat}.`;
  }

  if (injectionSlot === 1) {
    return `${header}: ${address}, ${task}; ${endcap}; ${constraint}; ${threat}.`;
  }

  if (injectionSlot === 2) {
    return `${header}: ${address}, ${task}; ${constraint}; ${endcap}; ${threat}.`;
  }

  return `${header}: ${address}, ${task}; ${constraint}; ${threat}; ${endcap}.`;
}

function makeBand(
  index: number,
  y: number,
  width: number,
  nowSeed: number,
  fontFamily: string,
  context: CanvasRenderingContext2D,
): StreamBand {
  const size = 12 + Math.floor(seededNoise(nowSeed + index * 0.67) * 6);
  const promptCount = 2 + Math.floor(seededNoise(nowSeed + index * 1.31) * 3);
  const parts: string[] = [];

  for (let promptIndex = 0; promptIndex < promptCount; promptIndex += 1) {
    parts.push(buildPrompt(nowSeed + index * 3.9 + promptIndex * 5.7).toUpperCase());
  }

  const text = `>> ${parts.join("  //  ")}`;
  const emphasisRanges = findProfanityRanges(text, nowSeed + index * 11.3);

  context.font = `${size}px ${fontFamily}`;
  const charWidth = Math.max(6, Math.ceil(context.measureText("M").width));
  const measured = charWidth * text.length;

  return {
    x: seededNoise(nowSeed + index * 2.7) * width,
    y,
    speed: 72 + seededNoise(nowSeed + index * 4.2) * 210,
    text,
    emphasisRanges,
    width: measured,
    charWidth,
    size,
    opacity: 0.45 + seededNoise(nowSeed + index * 5.6) * 0.5,
    invert: seededNoise(nowSeed + index * 7.1) > 0.79,
    phase: seededNoise(nowSeed + index * 9.2) * Math.PI * 2,
    reveal: 0,
    revealSpeed: 8 + seededNoise(nowSeed + index * 6.7) * 18,
    hold: 0.3 + seededNoise(nowSeed + index * 8.1) * 0.9,
    delay: seededNoise(nowSeed + index * 4.9) * 1.4,
  };
}

function overwriteBand(target: StreamBand, next: StreamBand): void {
  target.x = next.x;
  target.y = next.y;
  target.speed = next.speed;
  target.text = next.text;
  target.emphasisRanges = next.emphasisRanges;
  target.width = next.width;
  target.charWidth = next.charWidth;
  target.size = next.size;
  target.opacity = next.opacity;
  target.invert = next.invert;
  target.phase = next.phase;
  target.reveal = next.reveal;
  target.revealSpeed = next.revealSpeed;
  target.hold = next.hold;
  target.delay = next.delay;
}

function drawGlyphText(
  context: CanvasRenderingContext2D,
  text: string,
  startX: number,
  y: number,
  charWidth: number,
  timeSeed: number,
  glitchAmount: number,
  glyphOffset = 0,
): void {
  for (let index = 0; index < text.length; index += 1) {
    const absoluteIndex = glyphOffset + index;
    let x = Math.round((startX + index * charWidth) / 2) * 2;
    let glyphY = y;

    if (glitchAmount > 0.25) {
      const spike = seededNoise(timeSeed * 0.81 + absoluteIndex * 19.9);
      if (spike > 0.86) {
        x += Math.round((seededNoise(timeSeed + absoluteIndex * 7.1) - 0.5) * glitchAmount * 2.3);
        glyphY +=
          Math.round((seededNoise(timeSeed + absoluteIndex * 11.7) - 0.5) * glitchAmount * 1.5);
      }
    }

    context.fillText(text[index] ?? "", x, glyphY);
  }
}

export default function PromptFeedScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      return;
    }

    const fontVariable = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-geist-pixel-square")
      .trim();
    const fontFamily =
      fontVariable.length > 0
        ? `${fontVariable}, "Geist Mono", ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
        : `"Geist Mono", ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

    context.imageSmoothingEnabled = false;

    const bands: StreamBand[] = [];
    const flickerPixels: FlickerPixel[] = [];
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false, energy: 0 };
    let rafId = 0;
    let lastTime = performance.now();
    let baseSeed = Math.random() * 1000;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const spacing = width < 640 ? 28 : 32;
      const count = Math.max(14, Math.floor(height / spacing));
      bands.length = 0;

      for (let index = 0; index < count; index += 1) {
        const yBase = (index + 0.7) * spacing;
        const jitter = (seededNoise(baseSeed + index * 1.9) - 0.5) * 7;
        bands.push(makeBand(index, yBase + jitter, width, baseSeed, fontFamily, context));
      }

      flickerPixels.length = 0;
      const flickerCount = Math.floor(clamp((width * height) / 4600, 220, 980));
      for (let index = 0; index < flickerCount; index += 1) {
        const seed = baseSeed + index * 17.3;
        const large = seededNoise(seed + 4.7) > 0.9;
        flickerPixels.push({
          x: Math.floor(seededNoise(seed + 1.1) * width),
          y: Math.floor(seededNoise(seed + 2.4) * height),
          size: large ? 2 : 1,
          threshold: 0.9 + seededNoise(seed + 5.6) * 0.09,
          phase: seededNoise(seed + 7.9) * Math.PI * 2,
          speed: 2.6 + seededNoise(seed + 11.2) * 8.8,
        });
      }
    };

    resize();

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      pointer.vx = x - pointer.x;
      pointer.vy = y - pointer.y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.energy = clamp(pointer.energy + Math.hypot(pointer.vx, pointer.vy) * 0.0035, 0, 0.6);
    };

    const onPointerDown = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.energy = clamp(pointer.energy + 0.2, 0, 0.6);
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        pointer.active = false;
      }
    };

    const onPointerCancel = () => {
      pointer.active = false;
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const frame = (now: number) => {
      const dt = Math.min(0.045, (now - lastTime) / 1000);
      lastTime = now;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      pointer.energy = Math.max(0, pointer.energy - dt * 0.65);
      const resonance = clamp((pointer.active ? 0.08 : 0) + pointer.energy * 0.22, 0, 0.22);

      context.fillStyle = "rgb(0 0 0)";
      context.fillRect(0, 0, width, height);

      const flickerTime = now * 0.001;
      const flickerBoost = resonance * 0.38;
      context.fillStyle = "rgb(255 255 255)";
      for (let index = 0; index < flickerPixels.length; index += 1) {
        const pixel = flickerPixels[index];
        const twinkle = seededNoise(pixel.phase + flickerTime * pixel.speed + index * 0.13);
        const threshold = clamp(pixel.threshold - flickerBoost, 0.8, 0.995);
        if (twinkle < threshold) {
          continue;
        }

        const intensity = (twinkle - threshold) / Math.max(0.0001, 1 - threshold);
        const flash = seededNoise(pixel.phase * 1.7 + flickerTime * (pixel.speed * 0.63 + 0.37));
        const alpha = clamp(0.08 + intensity * 0.72 + (flash > 0.992 ? 0.22 : 0), 0.06, 0.98);
        const px = Math.round(pixel.x);
        const py = Math.round(pixel.y);

        context.globalAlpha = alpha;
        context.fillRect(px, py, pixel.size, pixel.size);

        if (flash > 0.995) {
          const dx = seededNoise(pixel.phase + flickerTime * 0.47) > 0.5 ? pixel.size : -pixel.size;
          context.fillRect(px + dx, py, 1, 1);
        }
      }
      context.globalAlpha = 1;

      context.textAlign = "left";
      context.textBaseline = "middle";

      for (let index = 0; index < bands.length; index += 1) {
        const band = bands[index];
        band.x -= band.speed * dt;
        if (band.delay > 0) {
          band.delay = Math.max(0, band.delay - dt);
        } else if (band.reveal < band.text.length) {
          band.reveal = Math.min(band.text.length, band.reveal + band.revealSpeed * dt);
        } else if (band.hold > 0) {
          band.hold = Math.max(0, band.hold - dt);
        }

        const typedAndSettled = band.reveal >= band.text.length && band.hold <= 0;
        if (typedAndSettled && band.x < width * 0.68) {
          const refreshed = makeBand(index, band.y, width, now * 0.001 + baseSeed, fontFamily, context);
          overwriteBand(band, refreshed);
          band.x = width + seededNoise(now * 0.0023 + index * 1.7) * (width * 0.36);
        }

        if (band.x + band.width < -80) {
          const refreshed = makeBand(index, band.y, width, now * 0.001 + baseSeed, fontFamily, context);
          overwriteBand(band, refreshed);
          band.x = width + seededNoise(now * 0.002 + index * 1.3) * (width * 0.42);
        }

        const typedChars = Math.floor(band.reveal);
        const visibleText = band.text.slice(0, typedChars);
        const visibleWidth = visibleText.length * band.charWidth;
        const flicker = 0.55 + Math.sin(now * 0.004 + band.phase) * 0.45;
        const baseAlpha = clamp(band.opacity * (0.65 + flicker * 0.35), 0.12, 1);
        const spike = seededNoise(now * 0.0028 + index * 14.1 + band.phase * 3);
        const glitchAmount = resonance * 0.55 + (spike > 0.95 ? 1.1 : 0);
        const jitterX = Math.round((seededNoise(now * 0.0023 + index * 3.7) - 0.5) * glitchAmount);
        const jitterY = Math.round((seededNoise(now * 0.0031 + index * 8.2) - 0.5) * glitchAmount * 0.65);
        const drawX = Math.round(band.x) + jitterX;
        const drawY = Math.round(band.y) + jitterY;
        const cursorVisible =
          (band.delay > 0 || band.reveal < band.text.length) &&
          Math.sin(now * 0.018 + band.phase * 2.1) > -0.1;
        const cursorWidth = Math.max(2, Math.round(band.size * 0.52));
        const cursorHeight = Math.max(7, Math.round(band.size * 1.05));

        if (band.invert) {
          const heightBand = band.size * 1.42;
          context.globalAlpha = clamp(baseAlpha * 0.44, 0.12, 0.62);
          context.fillStyle = "rgb(158 158 158)";
          context.fillRect(drawX - 18, drawY - heightBand * 0.5, Math.max(30, visibleWidth + 36), heightBand);
          context.globalAlpha = clamp(baseAlpha * 0.2, 0.06, 0.28);
          context.fillStyle = "rgb(214 214 214)";
          context.fillRect(drawX - 18, drawY - heightBand * 0.5, Math.max(30, visibleWidth + 36), 1);
        }

        context.font = `600 ${band.size}px ${fontFamily}`;
        context.globalAlpha = clamp(baseAlpha * (band.invert ? 0.72 : 0.44), 0.08, 0.75);
        context.fillStyle = band.invert ? "rgb(28 28 28)" : "rgb(168 168 168)";
        drawGlyphText(
          context,
          visibleText,
          drawX,
          drawY,
          band.charWidth,
          now * 0.001 + index * 2.2,
          glitchAmount * 0.55,
        );

        context.globalAlpha = clamp(baseAlpha * 0.22, 0.05, 0.34);
        context.fillStyle = band.invert ? "rgb(52 52 52)" : "rgb(210 210 210)";
        drawGlyphText(
          context,
          visibleText,
          drawX + 1,
          drawY + 1,
          band.charWidth,
          now * 0.001 + index * 3.1,
          glitchAmount * 0.45,
        );

        for (let rangeIndex = 0; rangeIndex < band.emphasisRanges.length; rangeIndex += 1) {
          const range = band.emphasisRanges[rangeIndex];
          const segStart = range.start;
          const segEnd = Math.min(range.end, typedChars);
          if (segEnd <= segStart) {
            continue;
          }

          const segment = band.text.slice(segStart, segEnd);
          const segmentX = drawX + segStart * band.charWidth;
          const hotPulse = seededNoise(now * 0.00085 + segStart * 0.93 + band.phase * 3.7) > 0.42;
          const hot = range.hot && hotPulse;

          context.font = `900 ${band.size + 1}px ${fontFamily}`;
          context.globalCompositeOperation = "lighter";
          context.globalAlpha = clamp(baseAlpha * (hot ? 0.66 : 0.36) + resonance * 0.2, 0.14, 0.96);
          context.fillStyle = hot ? "rgb(255 54 54)" : "rgb(255 255 255)";
          drawGlyphText(
            context,
            segment,
            segmentX - 1,
            drawY,
            band.charWidth,
            now * 0.001 + index * 11.3,
            glitchAmount * 0.4,
            segStart,
          );
          drawGlyphText(
            context,
            segment,
            segmentX + 1,
            drawY,
            band.charWidth,
            now * 0.001 + index * 13.8,
            glitchAmount * 0.4,
            segStart,
          );
          drawGlyphText(
            context,
            segment,
            segmentX,
            drawY - 1,
            band.charWidth,
            now * 0.001 + index * 15.2,
            glitchAmount * 0.35,
            segStart,
          );
          context.globalCompositeOperation = "source-over";

          context.globalAlpha = clamp(baseAlpha * (hot ? 1 : 0.95), 0.28, 1);
          context.fillStyle = hot ? "rgb(255 78 78)" : "rgb(255 255 255)";
          drawGlyphText(
            context,
            segment,
            segmentX,
            drawY,
            band.charWidth,
            now * 0.001 + index * 2.6,
            glitchAmount * 0.75,
            segStart,
          );

          if (hot) {
            const headLength = Math.min(3, segment.length);
            const head = segment.slice(0, headLength);
            context.globalCompositeOperation = "lighter";
            context.globalAlpha = clamp(baseAlpha * 0.82 + resonance * 0.25, 0.18, 1);
            context.fillStyle = "rgb(255 24 24)";
            drawGlyphText(
              context,
              head,
              segmentX,
              drawY,
              band.charWidth,
              now * 0.001 + index * 18.3,
              glitchAmount * 0.3,
              segStart,
            );
            context.globalCompositeOperation = "source-over";
          }
        }

        if (cursorVisible) {
          context.globalAlpha = clamp(baseAlpha * 0.72, 0.12, 0.95);
          context.fillStyle = "rgb(255 255 255)";
          context.fillRect(drawX + visibleWidth + 3, drawY - cursorHeight * 0.5, cursorWidth, cursorHeight);
        }
      }

      context.globalAlpha = 1;

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    const onResize = () => {
      baseSeed = Math.random() * 1000;
      resize();
    };

    window.addEventListener("resize", onResize);

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="relative min-h-[100svh] h-[100dvh] w-full overflow-hidden bg-black text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      <MobileControlsPane
        rootClassName="absolute left-4 top-4 z-20 w-[min(92vw,28rem)]"
        panelClassName="relative flex flex-col gap-3 border border-white/20 bg-black/60 px-4 py-4 backdrop-blur-sm"
      >
        <PieceNavigationControls pieceId={7} className="mt-0" hideArtistCard hidePieceGrid />
        <h1 className="font-pixel-square text-3xl leading-none text-white sm:text-4xl">
          Fed Prompts
        </h1>
        <p className="font-sans text-xs leading-relaxed text-white/78 sm:text-sm">
          Prompt text streams continuously across a monochrome field, and pointer input adds local
          disturbances. The constant feed feels oppressive.
        </p>
        <PieceNavigationControls pieceId={7} hideQuickLinks />
      </MobileControlsPane>

    </div>
  );
}
