"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MobileControlsPane from "../_components/mobile-controls-pane";
import PieceNavigationControls from "../_components/piece-navigation-controls";
import type { RollingShutterFrame } from "../_lib/rolling-shutter-types";

const ROTATION_INTERVAL_MS = 200;
const STREAM_POLL_INTERVAL_MS = 1400;
const STREAM_FETCH_COUNT = 90;
const TARGET_BUFFER_SIZE = 900;
const MAX_BUFFER_SIZE = 1400;

const NAME_LIFETIME_MS = 5000;
const NAME_SPAWN_INTERVAL_MS = 560;
const NAME_TICK_INTERVAL_MS = 80;
const MAX_NAME_BUBBLES = 20;

const OPEN_IMAGES_DOWNLOAD_PAGE =
  "https://storage.googleapis.com/openimages/web/download_v7.html#download-manually";

type OpenImagesBatchResponse = {
  frames?: RollingShutterFrame[];
  status?: "idle" | "warming" | "ready" | "error";
  poolSize?: number;
};

type NameBubble = {
  id: string;
  text: string;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  rotation: number;
  hue: number;
  bornAt: number;
};

type ShaderParams = {
  seedA: number;
  seedB: number;
  mode: number;
};

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function makeFallbackImage(index: number): RollingShutterFrame {
  const base = Math.floor(30 + seededNoise(index * 2.1 + 3.7) * 32);
  const high = Math.min(255, base + 42);

  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 560 560'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='rgb(${base},${base},${base})'/>
          <stop offset='100%' stop-color='rgb(${high},${high},${high})'/>
        </linearGradient>
        <radialGradient id='r' cx='50%' cy='46%' r='62%'>
          <stop offset='0%' stop-color='rgba(255,255,255,0.18)'/>
          <stop offset='100%' stop-color='rgba(255,255,255,0)'/>
        </radialGradient>
      </defs>
      <rect width='560' height='560' fill='url(#g)'/>
      <rect width='560' height='560' fill='url(#r)'/>
      <circle cx='280' cy='280' r='178' fill='none' stroke='rgba(255,255,255,0.22)' stroke-width='2'/>
      <circle cx='280' cy='280' r='104' fill='none' stroke='rgba(255,255,255,0.16)' stroke-width='1.5'/>
    </svg>
  `;

  return {
    id: `fallback-${index}`,
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    alt: "Rolling Shutter fallback frame",
    name: `fallback/fallback-${String(index + 1).padStart(3, "0")}.svg`,
    split: "test",
    rawId: `fallback-${index}`,
    sourceLabel: "local fallback",
    sourceUrl: OPEN_IMAGES_DOWNLOAD_PAGE,
  };
}

const FALLBACK_FRAMES: RollingShutterFrame[] = Array.from({ length: 360 }, (_, index) =>
  makeFallbackImage(index),
);

type RollingShutterSceneProps = {
  initialFrames: RollingShutterFrame[];
};

function computeBubbleOpacity(t: number): number {
  if (t <= 0 || t >= 1) {
    return 0;
  }
  if (t < 0.2) {
    return t / 0.2;
  }
  if (t > 0.72) {
    return (1 - t) / 0.28;
  }
  return 1;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shaderParamsForFrame(frame: RollingShutterFrame): ShaderParams {
  const hashA = hashString(`${frame.id}:${frame.rawId}`);
  const hashB = hashString(`${frame.rawId}:${frame.split}:${frame.name}`);
  return {
    seedA: (hashA % 100000) / 100000,
    seedB: (hashB % 100000) / 100000,
    mode: hashA % 4,
  };
}

function buildUrlCandidates(frame: RollingShutterFrame): string[] {
  if (!frame.rawId.startsWith("fallback-")) {
    const fromS3 = `https://open-images-dataset.s3.amazonaws.com/${frame.split}/${frame.rawId}.jpg`;
    const fromStorage = `https://storage.googleapis.com/openimages/2018_04/${frame.split}/${frame.rawId}.jpg`;
    const fromStorageMirror = `https://storage.googleapis.com/open-images-dataset/${frame.split}/${frame.rawId}.jpg`;
    return Array.from(new Set([frame.url, fromS3, fromStorage, fromStorageMirror]));
  }
  return [frame.url];
}

function tryLoadImage(src: string, timeoutMs = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;

    const finish = (success: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      image.onload = null;
      image.onerror = null;
      window.clearTimeout(timeoutId);
      resolve(success);
    };

    const timeoutId = window.setTimeout(() => finish(false), timeoutMs);
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.src = src;
  });
}

export default function RollingShutterScene({ initialFrames }: RollingShutterSceneProps) {
  const initialLive = initialFrames.length > 0;

  const [activeIndex, setActiveIndex] = useState(0);
  const [clock, setClock] = useState(0);
  const [frames, setFrames] = useState<RollingShutterFrame[]>(
    initialLive ? initialFrames : FALLBACK_FRAMES,
  );
  const [hasLiveFrames, setHasLiveFrames] = useState(initialLive);
  const [hasLoadedRealImage, setHasLoadedRealImage] = useState(initialLive);
  const [nameBubbles, setNameBubbles] = useState<NameBubble[]>([]);
  const [loadedSrcByFrameId, setLoadedSrcByFrameId] = useState<Record<string, string>>({});
  const [lastVisibleSrc, setLastVisibleSrc] = useState(FALLBACK_FRAMES[0].url);

  const shaderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fetchInFlightRef = useRef(false);
  const frameCountRef = useRef(frames.length);
  const activeIndexRef = useRef(activeIndex);
  const hasLiveFramesRef = useRef(initialLive);
  const framesRef = useRef(frames);
  const loadingFrameIdsRef = useRef<Set<string>>(new Set());
  const shaderParamsRef = useRef<ShaderParams>(shaderParamsForFrame(FALLBACK_FRAMES[0]));

  useEffect(() => {
    frameCountRef.current = frames.length;
    framesRef.current = frames;
  }, [frames]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    hasLiveFramesRef.current = hasLiveFrames;
  }, [hasLiveFrames]);

  const mergeFrames = useCallback((incoming: RollingShutterFrame[]) => {
    if (incoming.length === 0) {
      return;
    }

    setFrames((previous) => {
      const base = hasLiveFramesRef.current ? previous : [];
      const seen = new Set(base.map((frame) => frame.id));
      const merged = [...base];

      for (let index = 0; index < incoming.length; index += 1) {
        const frame = incoming[index];
        if (seen.has(frame.id)) {
          continue;
        }
        seen.add(frame.id);
        merged.push(frame);
      }

      if (merged.length > MAX_BUFFER_SIZE) {
        return merged.slice(merged.length - MAX_BUFFER_SIZE);
      }

      return merged;
    });

    if (!hasLiveFramesRef.current) {
      hasLiveFramesRef.current = true;
      setHasLiveFrames(true);
    }
  }, []);

  const fetchOpenImagesChunk = useCallback(async () => {
    if (fetchInFlightRef.current) {
      return;
    }

    fetchInFlightRef.current = true;
    try {
      const response = await fetch(`/api/open-images/random?count=${STREAM_FETCH_COUNT}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as OpenImagesBatchResponse;
      const incoming = Array.isArray(payload.frames) ? payload.frames : [];
      if (incoming.length > 0) {
        mergeFrames(incoming);
      }
    } finally {
      fetchInFlightRef.current = false;
    }
  }, [mergeFrames]);

  useEffect(() => {
    void fetchOpenImagesChunk();
  }, [fetchOpenImagesChunk]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const shouldTopUp = frameCountRef.current < TARGET_BUFFER_SIZE;
      if (shouldTopUp || !hasLiveFramesRef.current) {
        void fetchOpenImagesChunk();
      }
    }, STREAM_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [fetchOpenImagesChunk]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const count = frameCountRef.current;
      if (count <= 1) {
        return;
      }
      setActiveIndex((previous) => (previous + 1) % count);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      setClock(now);
      setNameBubbles((previous) => previous.filter((bubble) => now - bubble.bornAt < NAME_LIFETIME_MS));
    }, NAME_TICK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const currentFrames = framesRef.current;
      if (currentFrames.length === 0) {
        return;
      }

      const frame = currentFrames[activeIndexRef.current % currentFrames.length];
      const now = Date.now();
      const angle = Math.random() * Math.PI * 2;
      const radiusX = 16 + Math.random() * 28;
      const radiusY = 12 + Math.random() * 25;
      const x = clamp(50 + Math.cos(angle) * radiusX, 6, 94);
      const y = clamp(50 + Math.sin(angle) * radiusY, 7, 93);

      const nextBubble: NameBubble = {
        id: `${frame.id}-${now}-${Math.floor(Math.random() * 1000)}`,
        text: frame.name,
        x,
        y,
        driftX: (Math.random() * 2 - 1) * 34,
        driftY: -14 - Math.random() * 22,
        rotation: (Math.random() * 2 - 1) * 18,
        hue: 25 + Math.random() * 320,
        bornAt: now,
      };

      setNameBubbles((previous) => {
        const trimmed = previous.slice(-MAX_NAME_BUBBLES + 1);
        return [...trimmed, nextBubble];
      });
    }, NAME_SPAWN_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const canvas = shaderCanvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    });
    if (!gl) {
      return;
    }

    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_seed_a;
      uniform float u_seed_b;
      uniform float u_mode;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vec2 uv = v_uv;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= u_resolution.x / max(1.0, u_resolution.y);

        float t = u_time;
        float n = noise(p * 3.3 + vec2(t * 0.08 + u_seed_a * 9.0, -t * 0.06 + u_seed_b * 7.0));
        float stripes_a = sin((p.x * (24.0 + u_seed_a * 84.0) + p.y * (8.0 + u_seed_b * 22.0)) + t * (0.9 + u_seed_a * 2.4));
        float stripes_b = sin(length(p) * (30.0 + u_seed_b * 68.0) - t * (1.2 + u_seed_b * 2.8));
        float cross = sin((p.x + p.y) * (14.0 + u_seed_a * 42.0) + t * (0.55 + u_seed_b * 1.3));

        float mode = mod(u_mode, 4.0);
        float signal = mix(stripes_a, stripes_b, step(1.0, mode));
        signal = mix(signal, cross, step(2.0, mode));
        signal = mix(signal, n * 2.0 - 1.0, step(3.0, mode));

        float ring = sin(length(p) * (18.0 + u_seed_a * 45.0) - t * (1.9 + u_seed_b * 4.2));
        float edge = smoothstep(1.18, 0.18, length(p));

        float alpha = 0.045 + 0.06 * abs(signal) + 0.04 * abs(ring);
        alpha *= 0.6 + 0.4 * edge;

        vec3 tone_a = 0.5 + 0.5 * cos(vec3(0.0, 2.0, 4.0) + u_seed_a * 6.2831 + t * 0.08);
        vec3 tone_b = 0.5 + 0.5 * cos(vec3(1.7, 3.5, 5.3) + u_seed_b * 6.2831 - t * 0.06);
        vec3 color = mix(tone_a, tone_b, 0.5 + 0.5 * signal);

        gl_FragColor = vec4(color, alpha);
      }
    `;

    function compileShader(type: number, source: string): WebGLShader | null {
      const glInstance = gl;
      if (!glInstance) {
        return null;
      }
      const shader = glInstance.createShader(type);
      if (!shader) {
        return null;
      }
      glInstance.shaderSource(shader, source);
      glInstance.compileShader(shader);
      if (glInstance.getShaderParameter(shader, glInstance.COMPILE_STATUS)) {
        return shader;
      }
      glInstance.deleteShader(shader);
      return null;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) {
      gl.deleteProgram(program);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const seedALocation = gl.getUniformLocation(program, "u_seed_a");
    const seedBLocation = gl.getUniformLocation(program, "u_seed_b");
    const modeLocation = gl.getUniformLocation(program, "u_mode");

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.floor(window.innerWidth * dpr));
      const height = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const start = performance.now();
    let rafId = 0;

    const draw = (now: number) => {
      resize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const shaderParams = shaderParamsRef.current;
      if (timeLocation) {
        gl.uniform1f(timeLocation, (now - start) / 1000);
      }
      if (resolutionLocation) {
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      }
      if (seedALocation) {
        gl.uniform1f(seedALocation, shaderParams.seedA);
      }
      if (seedBLocation) {
        gl.uniform1f(seedBLocation, shaderParams.seedB);
      }
      if (modeLocation) {
        gl.uniform1f(modeLocation, shaderParams.mode);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = window.requestAnimationFrame(draw);
    };

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    resize();
    rafId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  const currentFrame = useMemo(
    () => frames[activeIndex % Math.max(1, frames.length)] ?? FALLBACK_FRAMES[0],
    [activeIndex, frames],
  );

  useEffect(() => {
    shaderParamsRef.current = shaderParamsForFrame(currentFrame);
  }, [currentFrame]);
  const dropDeadFrame = useCallback((frameId: string) => {
    setFrames((previous) => {
      const filtered = previous.filter((item) => item.id !== frameId);
      if (filtered.length === 0) {
        setHasLiveFrames(false);
        return FALLBACK_FRAMES;
      }
      return filtered;
    });
  }, []);

  const ensureFrameLoaded = useCallback(
    (frame: RollingShutterFrame) => {
      if (loadedSrcByFrameId[frame.id] || loadingFrameIdsRef.current.has(frame.id)) {
        return;
      }

      loadingFrameIdsRef.current.add(frame.id);
      const candidates = buildUrlCandidates(frame);

      void (async () => {
        for (let index = 0; index < candidates.length; index += 1) {
          const candidate = candidates[index];
          const ok = await tryLoadImage(candidate);
          if (!ok) {
            continue;
          }

          setLoadedSrcByFrameId((previous) => {
            if (previous[frame.id]) {
              return previous;
            }
            return { ...previous, [frame.id]: candidate };
          });
          if (!frame.rawId.startsWith("fallback-")) {
            setHasLoadedRealImage(true);
          }
          return;
        }

        if (frame.rawId.startsWith("fallback-")) {
          setLoadedSrcByFrameId((previous) => ({ ...previous, [frame.id]: frame.url }));
          setHasLoadedRealImage(true);
          return;
        }

        dropDeadFrame(frame.id);
      })().finally(() => {
        loadingFrameIdsRef.current.delete(frame.id);
      });
    },
    [dropDeadFrame, loadedSrcByFrameId],
  );

  useEffect(() => {
    ensureFrameLoaded(currentFrame);
  }, [currentFrame, ensureFrameLoaded]);

  useEffect(() => {
    const count = frames.length;
    if (count === 0) {
      return;
    }
    for (let offset = 1; offset <= 3; offset += 1) {
      const frame = frames[(activeIndex + offset) % count];
      if (frame) {
        ensureFrameLoaded(frame);
      }
    }
  }, [activeIndex, ensureFrameLoaded, frames]);

  useEffect(() => {
    const loaded = loadedSrcByFrameId[currentFrame.id];
    if (loaded) {
      setLastVisibleSrc(loaded);
      setHasLoadedRealImage(true);
    }
  }, [currentFrame.id, loadedSrcByFrameId]);

  const visibleFrameSrc = loadedSrcByFrameId[currentFrame.id] ?? lastVisibleSrc;

  return (
    <div className="relative min-h-[100svh] h-[100dvh] w-full overflow-hidden bg-[#020202]">
      <MobileControlsPane
        rootClassName="absolute left-4 top-4 z-30 w-[min(92vw,28rem)]"
        panelClassName="flex flex-col gap-3 border border-white/15 bg-black/55 px-4 py-4 backdrop-blur-sm"
      >
        <PieceNavigationControls pieceId={5} className="mt-0" hideArtistCard hidePieceGrid />
        <h1 className="font-pixel-square text-3xl leading-none text-orange-200 sm:text-4xl">
          Rolling Shutter
        </h1>
        <p className="font-sans text-xs leading-relaxed text-white/80 sm:text-sm">
          The central frame cycles through sourced images at a fixed interval while overlays stay
          constant. The rapid turnover feels restless and slightly disorienting.
        </p>
        <PieceNavigationControls pieceId={5} hideQuickLinks />
      </MobileControlsPane>

      <div className="absolute left-1/2 top-1/2 z-10 w-[min(84vmin,860px)] -translate-x-1/2 -translate-y-1/2">
        <div className="relative aspect-square overflow-hidden border border-white/95 bg-black shadow-[0_0_0_2px_rgba(255,255,255,0.2)]">
          <img
            src={visibleFrameSrc}
            alt={currentFrame.alt}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              imageRendering: "auto",
              filter: "brightness(1) contrast(1) saturate(1)",
            }}
            referrerPolicy="no-referrer"
          />

          {!hasLoadedRealImage ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
              <div
                className="h-40 w-40 rounded-full border-2 border-white/85"
                style={{
                  boxShadow: "0 0 0 2px rgba(255,255,255,0.18), inset 0 0 0 1px rgba(255,255,255,0.32)",
                  transform: `rotate(${((clock / 24) % 360).toFixed(2)}deg)`,
                }}
              />
              <p className="mt-8 px-6 text-center font-sans text-2xl font-extrabold tracking-[0.02em] text-white sm:text-3xl">
                Loading... Please hold...
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <canvas
        ref={shaderCanvasRef}
        className="pointer-events-none absolute inset-0 touch-none"
        style={{ zIndex: 15, mixBlendMode: "screen", opacity: 0.86 }}
      />

      <div className="pointer-events-none absolute inset-0 z-20">
        {nameBubbles.map((bubble) => {
          const age = clock - bubble.bornAt;
          const t = age / NAME_LIFETIME_MS;
          const opacity = computeBubbleOpacity(t);
          const translateX = bubble.driftX * t;
          const translateY = bubble.driftY * t;
          const scale = 0.88 + Math.sin(Math.min(1, t) * Math.PI) * 0.14;

          return (
            <span
              key={bubble.id}
              className="absolute whitespace-nowrap font-pixel-square text-xl leading-none tracking-[0.04em] sm:text-2xl"
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                transform: `translate(-50%, -50%) translate(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px) rotate(${bubble.rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
                opacity,
                color: `hsla(${bubble.hue.toFixed(0)}, 78%, 78%, ${Math.min(0.95, opacity).toFixed(3)})`,
                textShadow: `0 0 22px hsla(${bubble.hue.toFixed(0)}, 84%, 68%, ${(0.55 * opacity).toFixed(3)})`,
              }}
            >
              {bubble.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
