"use client";

import { useEffect, useRef } from "react";
import PieceNavigationControls from "../_components/piece-navigation-controls";
import { PIECE_COUNT } from "../_lib/piece-constants";

type CloudNode = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  weight: number;
};

type CloudRibbon = {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  width: number;
  weight: number;
  curve: number;
  phase: number;
  speed: number;
};

type CloudFold = {
  angle: number;
  frequency: number;
  amplitude: number;
  phase: number;
  speed: number;
};

type CloudState = {
  nodes: CloudNode[];
  ribbons: CloudRibbon[];
  folds: CloudFold[];
  symmetry: number;
  axisX: number;
  eyeHint: number;
  eyeY: number;
  eyeSeparation: number;
  eyeRadius: number;
  mouthY: number;
  mouthWidth: number;
  mouthArc: number;
  driftX: number;
  driftY: number;
  scale: number;
  duration: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function smoothstep01(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function getRandomUint32(): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bucket = new Uint32Array(1);
    crypto.getRandomValues(bucket);
    return bucket[0] || 1;
  }

  return ((Math.random() * 4294967295) >>> 0) || 1;
}

function randomRange(rng: () => number, min: number, max: number): number {
  return min + (max - min) * rng();
}

function createCloudState(seed: number): CloudState {
  const rng = createRng(seed);

  const nodeCount = 5 + Math.floor(rng() * 7);
  const ribbonCount = 2 + Math.floor(rng() * 4);
  const foldCount = 2 + Math.floor(rng() * 3);

  const nodes: CloudNode[] = [];
  for (let index = 0; index < nodeCount; index += 1) {
    nodes.push({
      x: randomRange(rng, -0.95, 0.95),
      y: randomRange(rng, -0.86, 0.86),
      rx: randomRange(rng, 0.16, 0.48),
      ry: randomRange(rng, 0.14, 0.44),
      weight: rng() > 0.24 ? randomRange(rng, 0.7, 1.5) : -randomRange(rng, 0.45, 1.1),
    });
  }

  const ribbons: CloudRibbon[] = [];
  for (let index = 0; index < ribbonCount; index += 1) {
    ribbons.push({
      ax: randomRange(rng, -1, 1),
      ay: randomRange(rng, -0.96, 0.96),
      bx: randomRange(rng, -1, 1),
      by: randomRange(rng, -0.96, 0.96),
      width: randomRange(rng, 0.12, 0.28),
      weight: randomRange(rng, 0.6, 1.25),
      curve: randomRange(rng, 0.02, 0.18),
      phase: randomRange(rng, 0, Math.PI * 2),
      speed: randomRange(rng, 0.16, 0.72),
    });
  }

  const folds: CloudFold[] = [];
  for (let index = 0; index < foldCount; index += 1) {
    folds.push({
      angle: randomRange(rng, 0, Math.PI * 2),
      frequency: randomRange(rng, 2.2, 8.4),
      amplitude: randomRange(rng, 0.03, 0.1),
      phase: randomRange(rng, 0, Math.PI * 2),
      speed: randomRange(rng, 0.2, 0.82),
    });
  }

  const eyeHint = Math.pow(rng(), 0.72);
  const eyeY = randomRange(rng, -0.12, 0.35);

  return {
    nodes,
    ribbons,
    folds,
    symmetry: randomRange(rng, 0.12, 0.76),
    axisX: randomRange(rng, -0.2, 0.2),
    eyeHint,
    eyeY,
    eyeSeparation: randomRange(rng, 0.22, 0.62),
    eyeRadius: randomRange(rng, 0.05, 0.14),
    mouthY: eyeY - randomRange(rng, 0.2, 0.5),
    mouthWidth: randomRange(rng, 0.35, 0.95),
    mouthArc: randomRange(rng, 0.02, 0.1) * (rng() > 0.5 ? 1 : -1),
    driftX: randomRange(rng, -0.24, 0.24),
    driftY: randomRange(rng, -0.24, 0.24),
    scale: randomRange(rng, 0.72, 0.95),
    duration: randomRange(rng, 7.5, 12.5),
  };
}

function applyCloudForces(
  state: CloudState,
  x: number,
  y: number,
  baseX: number,
  baseY: number,
  time: number,
  phase: number,
  weight: number,
  force: { x: number; y: number },
): void {
  if (weight <= 0.0001) {
    return;
  }

  const scale = state.scale;
  force.x += (baseX * scale - x) * 0.62 * weight;
  force.y += (baseY * scale - y) * 0.62 * weight;

  for (let index = 0; index < state.folds.length; index += 1) {
    const fold = state.folds[index];
    const along =
      baseX * Math.cos(fold.angle) +
      baseY * Math.sin(fold.angle) +
      state.driftX * x * 1.6 +
      state.driftY * y * 1.6;
    const wave = Math.sin(along * fold.frequency + time * fold.speed + fold.phase + phase * 6.1);
    const normalX = -Math.sin(fold.angle);
    const normalY = Math.cos(fold.angle);
    const strength = fold.amplitude * wave * weight * 2.6;
    force.x += normalX * strength;
    force.y += normalY * strength;
  }

  for (let index = 0; index < state.nodes.length; index += 1) {
    const node = state.nodes[index];
    const dx = x - node.x;
    const dy = y - node.y;
    const influence = Math.exp(
      -((dx * dx) / (node.rx * node.rx + 0.0001) + (dy * dy) / (node.ry * node.ry + 0.0001)),
    );
    const pull = node.weight * influence * weight * 3.8;
    force.x += -dx * pull;
    force.y += -dy * pull;
  }

  for (let index = 0; index < state.ribbons.length; index += 1) {
    const ribbon = state.ribbons[index];
    const rawDx = ribbon.bx - ribbon.ax;
    const rawDy = ribbon.by - ribbon.ay;
    const length = Math.hypot(rawDx, rawDy) + 0.0001;
    const normalX = -rawDy / length;
    const normalY = rawDx / length;

    const aSway = Math.sin(time * ribbon.speed + ribbon.phase) * ribbon.curve;
    const bSway = Math.cos(time * ribbon.speed * 0.84 + ribbon.phase * 1.37) * ribbon.curve;

    const ax = ribbon.ax + normalX * aSway;
    const ay = ribbon.ay + normalY * aSway;
    const bx = ribbon.bx + normalX * bSway;
    const by = ribbon.by + normalY * bSway;

    const segDx = bx - ax;
    const segDy = by - ay;
    const segLenSq = segDx * segDx + segDy * segDy + 0.0001;
    const t = clamp(((x - ax) * segDx + (y - ay) * segDy) / segLenSq, 0, 1);
    const nearestX = ax + segDx * t;
    const nearestY = ay + segDy * t;

    const nx = nearestX - x;
    const ny = nearestY - y;
    const distSq = nx * nx + ny * ny;
    const influence = Math.exp(-distSq / (ribbon.width * ribbon.width + 0.0001));
    const pull = influence * ribbon.weight * weight * 1.45;

    force.x += nx * pull;
    force.y += ny * pull;
  }

  const symmetryBias = state.symmetry * (0.24 + state.eyeHint * 0.76) * weight;
  const mirrorX = state.axisX - (x - state.axisX);
  const symmetryMask = Math.exp(-Math.abs(y - state.eyeY) * 1.9);
  force.x += (mirrorX - x) * symmetryBias * symmetryMask;

  const eyeInfluence = state.eyeHint * weight;
  if (eyeInfluence > 0.01) {
    const leftEyeX = state.axisX - state.eyeSeparation * 0.5;
    const rightEyeX = state.axisX + state.eyeSeparation * 0.5;
    const eyeY = state.eyeY;
    const eyeRadius = state.eyeRadius;

    const eyeCenters: Array<[number, number]> = [
      [leftEyeX, eyeY],
      [rightEyeX, eyeY],
    ];

    for (let eyeIndex = 0; eyeIndex < eyeCenters.length; eyeIndex += 1) {
      const eye = eyeCenters[eyeIndex];
      const ex = eye[0];
      const ey = eye[1];
      const dx = x - ex;
      const dy = y - ey;
      const dist = Math.hypot(dx, dy) + 0.0001;

      const ringDist = dist - eyeRadius;
      const ring = Math.exp(-(ringDist * ringDist) / (eyeRadius * eyeRadius * 0.58 + 0.0001));
      force.x += (dx / dist) * ring * eyeInfluence * 0.95;
      force.y += (dy / dist) * ring * eyeInfluence * 0.95;

      const pupil = Math.exp(-(dist * dist) / (eyeRadius * eyeRadius * 0.52 + 0.0001));
      force.x += -dx * pupil * eyeInfluence * 1.5;
      force.y += -dy * pupil * eyeInfluence * 1.5;
    }

    const localX = (x - state.axisX) / Math.max(0.01, state.mouthWidth);
    const smileY = state.mouthY + Math.sin(localX * Math.PI) * state.mouthArc;
    const mouthDelta = smileY - y;
    const mouthBand =
      Math.exp(-(mouthDelta * mouthDelta) / 0.018) * Math.exp(-Math.abs(localX) * 1.35);

    force.y += mouthDelta * mouthBand * eyeInfluence * 1.3;
    force.x += -(x - state.axisX) * mouthBand * eyeInfluence * 0.16;
  }

  const turbulence =
    Math.sin((x + baseX) * 3.7 + time * 0.51 + phase * 11.2) *
    Math.cos((y - baseY) * 4.3 + time * 0.43 + phase * 7.4);
  force.x += Math.cos(turbulence + phase * 5.7) * 0.018 * weight;
  force.y += Math.sin(turbulence - phase * 3.9) * 0.018 * weight;
}

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export default function QuantaScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
    });

    if (!gl) {
      return;
    }

    const vertexSource = `
      attribute vec2 a_position;
      attribute vec3 a_color;
      attribute float a_alpha;
      uniform float u_point_size;
      varying vec3 v_color;
      varying float v_alpha;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        gl_PointSize = u_point_size;
        v_color = a_color;
        v_alpha = a_alpha;
      }
    `;

    const fragmentSource = `
      precision mediump float;
      varying vec3 v_color;
      varying float v_alpha;

      void main() {
        vec2 center = gl_PointCoord * 2.0 - 1.0;
        float dist = dot(center, center);
        if (dist > 1.0) {
          discard;
        }

        float alpha = smoothstep(1.0, 0.0, dist);
        gl_FragColor = vec4(v_color, alpha * v_alpha);
      }
    `;

    const program = createProgram(gl, vertexSource, fragmentSource);
    if (!program) {
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const colorLocation = gl.getAttribLocation(program, "a_color");
    const alphaLocation = gl.getAttribLocation(program, "a_alpha");
    const pointSizeLocation = gl.getUniformLocation(program, "u_point_size");

    if (positionLocation < 0 || colorLocation < 0 || alphaLocation < 0 || !pointSizeLocation) {
      gl.deleteProgram(program);
      return;
    }

    const pointCount = 26000;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const loadSeed = getRandomUint32();
    const angleOffset = seededNoise(loadSeed * 0.0000013 + 0.37) * Math.PI * 2;
    const radiusWarp = 0.92 + seededNoise(loadSeed * 0.0000021 + 0.71) * 0.2;

    const basePositions = new Float32Array(pointCount * 2);
    const currentPositions = new Float32Array(pointCount * 2);
    const velocities = new Float32Array(pointCount * 2);
    const renderPositions = new Float32Array(pointCount * 2);
    const phaseOffsets = new Float32Array(pointCount);
    const colors = new Float32Array(pointCount * 3);
    const alphas = new Float32Array(pointCount);

    for (let index = 0; index < pointCount; index += 1) {
      const baseRadius = Math.sqrt((index + 0.5) / pointCount) * 0.96;
      const radiusJitter = 0.92 + seededNoise(loadSeed * 0.0000041 + index * 0.071) * 0.18;
      const radius = baseRadius * radiusWarp * radiusJitter;
      const angle = index * goldenAngle + angleOffset;
      const baseX = Math.cos(angle) * radius;
      const baseY = Math.sin(angle) * radius;

      const offsetIndex = index * 2;
      basePositions[offsetIndex] = baseX;
      basePositions[offsetIndex + 1] = baseY;
      currentPositions[offsetIndex] = baseX;
      currentPositions[offsetIndex + 1] = baseY;
      velocities[offsetIndex] = 0;
      velocities[offsetIndex + 1] = 0;

      phaseOffsets[index] = seededNoise(index * 17.9 + 3.1 + loadSeed * 0.0000037);

      const warmth = seededNoise(index * 19.7 + 11.3 + loadSeed * 0.0000019);
      const pigment = seededNoise(index * 23.2 + 5.7 + loadSeed * 0.0000043);
      colors[index * 3] = clamp(0.3 + warmth * 0.42, 0, 1);
      colors[index * 3 + 1] = clamp(0.1 + warmth * 0.2 + pigment * 0.08, 0, 1);
      colors[index * 3 + 2] = clamp(0.07 + warmth * 0.12 + (1 - pigment) * 0.05, 0, 1);
      alphas[index] = 0.5 + seededNoise(index * 7.9 + 2.1 + loadSeed * 0.0000029) * 0.5;
    }

    const positionBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();
    const alphaBuffer = gl.createBuffer();
    if (!positionBuffer || !colorBuffer || !alphaBuffer) {
      if (positionBuffer) {
        gl.deleteBuffer(positionBuffer);
      }
      if (colorBuffer) {
        gl.deleteBuffer(colorBuffer);
      }
      if (alphaBuffer) {
        gl.deleteBuffer(alphaBuffer);
      }
      gl.deleteProgram(program);
      return;
    }

    let cloudSeed = (loadSeed ^ 0x9e3779b9) >>> 0;
    if (cloudSeed === 0) {
      cloudSeed = 1;
    }
    let currentState = createCloudState(cloudSeed);
    cloudSeed = (cloudSeed + 0x6d2b79f5) >>> 0;
    let nextState = createCloudState(cloudSeed);

    let morphElapsed = 0;
    let morphDuration = (currentState.duration + nextState.duration) * 0.5;
    let aspectScaleX = 1;

    let rafId = 0;
    let lastTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      gl.viewport(0, 0, canvas.width, canvas.height);
      aspectScaleX = Math.min(1, (height / width) * 1.2);
    };

    resize();

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, renderPositions.byteLength, gl.DYNAMIC_DRAW);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;
      const time = now * 0.001;

      morphElapsed += dt;
      let morph = morphElapsed / morphDuration;

      if (morph >= 1) {
        morphElapsed -= morphDuration;
        currentState = nextState;
        cloudSeed = (cloudSeed + 0x6d2b79f5) >>> 0;
        nextState = createCloudState(cloudSeed);
        morphDuration = (currentState.duration + nextState.duration) * 0.5;
        morph = morphElapsed / morphDuration;
      }

      const blend = smoothstep01(morph);

      for (let index = 0; index < pointCount; index += 1) {
        const offsetIndex = index * 2;
        const baseX = basePositions[offsetIndex];
        const baseY = basePositions[offsetIndex + 1];

        let x = currentPositions[offsetIndex];
        let y = currentPositions[offsetIndex + 1];

        const force = { x: 0, y: 0 };
        const phase = phaseOffsets[index];

        applyCloudForces(currentState, x, y, baseX, baseY, time, phase, 1 - blend, force);
        applyCloudForces(nextState, x, y, baseX, baseY, time, phase, blend, force);

        const damping = Math.exp(-dt * 4.6);
        velocities[offsetIndex] = velocities[offsetIndex] * damping + force.x * dt * 2.4;
        velocities[offsetIndex + 1] = velocities[offsetIndex + 1] * damping + force.y * dt * 2.4;

        x += velocities[offsetIndex] * dt;
        y += velocities[offsetIndex + 1] * dt;

        const safety = 0.992;
        if (x > safety || x < -safety) {
          velocities[offsetIndex] *= -0.4;
        }
        if (y > safety || y < -safety) {
          velocities[offsetIndex + 1] *= -0.4;
        }

        x = clamp(x, -safety, safety);
        y = clamp(y, -safety, safety);

        currentPositions[offsetIndex] = x;
        currentPositions[offsetIndex + 1] = y;

        renderPositions[offsetIndex] = x * aspectScaleX;
        renderPositions[offsetIndex + 1] = y;
      }

      gl.clearColor(0.95, 0.965, 0.988, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      const pointSize = Math.min(7.2, Math.max(3.2, (window.devicePixelRatio || 1) * 3.2));
      gl.uniform1f(pointSizeLocation, pointSize);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, renderPositions);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
      gl.enableVertexAttribArray(alphaLocation);
      gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, pointCount);
      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(colorBuffer);
      gl.deleteBuffer(alphaBuffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#f9fbff] text-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_42%_18%,rgba(255,255,255,0.46),rgba(246,251,255,0.14)_42%,transparent_68%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.3)_0%,rgba(226,236,255,0.1)_52%,rgba(255,255,255,0.28)_100%)]" />

      <div className="absolute left-4 top-4 z-10 flex max-w-md flex-col gap-3 border border-black/15 bg-white/82 px-4 py-4 backdrop-blur-sm relative">
        <p className="font-sans text-[11px] uppercase tracking-[0.11em] text-black/55">
          Exhibition Piece 4 / {PIECE_COUNT}
        </p>
        <h1 className="font-pixel-square text-3xl leading-none text-black sm:text-4xl">Quanta</h1>
        <p className="font-sans text-xs leading-relaxed text-black/70 sm:text-sm">
          A living point-cloud drifts through continuously generated latent forms, nudging your eye
          toward faces and structures that never fully resolve.
        </p>
        <PieceNavigationControls pieceId={4} />
      </div>
    </div>
  );
}
