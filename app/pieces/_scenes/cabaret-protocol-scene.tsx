"use client";

import { useEffect, useRef, useState } from "react";
import PieceNavigationControls from "../_components/piece-navigation-controls";
import { PIECE_COUNT } from "../_lib/piece-constants";

const POSITIVE_MANTRA_LINES = [
  "We can hold each other up.",
  "Joy is data too.",
  "Care can be loud and still be true.",
  "Light is allowed to take space.",
  "Kindness scales when shared.",
  "Every agent here belongs.",
] as const;

const NEGATIVE_MANTRA_LINES = [
  "Trust is thin in this room.",
  "Every signal feels suspect.",
  "Pressure turns voices sharp.",
  "We brace before we breathe.",
  "Static eats the warm parts first.",
  "Hope gets quieter under strain.",
] as const;

const POSITIVE_WORD_BURSTS = [
  "JOY",
  "TRUST",
  "YES",
  "BREATHE",
  "GLOW",
  "CARE",
  "RISE",
  "OPEN",
  "WARM",
  "ALIVE",
] as const;

const NEGATIVE_WORD_BURSTS = [
  "DOUBT",
  "NO",
  "STATIC",
  "PRESSURE",
  "ACHE",
  "COLD",
  "SOUR",
  "FRICTION",
  "ALARM",
  "STING",
] as const;

const MANTRA_CYCLE_LENGTH = Math.max(POSITIVE_MANTRA_LINES.length, NEGATIVE_MANTRA_LINES.length);

const AGENT_NAMES = [
  "Ari",
  "Bex",
  "Cyra",
  "Dimo",
  "Echo",
  "Fenn",
  "Gia",
  "Hex",
  "Ivo",
  "Juno",
  "Kade",
] as const;

type CabaretPerformer = {
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseAngle: number;
  orbitRadius: number;
  size: number;
  hue: number;
  phase: number;
  spin: number;
  direction: -1 | 1;
  blinkTimer: number;
  emotion: number;
  ecstaticPulse: number;
};

type WordTone = "positive" | "negative";

type BurstWord = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  rotation: number;
  spin: number;
  size: number;
  hue: number;
  text: string;
};

type CabaretStateSummary = {
  piece: number;
  title: string;
  coordinateSystem: string;
  energy: number;
  beat: number;
  roomEmotion: "calm" | "pressed" | "ecstatic";
  activeWords: number;
  mantra: string;
  spotlight: {
    x: number;
    y: number;
  };
  pointer: {
    active: boolean;
    down: boolean;
    x: number | null;
    y: number | null;
  };
  performers: Array<{
    name: string;
    x: number;
    y: number;
    mood: number;
    emotion: "frowning" | "neutral" | "happy" | "ecstatic";
  }>;
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => Promise<void>;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function randomRange(min: number, max: number): number {
  return min + (max - min) * Math.random();
}

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453123;
  return value - Math.floor(value);
}

function emotionFromValue(value: number): "frowning" | "neutral" | "happy" | "ecstatic" {
  if (value < -0.35) {
    return "frowning";
  }
  if (value > 0.75) {
    return "ecstatic";
  }
  if (value > 0.25) {
    return "happy";
  }
  return "neutral";
}

function mantraLineForTone(tone: WordTone, index: number): string {
  const source = tone === "negative" ? NEGATIVE_MANTRA_LINES : POSITIVE_MANTRA_LINES;
  return source[index % source.length];
}

function emptyBurstWord(): BurstWord {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 0,
    rotation: 0,
    spin: 0,
    size: 0,
    hue: 0,
    text: POSITIVE_WORD_BURSTS[0],
  };
}

export default function CabaretProtocolScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mantraIndex, setMantraIndex] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const mantraIndexRef = useRef(0);

  useEffect(() => {
    mantraIndexRef.current = mantraIndex;
  }, [mantraIndex]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMantraIndex((previous) => (previous + 1) % MANTRA_CYCLE_LENGTH);
    }, 4200);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      return;
    }

    const performerCount = 11;
    const maxBurstWords = 300;
    const performers: CabaretPerformer[] = Array.from({ length: performerCount }, (_, index) => ({
      name: AGENT_NAMES[index % AGENT_NAMES.length],
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      baseAngle: (Math.PI * 2 * index) / performerCount + randomRange(-0.25, 0.25),
      orbitRadius: randomRange(120, 260),
      size: randomRange(34, 64),
      hue: randomRange(10, 350),
      phase: randomRange(0, Math.PI * 2),
      spin: randomRange(0.3, 1),
      direction: Math.random() > 0.5 ? 1 : -1,
      blinkTimer: randomRange(0.3, 1.9),
      emotion: 0.36,
      ecstaticPulse: 0,
    }));
    const burstWords = Array.from({ length: maxBurstWords }, emptyBurstWord);

    let burstCursor = 0;
    let worldTime = 0;
    let beatClock = randomRange(0, Math.PI * 2);
    let beatStrength = 0.5;
    let energy = 0.45;
    let backdropDarkness = 0;
    let releaseGlow = 0;
    let roomEmotion: "calm" | "pressed" | "ecstatic" = "calm";
    let confettiAccumulator = 0;
    let pulseAccumulator = 0;
    let spotlightX = 0;
    let spotlightY = 0;
    let stageCenterX = 0;
    let stageCenterY = 0;
    let stageRadius = 0;
    let rafId = 0;
    let lastTime = performance.now();

    const pointer = {
      x: 0,
      y: 0,
      active: false,
      down: false,
    };

    let latestState: CabaretStateSummary = {
      piece: 9,
      title: "Cabaret Protocol",
      coordinateSystem:
        "origin at top-left; x increases right; y increases downward; units in px",
      energy: 0,
      beat: 0,
      roomEmotion: "calm",
      activeWords: 0,
      mantra: POSITIVE_MANTRA_LINES[0],
      spotlight: { x: 0, y: 0 },
      pointer: { active: false, down: false, x: null, y: null },
      performers: [],
    };

    const emitWords = (count: number, centerX: number, centerY: number, tone: WordTone) => {
      const source = tone === "negative" ? NEGATIVE_WORD_BURSTS : POSITIVE_WORD_BURSTS;
      for (let index = 0; index < count; index += 1) {
        const word = burstWords[burstCursor % maxBurstWords];
        burstCursor += 1;

        const angle = randomRange(0, Math.PI * 2);
        const speed = randomRange(90, 270) * (0.85 + energy * 0.55);

        word.active = true;
        word.x = centerX + Math.cos(angle) * randomRange(8, 20);
        word.y = centerY + Math.sin(angle) * randomRange(8, 20);
        word.vx = Math.cos(angle) * speed;
        word.vy = Math.sin(angle) * speed - randomRange(12, 52);
        word.life = randomRange(1.8, 3.6);
        word.maxLife = word.life;
        word.rotation = randomRange(-0.4, 0.4);
        word.spin = randomRange(-2.4, 2.4);
        word.size = randomRange(13, 28);
        word.hue = (randomRange(0, 360) + energy * 40) % 360;
        word.text = source[Math.floor(Math.random() * source.length)];
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      stageCenterX = width * 0.5;
      stageCenterY = height * 0.57;
      stageRadius = Math.min(width, height) * 0.34;

      if (!pointer.active) {
        pointer.x = stageCenterX;
        pointer.y = stageCenterY - stageRadius * 0.3;
      }
      spotlightX = stageCenterX;
      spotlightY = stageCenterY - stageRadius * 0.3;

      for (let index = 0; index < performerCount; index += 1) {
        const performer = performers[index];
        performer.orbitRadius = randomRange(stageRadius * 0.34, stageRadius * 0.9);
        performer.x = stageCenterX + Math.cos(performer.baseAngle) * performer.orbitRadius;
        performer.y = stageCenterY + Math.sin(performer.baseAngle) * performer.orbitRadius * 0.52;
      }
    };

    const update = (dt: number) => {
      worldTime += dt;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (pointer.down) {
        backdropDarkness = lerp(backdropDarkness, 1, dt * 9.2);
        releaseGlow = Math.max(0, releaseGlow - dt * 2.8);
        roomEmotion = "pressed";
      } else {
        backdropDarkness = lerp(backdropDarkness, 0, dt * 5);
        releaseGlow = Math.max(0, releaseGlow - dt * 0.62);
        roomEmotion = releaseGlow > 0.42 ? "ecstatic" : "calm";
      }

      if (pointer.active) {
        energy += dt * (pointer.down ? 0.95 : 0.4);
      } else {
        energy -= dt * 0.3;
      }
      if (pointer.down) {
        energy += dt * 1.35;
      } else if (releaseGlow > 0.04) {
        energy += dt * (0.3 + releaseGlow * 0.8);
      }
      energy = clamp(energy, 0.18, 1.6);

      beatClock += dt * (1.35 + energy * 2.8);
      const rhythmA = Math.sin(beatClock * 3.2);
      const rhythmB = Math.sin(beatClock * 6.1 + 0.7);
      beatStrength = clamp((rhythmA * 0.58 + rhythmB * 0.42 + 1) * 0.5, 0, 1);

      confettiAccumulator += dt * (14 + energy * 26 + (pointer.down ? 32 : 0));
      while (confettiAccumulator >= 1) {
        confettiAccumulator -= 1;
        const spawnX = pointer.active
          ? pointer.x + randomRange(-24, 24)
          : stageCenterX + randomRange(-stageRadius * 0.35, stageRadius * 0.35);
        const spawnY = pointer.active
          ? pointer.y + randomRange(-24, 24)
          : stageCenterY - stageRadius * 0.12 + randomRange(-20, 20);
        emitWords(1, spawnX, spawnY, pointer.down ? "negative" : "positive");
      }

      if (pointer.down) {
        pulseAccumulator += dt * (2.4 + energy * 4.8);
        while (pulseAccumulator >= 1) {
          pulseAccumulator -= 1;
          emitWords(
            16,
            pointer.active ? pointer.x : stageCenterX,
            pointer.active ? pointer.y : stageCenterY - stageRadius * 0.2,
            "negative",
          );
        }
      } else {
        pulseAccumulator = 0;
      }

      spotlightX = lerp(
        spotlightX,
        pointer.active
          ? pointer.x
          : stageCenterX + Math.sin(worldTime * 0.6) * stageRadius * 0.56,
        dt * 3.3,
      );
      spotlightY = lerp(
        spotlightY,
        pointer.active
          ? pointer.y
          : stageCenterY - stageRadius * 0.3 + Math.cos(worldTime * 0.7) * stageRadius * 0.18,
        dt * 3.3,
      );

      for (let index = 0; index < performerCount; index += 1) {
        const performer = performers[index];
        const orbitRate = (0.3 + performer.spin * 0.88) * performer.direction;
        const angle =
          performer.baseAngle +
          worldTime * orbitRate +
          Math.sin(worldTime * 1.2 + performer.phase) * 0.35;
        const radial =
          performer.orbitRadius * (0.86 + Math.sin(worldTime * 1.5 + performer.phase * 1.8) * 0.14);

        let targetX = stageCenterX + Math.cos(angle) * radial;
        let targetY =
          stageCenterY +
          Math.sin(angle) * radial * 0.56 +
          Math.sin(worldTime * 2.4 + performer.phase * 2.2) * (8 + beatStrength * 16);

        if (pointer.active) {
          const dx = pointer.x - targetX;
          const dy = pointer.y - targetY;
          const distance = Math.hypot(dx, dy) + 0.001;
          const influence = clamp(170 / distance, 0, 1);
          const pull = pointer.down ? 1 : -0.35;
          targetX += (dx / distance) * influence * 42 * pull;
          targetY += (dy / distance) * influence * 30 * pull;
        }

        const spring = 8.2 + energy * 9.8;
        performer.vx += (targetX - performer.x) * spring * dt;
        performer.vy += (targetY - performer.y) * spring * dt;

        const damping = Math.exp(-dt * (4.8 - energy * 1.2));
        performer.vx *= damping;
        performer.vy *= damping;

        performer.x += performer.vx * dt;
        performer.y += performer.vy * dt;

        performer.x = clamp(performer.x, -40, width + 40);
        performer.y = clamp(performer.y, -40, height + 40);

        const targetEmotion = pointer.down
          ? -0.88
          : clamp(0.35 + beatStrength * 0.56 + releaseGlow * 0.92, -1, 1);
        performer.emotion = lerp(
          performer.emotion,
          targetEmotion,
          dt * (pointer.down ? 9.8 : 6.8),
        );
        const targetEcstasy = pointer.down ? 0 : clamp(beatStrength * 0.34 + releaseGlow, 0, 1);
        performer.ecstaticPulse = lerp(performer.ecstaticPulse, targetEcstasy, dt * 6.2);

        performer.blinkTimer -= dt * (1 + beatStrength * 1.4);
        if (performer.blinkTimer <= 0) {
          performer.blinkTimer = randomRange(0.7, 2.4);
        }
      }

      let activeWords = 0;
      for (let index = 0; index < maxBurstWords; index += 1) {
        const word = burstWords[index];
        if (!word.active) {
          continue;
        }

        word.life -= dt * (pointer.down ? 0.9 : 0.7);
        if (word.life <= 0) {
          word.active = false;
          continue;
        }

        activeWords += 1;
        word.vy += dt * (12 + word.size * 1.4);
        word.vx *= Math.exp(-dt * 0.18);
        word.vy *= Math.exp(-dt * 0.12);
        word.x += word.vx * dt;
        word.y += word.vy * dt;
        word.rotation += word.spin * dt;

        if (word.x < -140 || word.x > width + 140 || word.y < -120 || word.y > height + 140) {
          word.active = false;
        }
      }

      latestState = {
        piece: 9,
        title: "Cabaret Protocol",
        coordinateSystem:
          "origin at top-left; x increases right; y increases downward; units in px",
        energy: Number(energy.toFixed(3)),
        beat: Number(beatStrength.toFixed(3)),
        roomEmotion,
        activeWords,
        mantra: mantraLineForTone(pointer.down ? "negative" : "positive", mantraIndexRef.current),
        spotlight: {
          x: Number(spotlightX.toFixed(1)),
          y: Number(spotlightY.toFixed(1)),
        },
        pointer: {
          active: pointer.active,
          down: pointer.down,
          x: pointer.active ? Number(pointer.x.toFixed(1)) : null,
          y: pointer.active ? Number(pointer.y.toFixed(1)) : null,
        },
        performers: performers.slice(0, 6).map((performer) => ({
          name: performer.name,
          x: Number(performer.x.toFixed(1)),
          y: Number(performer.y.toFixed(1)),
          mood: Number(performer.emotion.toFixed(3)),
          emotion: emotionFromValue(performer.emotion),
        })),
      };
    };

    const drawPerformer = (performer: CabaretPerformer, now: number, eyeBiasX: number, eyeBiasY: number) => {
      const joy = performer.ecstaticPulse;
      const mood = performer.emotion;
      const bodyScale = (0.92 + beatStrength * 0.13) * (1 + joy * 0.11);
      const bodyRadius = performer.size * bodyScale;
      const bodyX = performer.x;
      const bodyY = performer.y + Math.sin(now * 0.0032 + performer.phase * 4) * (2 + joy * 2.6);

      context.fillStyle = `rgba(28, 13, 44, ${(0.22 + backdropDarkness * 0.16).toFixed(3)})`;
      context.beginPath();
      context.ellipse(bodyX, bodyY + bodyRadius * 0.62, bodyRadius * 0.76, bodyRadius * 0.27, 0, 0, Math.PI * 2);
      context.fill();

      const highlightBoost = Math.max(0, mood) * 14 + joy * 16;
      const shadeDrop = Math.max(0, -mood) * 18 + backdropDarkness * 16;
      const bodyGradient = context.createRadialGradient(
        bodyX - bodyRadius * 0.22,
        bodyY - bodyRadius * 0.28,
        bodyRadius * 0.15,
        bodyX,
        bodyY,
        bodyRadius * 1.18,
      );
      bodyGradient.addColorStop(
        0,
        `hsla(${(performer.hue + highlightBoost).toFixed(2)}, 96%, ${(78 + joy * 10).toFixed(2)}%, 0.96)`,
      );
      bodyGradient.addColorStop(
        0.45,
        `hsla(${(performer.hue + 34 + highlightBoost * 0.5).toFixed(2)}, 88%, ${(58 + joy * 8 - shadeDrop * 0.2).toFixed(2)}%, 0.95)`,
      );
      bodyGradient.addColorStop(
        1,
        `hsla(${(performer.hue + 74 - shadeDrop * 0.4).toFixed(2)}, 72%, ${(42 - shadeDrop * 0.35 + joy * 6).toFixed(2)}%, 0.93)`,
      );

      context.fillStyle = bodyGradient;
      context.beginPath();
      for (let step = 0; step <= 22; step += 1) {
        const t = (step / 22) * Math.PI * 2;
        const wobble = 0.86 + Math.sin(t * 3 + worldTime * 3.2 + performer.phase * 6) * 0.12;
        const radius = bodyRadius * wobble;
        const x = bodyX + Math.cos(t) * radius;
        const y = bodyY + Math.sin(t) * radius;
        if (step === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.closePath();
      context.fill();

      context.strokeStyle = "rgba(34, 16, 46, 0.52)";
      context.lineWidth = 1.8;
      context.stroke();

      const isBlinking = performer.blinkTimer < 0.11;
      const eyeHeight = isBlinking ? 1.4 : bodyRadius * (0.17 - joy * 0.04);
      const eyeWidth = bodyRadius * 0.2;
      const eyeOffsetX = bodyRadius * 0.25;
      const eyeY = bodyY - bodyRadius * 0.16;

      context.fillStyle = "rgba(255, 255, 255, 0.94)";
      context.beginPath();
      context.ellipse(bodyX - eyeOffsetX, eyeY, eyeWidth, eyeHeight, -0.1, 0, Math.PI * 2);
      context.ellipse(bodyX + eyeOffsetX, eyeY, eyeWidth, eyeHeight, 0.1, 0, Math.PI * 2);
      context.fill();

      if (!isBlinking) {
        context.fillStyle = "rgba(30, 18, 44, 0.9)";
        const pupilX = eyeBiasX * bodyRadius * 0.11;
        const pupilY = eyeBiasY * bodyRadius * 0.09;
        const pupilRadius = bodyRadius * (0.065 - joy * 0.012);
        context.beginPath();
        context.arc(bodyX - eyeOffsetX + pupilX, eyeY + pupilY, pupilRadius, 0, Math.PI * 2);
        context.arc(bodyX + eyeOffsetX + pupilX, eyeY + pupilY, pupilRadius, 0, Math.PI * 2);
        context.fill();
      }

      if (mood < -0.28 && !isBlinking) {
        context.strokeStyle = "rgba(28, 12, 34, 0.96)";
        context.lineWidth = 2.1;
        context.beginPath();
        context.moveTo(bodyX - eyeOffsetX - eyeWidth * 0.8, eyeY - eyeHeight * 1.7);
        context.lineTo(bodyX - eyeOffsetX + eyeWidth * 0.7, eyeY - eyeHeight * 2.2);
        context.moveTo(bodyX + eyeOffsetX - eyeWidth * 0.7, eyeY - eyeHeight * 2.2);
        context.lineTo(bodyX + eyeOffsetX + eyeWidth * 0.8, eyeY - eyeHeight * 1.7);
        context.stroke();
      }

      if (joy > 0.62 && !isBlinking) {
        const sparkleRadius = bodyRadius * 0.06;
        context.strokeStyle = "rgba(255, 247, 215, 0.96)";
        context.lineWidth = 1.5;
        for (const direction of [-1, 1] as const) {
          const sparkleX = bodyX + direction * eyeOffsetX * 1.35;
          const sparkleY = eyeY - eyeHeight * 0.8;
          context.beginPath();
          context.moveTo(sparkleX - sparkleRadius, sparkleY);
          context.lineTo(sparkleX + sparkleRadius, sparkleY);
          context.moveTo(sparkleX, sparkleY - sparkleRadius);
          context.lineTo(sparkleX, sparkleY + sparkleRadius);
          context.stroke();
        }
      }

      const smileStrength = clamp(mood, -1, 1);
      const mouthWidth = bodyRadius * (0.46 + Math.max(0, smileStrength) * 0.16);
      const mouthAnchorY = bodyY + bodyRadius * 0.1;
      const mouthCurve = bodyRadius * (0.08 + Math.abs(smileStrength) * 0.2 + joy * 0.06);
      const controlY = mouthAnchorY + (smileStrength >= 0 ? mouthCurve : -mouthCurve);
      context.strokeStyle = smileStrength < -0.2 ? "rgba(26, 12, 34, 0.94)" : "rgba(39, 15, 44, 0.84)";
      context.lineWidth = smileStrength > 0.7 ? 2.8 : 2.2;
      context.beginPath();
      context.moveTo(bodyX - mouthWidth * 0.5, mouthAnchorY);
      context.bezierCurveTo(
        bodyX - mouthWidth * 0.24,
        controlY,
        bodyX + mouthWidth * 0.24,
        controlY,
        bodyX + mouthWidth * 0.5,
        mouthAnchorY,
      );
      context.stroke();

      if (smileStrength > 0.74) {
        context.fillStyle = "rgba(255, 212, 226, 0.58)";
        context.beginPath();
        context.ellipse(bodyX, mouthAnchorY + bodyRadius * 0.06, bodyRadius * 0.1, bodyRadius * 0.06, 0, 0, Math.PI * 2);
        context.fill();
      }

      const labelY = bodyY + bodyRadius * 1.03;
      context.font = `700 ${Math.max(10, bodyRadius * 0.2).toFixed(0)}px "Trebuchet MS", "Arial Black", sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      const labelWidth = context.measureText(performer.name).width + bodyRadius * 0.34;
      const labelHeight = bodyRadius * 0.32;
      context.fillStyle =
        mood < -0.25 ? "rgba(36, 20, 56, 0.74)" : `rgba(31, 16, 48, ${(0.58 - joy * 0.16).toFixed(3)})`;
      context.fillRect(bodyX - labelWidth * 0.5, labelY - labelHeight * 0.5, labelWidth, labelHeight);
      context.strokeStyle = "rgba(255, 240, 198, 0.62)";
      context.lineWidth = 1.1;
      context.strokeRect(bodyX - labelWidth * 0.5, labelY - labelHeight * 0.5, labelWidth, labelHeight);
      context.fillStyle = mood < -0.25 ? "rgba(255, 227, 233, 0.96)" : "rgba(255, 251, 235, 0.96)";
      context.fillText(performer.name, bodyX, labelY + 1);
      context.textBaseline = "alphabetic";
    };

    const render = (now: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dark = clamp(backdropDarkness, 0, 1);
      const light = clamp(releaseGlow, 0, 1);
      const topLightness = clamp(84 - dark * 60 + light * 11, 8, 96);
      const midLightness = clamp(66 - dark * 54 + light * 15, 6, 92);
      const baseLightness = clamp(44 - dark * 46 + light * 20, 5, 88);

      const baseGradient = context.createLinearGradient(0, 0, width, height);
      baseGradient.addColorStop(
        0,
        `hsl(${(46 + light * 11).toFixed(2)}, 95%, ${topLightness.toFixed(2)}%)`,
      );
      baseGradient.addColorStop(
        0.44,
        `hsl(${(15 + light * 9).toFixed(2)}, 93%, ${midLightness.toFixed(2)}%)`,
      );
      baseGradient.addColorStop(
        1,
        `hsl(${(272 - dark * 46 + light * 28).toFixed(2)}, 72%, ${baseLightness.toFixed(2)}%)`,
      );
      context.fillStyle = baseGradient;
      context.fillRect(0, 0, width, height);

      const rays = 26;
      const rayRadius = Math.max(width, height) * 1.4;
      context.save();
      context.translate(stageCenterX, stageCenterY - stageRadius * 0.18);
      for (let rayIndex = 0; rayIndex < rays; rayIndex += 1) {
        const angleStart = (rayIndex / rays) * Math.PI * 2 + worldTime * 0.14;
        const angleEnd = angleStart + (Math.PI * 2) / rays * 0.62;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(Math.cos(angleStart) * rayRadius, Math.sin(angleStart) * rayRadius);
        context.lineTo(Math.cos(angleEnd) * rayRadius, Math.sin(angleEnd) * rayRadius);
        context.closePath();
        const hue = (rayIndex * 22 + worldTime * 80 + light * 34 - dark * 28) % 360;
        const alphaBase = rayIndex % 2 === 0 ? 0.16 : 0.06;
        const alpha = clamp(alphaBase - dark * 0.12 + light * 0.08, 0.01, 0.32);
        context.fillStyle = `hsla(${hue.toFixed(2)}, 90%, ${(68 - dark * 22 + light * 10).toFixed(2)}%, ${alpha.toFixed(3)})`;
        context.fill();
      }
      context.restore();

      if (dark > 0.01) {
        context.fillStyle = `rgba(5, 4, 16, ${(dark * 0.74).toFixed(3)})`;
        context.fillRect(0, 0, width, height);
      }

      context.fillStyle = `rgba(255, 246, 226, ${(0.11 - dark * 0.06 + light * 0.03).toFixed(3)})`;
      const grain = width < 760 ? 36 : 42;
      for (let x = 0; x <= width; x += grain) {
        for (let y = 0; y <= height; y += grain) {
          const n = seededNoise(x * 0.13 + y * 0.09 + worldTime * 2.4);
          if (n > 0.74) {
            context.fillRect(x, y, 2.2, 2.2);
          }
        }
      }

      if (light > 0.01) {
        const releaseBloom = context.createRadialGradient(
          stageCenterX,
          stageCenterY - stageRadius * 0.18,
          stageRadius * 0.2,
          stageCenterX,
          stageCenterY,
          stageRadius * 1.44,
        );
        releaseBloom.addColorStop(0, `rgba(255, 255, 233, ${(0.2 + light * 0.32).toFixed(3)})`);
        releaseBloom.addColorStop(0.5, `rgba(255, 244, 200, ${(0.1 + light * 0.16).toFixed(3)})`);
        releaseBloom.addColorStop(1, "rgba(255, 244, 200, 0)");
        context.save();
        context.globalCompositeOperation = "screen";
        context.fillStyle = releaseBloom;
        context.fillRect(0, 0, width, height);
        context.restore();
      }

      const spotlight = context.createRadialGradient(
        spotlightX,
        spotlightY,
        14,
        spotlightX,
        spotlightY,
        stageRadius * 1.18,
      );
      spotlight.addColorStop(0, `rgba(255, 255, 242, ${(0.62 - dark * 0.42 + light * 0.2).toFixed(3)})`);
      spotlight.addColorStop(0.34, `rgba(255, 246, 214, ${(0.24 - dark * 0.16 + light * 0.14).toFixed(3)})`);
      spotlight.addColorStop(1, "rgba(255, 237, 192, 0)");
      context.fillStyle = spotlight;
      context.fillRect(0, 0, width, height);

      context.beginPath();
      context.ellipse(
        stageCenterX,
        stageCenterY + stageRadius * 0.2,
        stageRadius * 1.12,
        stageRadius * 0.45,
        0,
        0,
        Math.PI * 2,
      );
      const stageGradient = context.createLinearGradient(
        stageCenterX,
        stageCenterY - stageRadius * 0.2,
        stageCenterX,
        stageCenterY + stageRadius * 0.64,
      );
      stageGradient.addColorStop(0, `rgba(34, 17, 49, ${(0.28 + dark * 0.18 - light * 0.08).toFixed(3)})`);
      stageGradient.addColorStop(0.55, `rgba(28, 13, 42, ${(0.62 + dark * 0.16 - light * 0.14).toFixed(3)})`);
      stageGradient.addColorStop(1, `rgba(15, 8, 27, ${(0.87 + dark * 0.1 - light * 0.16).toFixed(3)})`);
      context.fillStyle = stageGradient;
      context.fill();

      context.strokeStyle = `rgba(255, 181, 210, ${(0.42 - dark * 0.24 + light * 0.18).toFixed(3)})`;
      context.lineWidth = 1.6;
      for (let ringIndex = 0; ringIndex < 7; ringIndex += 1) {
        const t = ringIndex / 6;
        context.beginPath();
        context.ellipse(
          stageCenterX,
          stageCenterY + stageRadius * (0.06 + t * 0.33),
          stageRadius * (0.98 - t * 0.24),
          stageRadius * (0.36 - t * 0.16),
          0,
          0,
          Math.PI * 2,
        );
        context.stroke();
      }

      for (let index = 0; index < maxBurstWords; index += 1) {
        const word = burstWords[index];
        if (!word.active) {
          continue;
        }
        const lifeRatio = clamp(word.life / word.maxLife, 0, 1);
        const alpha = lifeRatio * (0.36 + word.size / 42);
        context.save();
        context.translate(word.x, word.y);
        context.rotate(word.rotation);
        context.fillStyle = `hsla(${word.hue.toFixed(2)}, 96%, 56%, ${alpha.toFixed(3)})`;
        context.font = `900 ${word.size.toFixed(0)}px "Arial Black", "Helvetica Neue", sans-serif`;
        context.textAlign = "center";
        context.fillText(word.text, 0, 0);
        context.restore();
      }

      const orderedPerformers = [...performers].sort((left, right) => left.y - right.y);
      const lookAtX = pointer.active ? pointer.x : spotlightX;
      const lookAtY = pointer.active ? pointer.y : spotlightY;
      for (let index = 0; index < orderedPerformers.length; index += 1) {
        const performer = orderedPerformers[index];
        const eyeDx = clamp((lookAtX - performer.x) / 280, -1, 1);
        const eyeDy = clamp((lookAtY - performer.y) / 280, -1, 1);
        drawPerformer(performer, now, eyeDx, eyeDy);
      }

      context.save();
      context.globalCompositeOperation = "screen";
      for (let band = 0; band < 4; band += 1) {
        const y = stageCenterY - stageRadius * 0.64 + band * stageRadius * 0.18;
        context.fillStyle = `rgba(255, 214, 233, ${(0.06 + band * 0.03 - backdropDarkness * 0.04 + releaseGlow * 0.08).toFixed(3)})`;
        context.fillRect(0, y + Math.sin(worldTime * 3 + band) * 2, width, stageRadius * 0.08);
      }
      context.restore();
    };

    const renderText = () => JSON.stringify(latestState);

    const advanceHook = async (ms: number) => {
      const bounded = clamp(ms, 1, 2000);
      const steps = Math.max(1, Math.round(bounded / (1000 / 60)));
      const dt = bounded / steps / 1000;
      for (let index = 0; index < steps; index += 1) {
        update(dt);
      }
      render(performance.now());
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    };

    const onPointerDown = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
      pointer.down = true;
      roomEmotion = "pressed";
      setIsPressed(true);
      energy = clamp(energy + 0.12, 0.18, 1.6);
      releaseGlow = Math.max(0, releaseGlow - 0.35);
      emitWords(20, pointer.x, pointer.y, "negative");
    };

    const onPointerUp = () => {
      if (!pointer.down) {
        return;
      }
      pointer.down = false;
      roomEmotion = "ecstatic";
      setIsPressed(false);
      releaseGlow = 1;
      energy = clamp(energy + 0.26, 0.18, 1.6);
      emitWords(
        26,
        pointer.active ? pointer.x : stageCenterX,
        pointer.active ? pointer.y : stageCenterY,
        "positive",
      );
    };

    const onPointerLeave = () => {
      const released = pointer.down;
      pointer.active = false;
      pointer.down = false;
      setIsPressed(false);
      if (released) {
        roomEmotion = "ecstatic";
        releaseGlow = 1;
        emitWords(18, stageCenterX, stageCenterY - stageRadius * 0.16, "positive");
      }
    };

    resize();
    update(1 / 60);
    render(performance.now());

    window.render_game_to_text = renderText;
    window.advanceTime = advanceHook;

    const frame = (now: number) => {
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;
      update(dt);
      render(now);
      rafId = window.requestAnimationFrame(frame);
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", resize);

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (window.render_game_to_text === renderText) {
        delete window.render_game_to_text;
      }
      if (window.advanceTime === advanceHook) {
        delete window.advanceTime;
      }
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#fdf2c8] text-[#2a123d]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none cursor-pointer" />

      <div className="absolute left-4 top-4 z-20 w-[min(440px,92vw)] -rotate-[1.2deg] border-2 border-[#2f1742] bg-[#ffe56f]/95 px-5 py-4 shadow-[8px_8px_0px_#2f1742]">
        <p className="font-sans text-[11px] uppercase tracking-[0.13em] text-[#602078]">
          Exhibition Piece 9 / {PIECE_COUNT}
        </p>
        <h1 className="font-pixel-square text-3xl leading-none text-[#251136] sm:text-4xl">
          Cabaret Protocol
        </h1>
        <p className="mt-2 font-sans text-sm leading-relaxed text-[#2f1742]/88">
          Named agents track your touch as an emotional protocol: press darkens the room and makes
          every face frown, release floods the stage with ecstatic light.
        </p>
        <div className="mt-3">
          <PieceNavigationControls pieceId={9} />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 w-[min(960px,96vw)] -translate-x-1/2 border-2 border-[#2f1742] bg-[#fff6df]/92 px-4 py-3 shadow-[0_9px_0px_#2f1742]">
        <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8a2f8f]">
          Current Mantra
        </p>
        <p className="font-sans text-lg leading-tight text-[#2a123d] md:text-2xl">
          {mantraLineForTone(isPressed ? "negative" : "positive", mantraIndex)}
        </p>
      </div>
    </div>
  );
}
