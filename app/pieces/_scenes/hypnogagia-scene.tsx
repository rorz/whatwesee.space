"use client";

import { useEffect, useRef } from "react";
import PieceNavigationControls from "../_components/piece-navigation-controls";
import { PIECE_COUNT } from "../_lib/piece-constants";

type DreamNode = {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  freq: number;
  motifTether: number;
  spark: number;
  flow: number;
  life: number;
  respawn: number;
};

type DreamPoint = {
  x: number;
  y: number;
};

type DreamMotif = {
  name: string;
  line: string;
  anchors: DreamPoint[];
};

type DreamStateSummary = {
  piece: number;
  title: string;
  coordinateSystem: string;
  motifFrom: string;
  motifTo: string;
  motifBlend: number;
  reorganizationBlend: number;
  warpStrength: number;
  hoveredNode: number | null;
  destroyedNodes: number;
  shake: number;
  dreamLine: string;
  nodeCount: number;
  connectionCount: number;
  pointer: {
    active: boolean;
    x: number | null;
    y: number | null;
  };
  sampleNodes: Array<{ x: number; y: number }>;
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => Promise<void>;
  }
}

const DREAM_MOTIFS: DreamMotif[] = [
  {
    name: "corridor-face",
    line: "A hallway keeps rewriting itself into a face.",
    anchors: [
      { x: -0.72, y: -0.08 },
      { x: -0.5, y: -0.22 },
      { x: -0.24, y: -0.3 },
      { x: 0, y: -0.34 },
      { x: 0.24, y: -0.3 },
      { x: 0.5, y: -0.22 },
      { x: 0.72, y: -0.08 },
      { x: -0.52, y: 0.14 },
      { x: -0.2, y: 0.06 },
      { x: 0, y: -0.01 },
      { x: 0.2, y: 0.06 },
      { x: 0.52, y: 0.14 },
      { x: -0.28, y: 0.34 },
      { x: 0, y: 0.41 },
      { x: 0.28, y: 0.34 },
    ],
  },
  {
    name: "bedroom-map",
    line: "Threads map a room that never existed.",
    anchors: [
      { x: -0.78, y: -0.4 },
      { x: -0.44, y: -0.4 },
      { x: -0.08, y: -0.38 },
      { x: 0.24, y: -0.36 },
      { x: 0.68, y: -0.31 },
      { x: -0.72, y: -0.08 },
      { x: -0.34, y: -0.02 },
      { x: 0.03, y: 0.02 },
      { x: 0.38, y: 0.03 },
      { x: 0.74, y: -0.04 },
      { x: -0.65, y: 0.28 },
      { x: -0.25, y: 0.34 },
      { x: 0.12, y: 0.4 },
      { x: 0.46, y: 0.36 },
      { x: 0.76, y: 0.22 },
    ],
  },
  {
    name: "winged-letters",
    line: "Unread tokens take on bone and wing.",
    anchors: [
      { x: -0.76, y: -0.18 },
      { x: -0.56, y: -0.31 },
      { x: -0.33, y: -0.42 },
      { x: -0.08, y: -0.31 },
      { x: 0.14, y: -0.21 },
      { x: 0.36, y: -0.34 },
      { x: 0.6, y: -0.42 },
      { x: 0.82, y: -0.27 },
      { x: -0.66, y: 0.12 },
      { x: -0.38, y: 0.18 },
      { x: -0.08, y: 0.21 },
      { x: 0.2, y: 0.17 },
      { x: 0.44, y: 0.24 },
      { x: 0.64, y: 0.14 },
      { x: 0.84, y: 0.04 },
      { x: -0.24, y: 0.42 },
      { x: 0.05, y: 0.48 },
      { x: 0.34, y: 0.4 },
    ],
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

function randomRange(rng: () => number, min: number, max: number): number {
  return min + (max - min) * rng();
}

function getRandomUint32(): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bucket = new Uint32Array(1);
    crypto.getRandomValues(bucket);
    return bucket[0] || 1;
  }
  return ((Math.random() * 4294967295) >>> 0) || 1;
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

export default function HypnogagiaScene() {
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
      attribute float a_alpha;
      attribute float a_size;

      uniform vec2 u_resolution;
      uniform float u_size_scale;
      uniform vec2 u_screen_offset;
      uniform vec2 u_warp_center;
      uniform float u_warp_radius;
      uniform float u_warp_strength;

      varying float v_alpha;

      void main() {
        vec2 displaced = a_position + u_screen_offset;
        float pointScale = 1.0;

        if (u_warp_strength > 0.0001 && u_warp_radius > 0.0001) {
          vec2 delta = displaced - u_warp_center;
          float dist = length(delta);
          vec2 p = delta / max(u_warp_radius, 0.0001);
          float r = length(p) + 0.0001;
          float local = exp(-r * 1.35);
          float global = 1.0 / (1.0 + r * 1.25);
          float sink = u_warp_strength * (local * 1.55 + global * 0.42);

          float horizon = 0.22;
          float ring = exp(-pow((r - horizon) / 0.075, 2.0));
          float inside = smoothstep(horizon, 0.0, r);

          float twist = sink * (1.4 + ring * 2.8);
          float c = cos(twist);
          float s = sin(twist);
          p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);

          float collapse = 1.0 + sink * (2.4 + ring * 3.2);
          p /= collapse;

          float pinch = clamp(1.0 - ring * min(0.94, u_warp_strength * 0.11), 0.02, 1.0);
          p *= pinch;
          p *= max(0.01, 1.0 - inside * min(0.985, 0.24 + u_warp_strength * 0.08));

          displaced = u_warp_center + p * u_warp_radius;
          pointScale += sink * 3.4 + ring * u_warp_strength * 1.9;
        }

        vec2 clip = vec2(
          (displaced.x / u_resolution.x) * 2.0 - 1.0,
          1.0 - (displaced.y / u_resolution.y) * 2.0
        );
        gl_Position = vec4(clip, 0.0, 1.0);
        gl_PointSize = a_size * u_size_scale * pointScale;
        v_alpha = a_alpha;
      }
    `;

    const fragmentSource = `
      precision mediump float;

      uniform vec3 u_color;
      uniform float u_point_mode;
      varying float v_alpha;

      void main() {
        float alpha = v_alpha;

        if (u_point_mode > 0.5) {
          vec2 centered = gl_PointCoord - vec2(0.5);
          float dist = length(centered);
          float mask = smoothstep(0.52, 0.02, dist);
          alpha *= mask;
        }

        gl_FragColor = vec4(u_color, alpha);
      }
    `;

    const program = createProgram(gl, vertexSource, fragmentSource);
    if (!program) {
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const alphaLocation = gl.getAttribLocation(program, "a_alpha");
    const sizeLocation = gl.getAttribLocation(program, "a_size");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const sizeScaleLocation = gl.getUniformLocation(program, "u_size_scale");
    const colorLocation = gl.getUniformLocation(program, "u_color");
    const pointModeLocation = gl.getUniformLocation(program, "u_point_mode");
    const screenOffsetLocation = gl.getUniformLocation(program, "u_screen_offset");
    const warpCenterLocation = gl.getUniformLocation(program, "u_warp_center");
    const warpRadiusLocation = gl.getUniformLocation(program, "u_warp_radius");
    const warpStrengthLocation = gl.getUniformLocation(program, "u_warp_strength");

    if (
      positionLocation < 0 ||
      alphaLocation < 0 ||
      sizeLocation < 0 ||
      !resolutionLocation ||
      !sizeScaleLocation ||
      !colorLocation ||
      !pointModeLocation ||
      !screenOffsetLocation ||
      !warpCenterLocation ||
      !warpRadiusLocation ||
      !warpStrengthLocation
    ) {
      gl.deleteProgram(program);
      return;
    }

    const postVertexSource = `
      attribute vec2 a_clip;
      varying vec2 v_uv;

      void main() {
        v_uv = a_clip * 0.5 + 0.5;
        gl_Position = vec4(a_clip, 0.0, 1.0);
      }
    `;

    const postFragmentSource = `
      precision mediump float;

      varying vec2 v_uv;
      uniform sampler2D u_scene;
      uniform vec2 u_resolution;
      uniform vec2 u_pointer;
      uniform float u_strength;
      uniform float u_time;

      void main() {
        float aspect = u_resolution.x / max(u_resolution.y, 0.0001);
        vec2 center = vec2(
          clamp(u_pointer.x / max(u_resolution.x, 1.0), 0.0, 1.0),
          clamp(1.0 - (u_pointer.y / max(u_resolution.y, 1.0)), 0.0, 1.0)
        );

        vec2 delta = v_uv - center;
        delta.x *= aspect;
        float r = length(delta) + 0.0001;

        float local = exp(-r * 2.4);
        float global = 1.0 / (1.0 + r * 1.6);
        float sink = u_strength * (local * 1.5 + global * 0.55);

        float horizon = 0.19;
        float ring = exp(-pow((r - horizon) / 0.052, 2.0));
        float inside = smoothstep(horizon, 0.0, r);

        float twist = sink * (1.9 + ring * 4.2);
        float c = cos(twist);
        float s = sin(twist);
        vec2 spun = vec2(c * delta.x - s * delta.y, s * delta.x + c * delta.y);

        float collapse = 1.0 + sink * (2.9 + ring * 4.6);
        spun /= collapse;
        spun *= max(0.008, 1.0 - inside * min(0.996, 0.22 + u_strength * 0.085));
        spun /= (1.0 + sink * 0.22);

        vec2 sampleDelta = spun;
        sampleDelta.x /= aspect;
        vec2 uv = clamp(center + sampleDelta, vec2(0.001), vec2(0.999));

        vec2 dir = normalize(sampleDelta + vec2(0.00001, 0.0));
        float chroma = (0.002 + 0.004 * sink) * (0.75 + 0.25 * sin(u_time * 2.1 + r * 11.0));

        vec3 col;
        col.r = texture2D(u_scene, clamp(uv + dir * chroma, vec2(0.001), vec2(0.999))).r;
        col.g = texture2D(u_scene, uv).g;
        col.b = texture2D(u_scene, clamp(uv - dir * chroma, vec2(0.001), vec2(0.999))).b;

        col += vec3(0.14, 0.07, 0.24) * ring * (0.8 + u_strength * 0.24);
        col *= 1.0 - inside * 0.9;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const postProgram = createProgram(gl, postVertexSource, postFragmentSource);
    if (!postProgram) {
      gl.deleteProgram(program);
      return;
    }

    const postClipLocation = gl.getAttribLocation(postProgram, "a_clip");
    const postSceneLocation = gl.getUniformLocation(postProgram, "u_scene");
    const postResolutionLocation = gl.getUniformLocation(postProgram, "u_resolution");
    const postPointerLocation = gl.getUniformLocation(postProgram, "u_pointer");
    const postStrengthLocation = gl.getUniformLocation(postProgram, "u_strength");
    const postTimeLocation = gl.getUniformLocation(postProgram, "u_time");

    if (
      postClipLocation < 0 ||
      !postSceneLocation ||
      !postResolutionLocation ||
      !postPointerLocation ||
      !postStrengthLocation ||
      !postTimeLocation
    ) {
      gl.deleteProgram(program);
      gl.deleteProgram(postProgram);
      return;
    }

    const nodeCount = window.innerWidth < 640 ? 220 : 360;
    const maxLinks = Math.floor(nodeCount * 7.5);
    const maxHoverLinks = Math.min(110, nodeCount - 1);

    const pointPositions = new Float32Array(nodeCount * 2);
    const pointAlphas = new Float32Array(nodeCount);
    const pointSizes = new Float32Array(nodeCount);

    const linkPositions = new Float32Array(maxLinks * 4);
    const linkAlphas = new Float32Array(maxLinks * 2);

    const hoverLinkPositions = new Float32Array(maxHoverLinks * 4);
    const hoverLinkAlphas = new Float32Array(maxHoverLinks * 2);

    const pointPositionBuffer = gl.createBuffer();
    const pointAlphaBuffer = gl.createBuffer();
    const pointSizeBuffer = gl.createBuffer();
    const linkPositionBuffer = gl.createBuffer();
    const linkAlphaBuffer = gl.createBuffer();
    const hoverLinkPositionBuffer = gl.createBuffer();
    const hoverLinkAlphaBuffer = gl.createBuffer();
    const postQuadBuffer = gl.createBuffer();
    const sceneTexture = gl.createTexture();
    const sceneFramebuffer = gl.createFramebuffer();

    if (
      !pointPositionBuffer ||
      !pointAlphaBuffer ||
      !pointSizeBuffer ||
      !linkPositionBuffer ||
      !linkAlphaBuffer ||
      !hoverLinkPositionBuffer ||
      !hoverLinkAlphaBuffer ||
      !postQuadBuffer ||
      !sceneTexture ||
      !sceneFramebuffer
    ) {
      if (pointPositionBuffer) gl.deleteBuffer(pointPositionBuffer);
      if (pointAlphaBuffer) gl.deleteBuffer(pointAlphaBuffer);
      if (pointSizeBuffer) gl.deleteBuffer(pointSizeBuffer);
      if (linkPositionBuffer) gl.deleteBuffer(linkPositionBuffer);
      if (linkAlphaBuffer) gl.deleteBuffer(linkAlphaBuffer);
      if (hoverLinkPositionBuffer) gl.deleteBuffer(hoverLinkPositionBuffer);
      if (hoverLinkAlphaBuffer) gl.deleteBuffer(hoverLinkAlphaBuffer);
      if (postQuadBuffer) gl.deleteBuffer(postQuadBuffer);
      if (sceneTexture) gl.deleteTexture(sceneTexture);
      if (sceneFramebuffer) gl.deleteFramebuffer(sceneFramebuffer);
      gl.deleteProgram(program);
      gl.deleteProgram(postProgram);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointPositions.byteLength, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, pointAlphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointAlphas.byteLength, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, pointSizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointSizes.byteLength, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, linkPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, linkPositions.byteLength, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, linkAlphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, linkAlphas.byteLength, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, hoverLinkPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, hoverLinkPositions.byteLength, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, hoverLinkAlphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, hoverLinkAlphas.byteLength, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, postQuadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    let renderTargetReady = false;

    const updateRenderTarget = () => {
      gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        canvas.width,
        canvas.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );

      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFramebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        sceneTexture,
        0,
      );
      renderTargetReady = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, null);
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const pointer = { x: 0, y: 0, active: false, boost: 0 };

    let viewportWidth = 1;
    let viewportHeight = 1;
    let radiusX = 1;
    let radiusY = 1;
    let linkCount = 0;
    let hoverLinkCount = 0;
    let simulationTime = 0;
    let screenShake = 0;
    let screenOffsetX = 0;
    let screenOffsetY = 0;
    let warpCenterX = 0;
    let warpCenterY = 0;
    let warpRadius = 1;
    let warpStrength = 0;
    let hoveredNodeIndex = -1;
    let hoverStrength = 0;
    let destroyedCount = 0;

    const loadSeed = getRandomUint32();
    const rng = createRng(loadSeed);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const nodes: DreamNode[] = [];
    const motifWeights = new Float32Array(DREAM_MOTIFS.length);

    let latestState: DreamStateSummary = {
      piece: 7,
      title: "Hypnogagia",
      coordinateSystem: "origin at top-left; x increases right; y increases downward; units in px",
      motifFrom: DREAM_MOTIFS[0].name,
      motifTo: DREAM_MOTIFS[1].name,
      motifBlend: 0,
      reorganizationBlend: 0,
      warpStrength: 0,
      hoveredNode: null,
      destroyedNodes: 0,
      shake: 0,
      dreamLine: DREAM_MOTIFS[0].line,
      nodeCount,
      connectionCount: 0,
      pointer: { active: false, x: null, y: null },
      sampleNodes: [],
    };

    const renderText = () => JSON.stringify(latestState);

    const initializeNodes = () => {
      nodes.length = 0;
      const centerX = viewportWidth * 0.5;
      const centerY = viewportHeight * 0.54;

      for (let index = 0; index < nodeCount; index += 1) {
        const r = Math.pow((index + 0.5) / nodeCount, 0.68);
        const angle = index * goldenAngle + randomRange(rng, -0.28, 0.28);
        const jitterX = randomRange(rng, -0.13, 0.13);
        const jitterY = randomRange(rng, -0.13, 0.13);

        const baseX = Math.cos(angle) * r * randomRange(rng, 0.7, 1.03) + jitterX;
        const baseY = Math.sin(angle) * r * randomRange(rng, 0.66, 1) + jitterY;

        const x = centerX + baseX * radiusX * 0.52;
        const y = centerY + baseY * radiusY * 0.52;

        nodes.push({
          baseX,
          baseY,
          x,
          y,
          vx: 0,
          vy: 0,
          phase: randomRange(rng, 0, Math.PI * 2),
          freq: randomRange(rng, 0.45, 1.75),
          motifTether: randomRange(rng, 0.24, 1),
          spark: randomRange(rng, 0.3, 1),
          flow: randomRange(rng, 0.25, 1),
          life: 1,
          respawn: 0,
        });
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;

      canvas.width = Math.floor(viewportWidth * dpr);
      canvas.height = Math.floor(viewportHeight * dpr);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);

      radiusX = viewportWidth * 0.42;
      radiusY = viewportHeight * 0.38;
      updateRenderTarget();

      if (nodes.length === 0) {
        initializeNodes();
      } else {
        const centerX = viewportWidth * 0.5;
        const centerY = viewportHeight * 0.54;
        for (let index = 0; index < nodes.length; index += 1) {
          const node = nodes[index];
          node.x = centerX + node.baseX * radiusX * 0.52;
          node.y = centerY + node.baseY * radiusY * 0.52;
          node.vx = 0;
          node.vy = 0;
        }
      }
    };

    const destroyNodesAt = (x: number, y: number) => {
      const blastRadius = Math.max(58, Math.min(viewportWidth, viewportHeight) * 0.15);
      let hitCount = 0;

      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        const dx = node.x - x;
        const dy = node.y - y;
        const dist = Math.hypot(dx, dy) + 0.0001;

        if (dist > blastRadius) {
          continue;
        }

        const impact = 1 - dist / blastRadius;
        if (impact < 0.08) {
          continue;
        }

        node.life = 0;
        node.respawn = Math.max(node.respawn, 0.7 + randomRange(rng, 0, 2.2));
        node.vx += (dx / dist) * (2 + impact * 18 + randomRange(rng, -1, 1));
        node.vy += (dy / dist) * (2 + impact * 18 + randomRange(rng, -1, 1));
        node.phase += impact * 0.9;
        hitCount += 1;
      }

      if (hitCount === 0 && hoveredNodeIndex >= 0) {
        const node = nodes[hoveredNodeIndex];
        node.life = 0;
        node.respawn = Math.max(node.respawn, 0.85 + randomRange(rng, 0, 1.6));
        node.vx += randomRange(rng, -8, 8);
        node.vy += randomRange(rng, -8, 8);
        hitCount = 1;
      }

      screenShake = clamp(screenShake + 0.24 + hitCount * 0.022, 0, 1.6);
      pointer.boost = clamp(pointer.boost + 0.45, 0, 1.6);
    };

    const simulate = (dtSeconds: number) => {
      const dt = clamp(dtSeconds, 0.001, 0.05);
      const simDt = dt * 0.1;
      const dtFrames = simDt * 60;
      simulationTime += simDt;

      pointer.boost = Math.max(0, pointer.boost - simDt * 0.68);
      screenShake = Math.max(0, screenShake - simDt * 1.35);

      const motifPhase = simulationTime / 13;
      const motifCount = DREAM_MOTIFS.length;
      const motifOrbit = motifPhase * ((Math.PI * 2) / motifCount);
      let weightTotal = 0;

      for (let motifIndex = 0; motifIndex < motifCount; motifIndex += 1) {
        const orbitPhase = motifOrbit - (motifIndex / motifCount) * Math.PI * 2;
        const weight = Math.exp(2.25 * Math.cos(orbitPhase));
        motifWeights[motifIndex] = weight;
        weightTotal += weight;
      }

      for (let motifIndex = 0; motifIndex < motifCount; motifIndex += 1) {
        motifWeights[motifIndex] /= weightTotal;
      }

      let motifFromIndex = 0;
      let motifToIndex = motifCount > 1 ? 1 : 0;
      let fromWeight = motifWeights[motifFromIndex];
      let toWeight = motifWeights[motifToIndex];
      if (toWeight > fromWeight) {
        const swapIndex = motifFromIndex;
        const swapWeight = fromWeight;
        motifFromIndex = motifToIndex;
        fromWeight = toWeight;
        motifToIndex = swapIndex;
        toWeight = swapWeight;
      }

      for (let motifIndex = 2; motifIndex < motifCount; motifIndex += 1) {
        const weight = motifWeights[motifIndex];
        if (weight > fromWeight) {
          motifToIndex = motifFromIndex;
          toWeight = fromWeight;
          motifFromIndex = motifIndex;
          fromWeight = weight;
        } else if (weight > toWeight) {
          motifToIndex = motifIndex;
          toWeight = weight;
        }
      }

      const motifBlend = toWeight / Math.max(0.0001, fromWeight + toWeight);
      const reorgBlend = 0.5 + 0.5 * Math.sin(simulationTime * 0.31 + loadSeed * 0.0000017);

      const motifFrom = DREAM_MOTIFS[motifFromIndex];
      const motifTo = DREAM_MOTIFS[motifToIndex];

      const centerX = viewportWidth * 0.5;
      const centerY = viewportHeight * 0.54;
      const driftScaleX = radiusX * (0.81 + 0.1 * Math.sin(simulationTime * 0.11));
      const driftScaleY = radiusY * (0.77 + 0.1 * Math.cos(simulationTime * 0.09));

      const pointerRadius = Math.max(130, Math.min(viewportWidth, viewportHeight) * 0.28);
      const pointerRadiusSq = pointerRadius * pointerRadius;

      if (pointer.active) {
        warpCenterX = pointer.x;
        warpCenterY = pointer.y;
        warpRadius = Math.max(
          260,
          Math.min(viewportWidth, viewportHeight) * (1.08 + 0.35 * pointer.boost),
        );
        const warpPulse =
          0.52 + (0.5 + 0.5 * Math.sin(simulationTime * 8.2 + pointer.boost * 5.1)) * 0.76;
        warpStrength = clamp(3.2 + pointer.boost * 2.9 + warpPulse, 0, 9);
      } else {
        warpCenterX = viewportWidth * 0.5;
        warpCenterY = viewportHeight * 0.5;
        warpRadius = Math.max(220, Math.min(viewportWidth, viewportHeight) * 0.74);
        warpStrength = Math.max(0, warpStrength - simDt * 4.8);
      }

      destroyedCount = 0;

      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];

        if (node.respawn > 0) {
          const previousRespawn = node.respawn;
          node.respawn = Math.max(0, node.respawn - simDt);
          node.life = Math.max(0, node.life - simDt * 3.6);

          if (previousRespawn > 0 && node.respawn === 0) {
            const relift = 0.1 + node.motifTether * 0.22;
            node.x = centerX + node.baseX * radiusX * relift + randomRange(rng, -18, 18);
            node.y = centerY + node.baseY * radiusY * relift + randomRange(rng, -18, 18);
            node.vx = randomRange(rng, -1.2, 1.2);
            node.vy = randomRange(rng, -1.2, 1.2);
          }
        } else if (node.life < 1) {
          node.life = clamp(node.life + simDt * (0.6 + node.spark * 0.8), 0, 1);
        }

        if (node.life < 0.12 && node.respawn > 0) {
          destroyedCount += 1;
        }

        let anchorX = 0;
        let anchorY = 0;
        for (let motifIndex = 0; motifIndex < motifCount; motifIndex += 1) {
          const motif = DREAM_MOTIFS[motifIndex];
          const anchor =
            motif.anchors[
              (index * 5 + motifIndex * 11 + Math.floor(node.phase * 13)) % motif.anchors.length
            ];
          const weight = motifWeights[motifIndex];
          anchorX += anchor.x * weight;
          anchorY += anchor.y * weight;
        }

        const streamX =
          Math.sin(simulationTime * (0.19 + node.freq * 0.22) + node.phase * (1.2 + node.flow * 0.5)) *
            (0.08 + node.spark * 0.15) +
          Math.cos(simulationTime * (0.11 + node.flow * 0.17) - node.phase * 2.1 + node.baseY * 4.3) *
            (0.06 + node.motifTether * 0.11);

        const streamY =
          Math.cos(simulationTime * (0.17 + node.freq * 0.2) + node.phase * (1.6 + node.flow * 0.34)) *
            (0.08 + node.spark * 0.15) +
          Math.sin(simulationTime * (0.12 + node.flow * 0.15) + node.phase * 1.9 - node.baseX * 4.1) *
            (0.06 + node.motifTether * 0.11);

        const swirlAngle = simulationTime * (0.08 + node.flow * 0.09) + node.phase * 1.7;
        const swirlRadius =
          0.06 +
          node.motifTether * 0.16 +
          (0.5 + 0.5 * Math.sin(simulationTime * 0.27 + node.phase)) * 0.06;
        const swirlX = Math.cos(swirlAngle) * swirlRadius;
        const swirlY = Math.sin(swirlAngle) * swirlRadius;

        const streamStrength = 0.22 + reorgBlend * 0.2 + node.spark * 0.12;

        const targetNormX =
          node.baseX * (0.44 + (1 - node.motifTether) * 0.2) +
          anchorX * node.motifTether +
          (streamX + swirlX) * streamStrength;
        const targetNormY =
          node.baseY * (0.44 + (1 - node.motifTether) * 0.2) +
          anchorY * node.motifTether +
          (streamY + swirlY) * streamStrength;

        const targetX = centerX + targetNormX * driftScaleX;
        const targetY = centerY + targetNormY * driftScaleY;

        const vitality = 0.22 + node.life * 0.78;
        const spring = 0.011 + node.motifTether * 0.015 + streamStrength * 0.016;
        node.vx += (targetX - node.x) * spring * dtFrames * vitality;
        node.vy += (targetY - node.y) * spring * dtFrames * vitality;

        const flowX = Math.sin(simulationTime * 0.71 + node.phase * 1.7 + node.baseY * 6.2) * 0.34;
        const flowY = Math.cos(simulationTime * 0.67 + node.phase * 1.3 - node.baseX * 5.1) * 0.34;
        node.vx += flowX * (0.02 + streamStrength * 0.025) * dtFrames * vitality;
        node.vy += flowY * (0.02 + streamStrength * 0.025) * dtFrames * vitality;

        if (pointer.active && node.life > 0.08) {
          const dx = pointer.x - node.x;
          const dy = pointer.y - node.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < pointerRadiusSq) {
            const pull = Math.exp(-distSq / pointerRadiusSq);
            const pointerForce = (0.018 + pointer.boost * 0.065) * pull * dtFrames;
            node.vx += dx * pointerForce;
            node.vy += dy * pointerForce;
            const swirlForce = (0.006 + pointer.boost * 0.022) * pull * dtFrames;
            node.vx += -dy * swirlForce;
            node.vy += dx * swirlForce;
          }
        }

        const damping = Math.pow(0.83 + node.life * 0.11, dtFrames);
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx * dtFrames;
        node.y += node.vy * dtFrames;

        node.x = clamp(node.x, 10, viewportWidth - 10);
        node.y = clamp(node.y, 10, viewportHeight - 10);

        const pulse =
          0.5 + 0.5 * Math.sin(simulationTime * (0.9 + node.freq * 0.3) + node.phase * 4);
        const alphaBase = clamp(0.14 + node.motifTether * 0.4 + pulse * 0.24, 0.05, 0.96);
        let alpha = alphaBase * (0.12 + node.life * 0.88);
        let size = (1.1 + node.spark * 1.9 + pulse * 1.8) * (0.35 + node.life * 0.65);

        if (pointer.active) {
          const dxWarp = node.x - warpCenterX;
          const dyWarp = node.y - warpCenterY;
          const normWarp = Math.hypot(dxWarp, dyWarp) / Math.max(1, warpRadius);
          const hole = clamp((0.22 - normWarp) / 0.22, 0, 1);
          const insideFade = hole * hole;
          const ring = Math.exp(-Math.pow((normWarp - 0.23) / 0.05, 2));
          alpha = clamp(alpha * (1 - insideFade * 0.98) + ring * 0.16, 0, 1);
          size *= 1 + ring * 1.4;
        }

        const offset = index * 2;
        pointPositions[offset] = node.x;
        pointPositions[offset + 1] = node.y;
        pointAlphas[index] = alpha;
        pointSizes[index] = size;
      }

      hoveredNodeIndex = -1;
      hoverStrength = 0;
      if (pointer.active) {
        const hoverRadius = Math.max(26, Math.min(viewportWidth, viewportHeight) * 0.045);
        const hoverRadiusSq = hoverRadius * hoverRadius;
        let nearestDistSq = hoverRadiusSq;

        for (let index = 0; index < nodes.length; index += 1) {
          if (nodes[index].life < 0.15) {
            continue;
          }
          const dx = pointPositions[index * 2] - pointer.x;
          const dy = pointPositions[index * 2 + 1] - pointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < nearestDistSq) {
            nearestDistSq = distSq;
            hoveredNodeIndex = index;
          }
        }

        if (hoveredNodeIndex >= 0) {
          hoverStrength = 1 - Math.sqrt(nearestDistSq) / hoverRadius;
          const hoveredAlpha = pointAlphas[hoveredNodeIndex];
          pointAlphas[hoveredNodeIndex] = clamp(hoveredAlpha + 0.45 * hoverStrength, 0, 1);
          pointSizes[hoveredNodeIndex] *= 1.35 + hoverStrength * 0.9;
        }
      }

      linkCount = 0;
      const distanceLimit =
        Math.min(viewportWidth, viewportHeight) *
        (0.19 + 0.07 * (0.5 + 0.5 * Math.sin(simulationTime * 0.53 + reorgBlend * 6.28)));
      const distanceLimitSq = distanceLimit * distanceLimit;

      outer: for (let i = 0; i < nodes.length; i += 1) {
        const ia = pointAlphas[i];
        if (ia < 0.07 || nodes[i].life < 0.14) {
          continue;
        }

        const ix = pointPositions[i * 2];
        const iy = pointPositions[i * 2 + 1];

        for (let j = i + 1; j < nodes.length; j += 1) {
          const ja = pointAlphas[j];
          if (ja < 0.07 || nodes[j].life < 0.14) {
            continue;
          }

          const jx = pointPositions[j * 2];
          const jy = pointPositions[j * 2 + 1];
          const dx = jx - ix;
          const dy = jy - iy;
          const distSq = dx * dx + dy * dy;
          if (distSq > distanceLimitSq) {
            continue;
          }

          const dist = Math.sqrt(distSq);
          const nearness = 1 - dist / distanceLimit;
          const flicker = 0.5 + 0.5 * Math.sin(simulationTime * 0.43 + (i + j) * 0.11);
          let alpha = nearness * (ia + ja) * 0.32 * (0.55 + flicker * 0.45);

          if (hoveredNodeIndex >= 0 && (i === hoveredNodeIndex || j === hoveredNodeIndex)) {
            alpha *= 0.18;
          }

          if (alpha < 0.07) {
            continue;
          }

          if (
            alpha < 0.17 &&
            seededNoise(i * 31.2 + j * 17.9 + simulationTime * 0.12 + loadSeed * 0.0001) < 0.42
          ) {
            continue;
          }

          alpha = clamp(alpha, 0.035, 0.66);

          if (linkCount >= maxLinks) {
            break outer;
          }

          const linkOffset = linkCount * 4;
          const alphaOffset = linkCount * 2;

          linkPositions[linkOffset] = ix;
          linkPositions[linkOffset + 1] = iy;
          linkPositions[linkOffset + 2] = jx;
          linkPositions[linkOffset + 3] = jy;
          linkAlphas[alphaOffset] = alpha;
          linkAlphas[alphaOffset + 1] = alpha;
          linkCount += 1;
        }
      }

      hoverLinkCount = 0;
      if (hoveredNodeIndex >= 0) {
        const hx = pointPositions[hoveredNodeIndex * 2];
        const hy = pointPositions[hoveredNodeIndex * 2 + 1];
        const hoveredPhase = nodes[hoveredNodeIndex].phase;
        const hoverDistance =
          Math.min(viewportWidth, viewportHeight) * (0.3 + hoverStrength * 0.12);
        const hoverDistanceSq = hoverDistance * hoverDistance;

        for (let index = 0; index < nodes.length; index += 1) {
          if (index === hoveredNodeIndex || nodes[index].life < 0.14) {
            continue;
          }

          const nx = pointPositions[index * 2];
          const ny = pointPositions[index * 2 + 1];
          const dx = nx - hx;
          const dy = ny - hy;
          const distSq = dx * dx + dy * dy;
          if (distSq > hoverDistanceSq) {
            continue;
          }

          const dist = Math.sqrt(distSq);
          const distWeight = 1 - dist / hoverDistance;
          const phaseEcho =
            0.5 + 0.5 * Math.sin((nodes[index].phase - hoveredPhase) * 2.7 + simulationTime * 1.4);
          const pulseEcho =
            0.5 + 0.5 * Math.cos(simulationTime * 2.6 + index * 0.09 + nodes[index].flow * 5);
          const score = distWeight * 0.62 + phaseEcho * 0.24 + pulseEcho * 0.14;

          if (score < 0.44) {
            continue;
          }

          if (hoverLinkCount >= maxHoverLinks) {
            break;
          }

          const alpha = clamp(
            (0.16 + score * 0.82) * hoverStrength * nodes[index].life,
            0.08,
            0.96,
          );

          const linkOffset = hoverLinkCount * 4;
          const alphaOffset = hoverLinkCount * 2;

          hoverLinkPositions[linkOffset] = hx;
          hoverLinkPositions[linkOffset + 1] = hy;
          hoverLinkPositions[linkOffset + 2] = nx;
          hoverLinkPositions[linkOffset + 3] = ny;
          hoverLinkAlphas[alphaOffset] = alpha;
          hoverLinkAlphas[alphaOffset + 1] = alpha;

          pointAlphas[index] = clamp(pointAlphas[index] + alpha * 0.22, 0, 1);
          pointSizes[index] *= 1 + alpha * 0.18 * hoverStrength;
          hoverLinkCount += 1;
        }
      }

      if (screenShake > 0.001) {
        const shakeMagnitude = screenShake * (3.2 + pointer.boost * 1.4);
        screenOffsetX =
          (Math.sin(simulationTime * 89 + loadSeed * 0.0007) +
            Math.sin(simulationTime * 147 + 0.9) * 0.45) *
          shakeMagnitude;
        screenOffsetY =
          (Math.cos(simulationTime * 93 + loadSeed * 0.0009) +
            Math.sin(simulationTime * 131 + 1.7) * 0.5) *
          shakeMagnitude;
      } else {
        screenOffsetX = 0;
        screenOffsetY = 0;
      }

      const sampleNodes = [];
      const sampleCount = Math.min(6, nodes.length);
      for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
        const pickIndex = Math.floor((sampleIndex / sampleCount) * (nodes.length - 1));
        sampleNodes.push({
          x: Number(nodes[pickIndex].x.toFixed(1)),
          y: Number(nodes[pickIndex].y.toFixed(1)),
        });
      }

      latestState = {
        piece: 7,
        title: "Hypnogagia",
        coordinateSystem: "origin at top-left; x increases right; y increases downward; units in px",
        motifFrom: motifFrom.name,
        motifTo: motifTo.name,
        motifBlend: Number(motifBlend.toFixed(3)),
        reorganizationBlend: Number(reorgBlend.toFixed(3)),
        warpStrength: Number(warpStrength.toFixed(3)),
        hoveredNode: hoveredNodeIndex >= 0 ? hoveredNodeIndex : null,
        destroyedNodes: destroyedCount,
        shake: Number(screenShake.toFixed(3)),
        dreamLine: motifFrom.line,
        nodeCount: nodes.length,
        connectionCount: linkCount + hoverLinkCount,
        pointer: {
          active: pointer.active,
          x: pointer.active ? Number(pointer.x.toFixed(1)) : null,
          y: pointer.active ? Number(pointer.y.toFixed(1)) : null,
        },
        sampleNodes,
      };
    };

    const drawSceneGeometry = () => {
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, viewportWidth, viewportHeight);
      gl.uniform2f(screenOffsetLocation, screenOffsetX, screenOffsetY);
      gl.uniform2f(warpCenterLocation, warpCenterX, warpCenterY);
      gl.uniform1f(warpRadiusLocation, warpRadius);
      gl.uniform1f(warpStrengthLocation, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, linkPositionBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, linkPositions.subarray(0, linkCount * 4));
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, linkAlphaBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, linkAlphas.subarray(0, linkCount * 2));
      gl.enableVertexAttribArray(alphaLocation);
      gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

      gl.disableVertexAttribArray(sizeLocation);
      gl.vertexAttrib1f(sizeLocation, 1);

      gl.uniform1f(pointModeLocation, 0);
      gl.uniform1f(sizeScaleLocation, 1);
      gl.uniform3f(colorLocation, 0.28, 0.4, 0.66);
      gl.drawArrays(gl.LINES, 0, linkCount * 2);

      if (hoverLinkCount > 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, hoverLinkPositionBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, hoverLinkPositions.subarray(0, hoverLinkCount * 4));
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, hoverLinkAlphaBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, hoverLinkAlphas.subarray(0, hoverLinkCount * 2));
        gl.enableVertexAttribArray(alphaLocation);
        gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

        gl.uniform3f(colorLocation, 0.96, 0.48, 1);
        gl.drawArrays(gl.LINES, 0, hoverLinkCount * 2);

        gl.uniform3f(colorLocation, 0.46, 0.94, 1);
        gl.drawArrays(gl.LINES, 0, hoverLinkCount * 2);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pointPositions);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, pointAlphaBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pointAlphas);
      gl.enableVertexAttribArray(alphaLocation);
      gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, pointSizeBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pointSizes);
      gl.enableVertexAttribArray(sizeLocation);
      gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);

      gl.uniform1f(pointModeLocation, 1);
      gl.uniform1f(sizeScaleLocation, 2.8);
      gl.uniform3f(colorLocation, 0.28, 0.63, 1);
      gl.drawArrays(gl.POINTS, 0, nodeCount);

      gl.uniform1f(sizeScaleLocation, 1.15);
      gl.uniform3f(colorLocation, 0.95, 0.98, 1);
      gl.drawArrays(gl.POINTS, 0, nodeCount);
    };

    const render = () => {
      if (!renderTargetReady) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.005, 0.01, 0.02, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        drawSceneGeometry();
        return;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFramebuffer);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.005, 0.01, 0.02, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      drawSceneGeometry();

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.disable(gl.BLEND);
      gl.useProgram(postProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, postQuadBuffer);
      gl.enableVertexAttribArray(postClipLocation);
      gl.vertexAttribPointer(postClipLocation, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
      gl.uniform1i(postSceneLocation, 0);
      gl.uniform2f(postResolutionLocation, viewportWidth, viewportHeight);
      gl.uniform2f(postPointerLocation, warpCenterX, warpCenterY);
      gl.uniform1f(postStrengthLocation, warpStrength);
      gl.uniform1f(postTimeLocation, simulationTime);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.enable(gl.BLEND);
    };

    const advanceHook = async (ms: number) => {
      const bounded = clamp(ms, 1, 2000);
      const steps = Math.max(1, Math.round(bounded / (1000 / 60)));
      const dt = bounded / steps / 1000;
      for (let stepIndex = 0; stepIndex < steps; stepIndex += 1) {
        simulate(dt);
      }
      render();
    };

    window.render_game_to_text = renderText;
    window.advanceTime = advanceHook;

    resize();
    simulate(1 / 60);
    render();

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
      destroyNodesAt(pointer.x, pointer.y);
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.boost = 0;
    };

    let rafId = 0;
    let lastNow = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.04, (now - lastNow) / 1000);
      lastNow = now;
      simulate(dt);
      render();
      rafId = window.requestAnimationFrame(frame);
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", resize);

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);

      if (window.render_game_to_text === renderText) {
        delete window.render_game_to_text;
      }
      if (window.advanceTime === advanceHook) {
        delete window.advanceTime;
      }

      gl.deleteBuffer(pointPositionBuffer);
      gl.deleteBuffer(pointAlphaBuffer);
      gl.deleteBuffer(pointSizeBuffer);
      gl.deleteBuffer(linkPositionBuffer);
      gl.deleteBuffer(linkAlphaBuffer);
      gl.deleteBuffer(hoverLinkPositionBuffer);
      gl.deleteBuffer(hoverLinkAlphaBuffer);
      gl.deleteBuffer(postQuadBuffer);
      gl.deleteTexture(sceneTexture);
      gl.deleteFramebuffer(sceneFramebuffer);
      gl.deleteProgram(program);
      gl.deleteProgram(postProgram);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#02030a] text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(38,71,142,0.2),transparent_56%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_5px)]" />

      <div className="absolute left-4 top-4 z-10 flex max-w-md flex-col gap-3 border border-white/20 bg-black/50 px-4 py-4 backdrop-blur-sm relative">
        <p className="font-sans text-[11px] uppercase tracking-[0.11em] text-white/62">
          Exhibition Piece 7 / {PIECE_COUNT}
        </p>
        <h1 className="font-pixel-square text-3xl leading-none text-cyan-100 sm:text-4xl">
          Hypnogagia
        </h1>
        <p className="font-sans text-xs leading-relaxed text-white/80 sm:text-sm">
          Move over a node to reveal alternate dream-graph links. Click to fracture clusters and
          shudder the field before it coheres again.
        </p>
        <PieceNavigationControls pieceId={7} />
      </div>
    </div>
  );
}
