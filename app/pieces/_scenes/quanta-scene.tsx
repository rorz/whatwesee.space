"use client";

import { useEffect, useRef } from "react";
import PieceNavigationControls from "../_components/piece-navigation-controls";

type CloudNode = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  invRxSq: number;
  invRySq: number;
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
  cosAngle: number;
  sinAngle: number;
  normalX: number;
  normalY: number;
  frequency: number;
  amplitude: number;
  phase: number;
  speed: number;
};

type RibbonFrameSample = {
  ax: number;
  ay: number;
  segDx: number;
  segDy: number;
  segLenSq: number;
  widthSq: number;
  weight: number;
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
    const rx = randomRange(rng, 0.16, 0.48);
    const ry = randomRange(rng, 0.14, 0.44);
    nodes.push({
      x: randomRange(rng, -0.95, 0.95),
      y: randomRange(rng, -0.86, 0.86),
      rx,
      ry,
      invRxSq: 1 / (rx * rx + 0.0001),
      invRySq: 1 / (ry * ry + 0.0001),
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
    const angle = randomRange(rng, 0, Math.PI * 2);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    folds.push({
      angle,
      cosAngle,
      sinAngle,
      normalX: -sinAngle,
      normalY: cosAngle,
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

function buildRibbonFrameSamples(state: CloudState, time: number): RibbonFrameSample[] {
  const samples: RibbonFrameSample[] = [];

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

    samples.push({
      ax,
      ay,
      segDx,
      segDy,
      segLenSq: segDx * segDx + segDy * segDy + 0.0001,
      widthSq: ribbon.width * ribbon.width + 0.0001,
      weight: ribbon.weight,
    });
  }

  return samples;
}

function applyEyeForces(
  x: number,
  y: number,
  eyeX: number,
  eyeY: number,
  eyeRadius: number,
  eyeInfluence: number,
  force: Float32Array,
): void {
  const dx = x - eyeX;
  const dy = y - eyeY;
  const dist = Math.hypot(dx, dy) + 0.0001;

  const ringDist = dist - eyeRadius;
  const ring = Math.exp(-(ringDist * ringDist) / (eyeRadius * eyeRadius * 0.58 + 0.0001));
  force[0] += (dx / dist) * ring * eyeInfluence * 0.95;
  force[1] += (dy / dist) * ring * eyeInfluence * 0.95;

  const pupil = Math.exp(-(dist * dist) / (eyeRadius * eyeRadius * 0.52 + 0.0001));
  force[0] += -dx * pupil * eyeInfluence * 1.5;
  force[1] += -dy * pupil * eyeInfluence * 1.5;
}

function applyCloudForces(
  state: CloudState,
  ribbonSamples: RibbonFrameSample[],
  x: number,
  y: number,
  baseX: number,
  baseY: number,
  time: number,
  phase: number,
  weight: number,
  force: Float32Array,
): void {
  if (weight <= 0.0001) {
    return;
  }

  const scale = state.scale;
  force[0] += (baseX * scale - x) * 0.62 * weight;
  force[1] += (baseY * scale - y) * 0.62 * weight;

  for (let index = 0; index < state.folds.length; index += 1) {
    const fold = state.folds[index];
    const along =
      baseX * fold.cosAngle +
      baseY * fold.sinAngle +
      state.driftX * x * 1.6 +
      state.driftY * y * 1.6;
    const wave = Math.sin(along * fold.frequency + time * fold.speed + fold.phase + phase * 6.1);
    const strength = fold.amplitude * wave * weight * 2.6;
    force[0] += fold.normalX * strength;
    force[1] += fold.normalY * strength;
  }

  for (let index = 0; index < state.nodes.length; index += 1) {
    const node = state.nodes[index];
    const dx = x - node.x;
    const dy = y - node.y;
    const influence = Math.exp(-(dx * dx * node.invRxSq + dy * dy * node.invRySq));
    const pull = node.weight * influence * weight * 3.8;
    force[0] += -dx * pull;
    force[1] += -dy * pull;
  }

  for (let index = 0; index < ribbonSamples.length; index += 1) {
    const ribbon = ribbonSamples[index];
    const t = clamp(((x - ribbon.ax) * ribbon.segDx + (y - ribbon.ay) * ribbon.segDy) / ribbon.segLenSq, 0, 1);
    const nearestX = ribbon.ax + ribbon.segDx * t;
    const nearestY = ribbon.ay + ribbon.segDy * t;

    const nx = nearestX - x;
    const ny = nearestY - y;
    const distSq = nx * nx + ny * ny;
    const influence = Math.exp(-distSq / ribbon.widthSq);
    const pull = influence * ribbon.weight * weight * 1.45;

    force[0] += nx * pull;
    force[1] += ny * pull;
  }

  const symmetryBias = state.symmetry * (0.24 + state.eyeHint * 0.76) * weight;
  const mirrorX = state.axisX - (x - state.axisX);
  const symmetryMask = Math.exp(-Math.abs(y - state.eyeY) * 1.9);
  force[0] += (mirrorX - x) * symmetryBias * symmetryMask;

  const eyeInfluence = state.eyeHint * weight;
  if (eyeInfluence > 0.01) {
    const leftEyeX = state.axisX - state.eyeSeparation * 0.5;
    const rightEyeX = state.axisX + state.eyeSeparation * 0.5;
    const eyeY = state.eyeY;

    applyEyeForces(x, y, leftEyeX, eyeY, state.eyeRadius, eyeInfluence, force);
    applyEyeForces(x, y, rightEyeX, eyeY, state.eyeRadius, eyeInfluence, force);

    const localX = (x - state.axisX) / Math.max(0.01, state.mouthWidth);
    const smileY = state.mouthY + Math.sin(localX * Math.PI) * state.mouthArc;
    const mouthDelta = smileY - y;
    const mouthBand =
      Math.exp(-(mouthDelta * mouthDelta) / 0.018) * Math.exp(-Math.abs(localX) * 1.35);

    force[1] += mouthDelta * mouthBand * eyeInfluence * 1.3;
    force[0] += -(x - state.axisX) * mouthBand * eyeInfluence * 0.16;
  }

  const turbulence =
    Math.sin((x + baseX) * 3.7 + time * 0.51 + phase * 11.2) *
    Math.cos((y - baseY) * 4.3 + time * 0.43 + phase * 7.4);
  force[0] += Math.cos(turbulence + phase * 5.7) * 0.018 * weight;
  force[1] += Math.sin(turbulence - phase * 3.9) * 0.018 * weight;
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
      attribute vec3 a_particle;
      attribute vec3 a_color;
      attribute float a_alpha;
      uniform float u_point_size;
      varying vec3 v_color;
      varying float v_alpha;
      varying float v_speed;

      void main() {
        float speed = clamp(a_particle.z, 0.0, 1.0);
        gl_Position = vec4(a_particle.xy, 0.0, 1.0);
        gl_PointSize = u_point_size * (1.0 + speed * 0.75);
        v_color = a_color;
        v_alpha = a_alpha;
        v_speed = speed;
      }
    `;

    const fragmentSource = `
      precision mediump float;
      varying vec3 v_color;
      varying float v_alpha;
      varying float v_speed;

      void main() {
        vec2 center = gl_PointCoord * 2.0 - 1.0;
        float dist = length(center);
        if (dist > 1.2) {
          discard;
        }

        float body = exp(-(dist * dist) * mix(9.0, 3.6, v_speed));
        float halo = exp(-(dist * dist) * mix(28.0, 8.4, v_speed)) * mix(0.22, 0.62, v_speed);
        float alpha = (body + halo) * v_alpha;
        if (alpha < 0.01) {
          discard;
        }

        vec3 hotTint = vec3(1.0, 0.9, 0.86);
        vec3 color = mix(v_color, hotTint, clamp((v_speed - 0.5) * 0.6, 0.0, 0.28));
        gl_FragColor = vec4(color, alpha);
      }
    `;

    const program = createProgram(gl, vertexSource, fragmentSource);
    if (!program) {
      return;
    }

    const particleLocation = gl.getAttribLocation(program, "a_particle");
    const colorLocation = gl.getAttribLocation(program, "a_color");
    const alphaLocation = gl.getAttribLocation(program, "a_alpha");
    const pointSizeLocation = gl.getUniformLocation(program, "u_point_size");

    if (particleLocation < 0 || colorLocation < 0 || alphaLocation < 0 || !pointSizeLocation) {
      gl.deleteProgram(program);
      return;
    }

    const navigatorInfo = navigator as Navigator & { deviceMemory?: number };
    const hardwareThreads = navigatorInfo.hardwareConcurrency ?? 8;
    const deviceMemory = navigatorInfo.deviceMemory ?? 8;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointCount =
      prefersReducedMotion || hardwareThreads <= 4 || deviceMemory <= 4
        ? 12000
        : hardwareThreads <= 8 || deviceMemory <= 8
          ? 18000
          : 26000;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const loadSeed = getRandomUint32();
    const angleOffset = seededNoise(loadSeed * 0.0000013 + 0.37) * Math.PI * 2;
    const radiusWarp = 0.92 + seededNoise(loadSeed * 0.0000021 + 0.71) * 0.2;

    const basePositions = new Float32Array(pointCount * 2);
    const currentPositions = new Float32Array(pointCount * 2);
    const velocities = new Float32Array(pointCount * 2);
    const renderParticles = new Float32Array(pointCount * 3);
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
      const contrastSelector = seededNoise(index * 31.7 + 9.3 + loadSeed * 0.0000051);
      const alphaSeed = seededNoise(index * 7.9 + 2.1 + loadSeed * 0.0000029);

      if (contrastSelector < 0.24) {
        colors[index * 3] = clamp(0.78 + warmth * 0.22, 0, 1);
        colors[index * 3 + 1] = clamp(0.58 + pigment * 0.35, 0, 1);
        colors[index * 3 + 2] = clamp(0.48 + (1 - pigment) * 0.38, 0, 1);
        alphas[index] = 0.76 + alphaSeed * 0.24;
      } else if (contrastSelector > 0.62) {
        colors[index * 3] = clamp(0.02 + warmth * 0.14, 0, 1);
        colors[index * 3 + 1] = clamp(0.01 + pigment * 0.08, 0, 1);
        colors[index * 3 + 2] = clamp(0.01 + (1 - warmth) * 0.06, 0, 1);
        alphas[index] = 0.8 + alphaSeed * 0.2;
      } else {
        colors[index * 3] = clamp(0.26 + warmth * 0.46, 0, 1);
        colors[index * 3 + 1] = clamp(0.08 + warmth * 0.24 + pigment * 0.1, 0, 1);
        colors[index * 3 + 2] = clamp(0.06 + warmth * 0.14 + (1 - pigment) * 0.06, 0, 1);
        alphas[index] = 0.58 + alphaSeed * 0.42;
      }
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
    let pointSize = 4;
    const simulationSpeed = 3;

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
      pointSize = Math.min(7.2, Math.max(3.2, dpr * 3.2));
      gl.uniform1f(pointSizeLocation, pointSize);
    };

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, renderParticles.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(particleLocation);
    gl.vertexAttribPointer(particleLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(alphaLocation);
    gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

    resize();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const force = new Float32Array(2);
    const safety = 0.992;

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;
      const stepDt = Math.min(0.09, dt * simulationSpeed);
      const time = now * 0.001 * simulationSpeed;

      morphElapsed += stepDt;
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
      const currentWeight = 1 - blend;
      const nextWeight = blend;
      const damping = Math.exp(-stepDt * 4.6);
      const currentRibbonSamples = buildRibbonFrameSamples(currentState, time);
      const nextRibbonSamples = buildRibbonFrameSamples(nextState, time);

      for (let index = 0; index < pointCount; index += 1) {
        const offsetIndex = index * 2;
        const particleOffset = index * 3;
        const baseX = basePositions[offsetIndex];
        const baseY = basePositions[offsetIndex + 1];

        let x = currentPositions[offsetIndex];
        let y = currentPositions[offsetIndex + 1];

        force[0] = 0;
        force[1] = 0;
        const phase = phaseOffsets[index];

        applyCloudForces(
          currentState,
          currentRibbonSamples,
          x,
          y,
          baseX,
          baseY,
          time,
          phase,
          currentWeight,
          force,
        );
        applyCloudForces(
          nextState,
          nextRibbonSamples,
          x,
          y,
          baseX,
          baseY,
          time,
          phase,
          nextWeight,
          force,
        );

        velocities[offsetIndex] = velocities[offsetIndex] * damping + force[0] * stepDt * 2.4;
        velocities[offsetIndex + 1] = velocities[offsetIndex + 1] * damping + force[1] * stepDt * 2.4;

        x += velocities[offsetIndex] * stepDt;
        y += velocities[offsetIndex + 1] * stepDt;

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

        renderParticles[particleOffset] = x * aspectScaleX;
        renderParticles[particleOffset + 1] = y;
        const speedNorm = clamp(
          (Math.abs(velocities[offsetIndex]) + Math.abs(velocities[offsetIndex + 1])) * 0.2,
          0,
          1,
        );
        renderParticles[particleOffset + 2] = speedNorm;
      }

      gl.clearColor(0.95, 0.965, 0.988, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, renderParticles);

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
        <PieceNavigationControls pieceId={3} className="mt-0" hideArtistCard hidePieceGrid />
        <h1 className="font-pixel-square text-3xl leading-none text-black sm:text-4xl">Quanta</h1>
        <p className="font-sans text-xs leading-relaxed text-black/70 sm:text-sm">
          A WebGL point cloud updates continuously and forms transient clusters without hard cuts.
          The image feels close to recognition but never fully settles.
        </p>
        <PieceNavigationControls pieceId={3} hideQuickLinks />
      </div>
    </div>
  );
}
