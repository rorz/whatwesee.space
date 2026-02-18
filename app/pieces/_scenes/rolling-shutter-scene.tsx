"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PieceNavigationControls from "../_components/piece-navigation-controls";
import { PIECE_COUNT } from "../_lib/piece-constants";

type RollingPhoto = {
  id: string;
  url: string;
  alt: string;
  color: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
};

type UnsplashRandomResponse = {
  photos?: RollingPhoto[];
  source?: string;
  topic?: string;
  reason?: string;
};

const ROTATION_INTERVAL_MS = 200;
const PREFETCH_COUNT = 30;
const MIN_BUFFER_SIZE = 18;
const MAX_BUFFER_SIZE = 140;

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function makeFallbackImage(index: number): RollingPhoto {
  const warm = Math.floor(55 + seededNoise(index * 2.1 + 3.7) * 95);
  const mid = Math.floor(28 + seededNoise(index * 3.8 + 9.2) * 55);
  const deep = Math.floor(15 + seededNoise(index * 5.4 + 2.8) * 35);

  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 560 560'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='rgb(${warm},${mid},${deep})'/>
          <stop offset='100%' stop-color='rgb(${Math.min(255, warm + 35)},${Math.min(255, mid + 25)},${Math.min(255, deep + 20)})'/>
        </linearGradient>
      </defs>
      <rect width='560' height='560' fill='url(#g)'/>
      <g opacity='0.28'>
        <rect x='0' y='${30 + (index % 12) * 42}' width='560' height='18' fill='white'/>
        <rect x='0' y='${70 + (index % 8) * 50}' width='560' height='10' fill='white'/>
      </g>
      <text x='36' y='522' fill='rgba(255,255,255,0.8)' font-family='monospace' font-size='18'>UNSPLASH KEY REQUIRED</text>
    </svg>
  `;

  return {
    id: `fallback-${index}`,
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    alt: "Rolling Shutter fallback frame",
    color: `rgb(${warm}, ${mid}, ${deep})`,
    photographer: "local fallback",
    photographerUrl: "https://unsplash.com",
    unsplashUrl: "https://unsplash.com",
  };
}

const FALLBACK_FRAMES: RollingPhoto[] = Array.from({ length: 24 }, (_, index) =>
  makeFallbackImage(index),
);

export default function RollingShutterScene() {
  const [frames, setFrames] = useState<RollingPhoto[]>(FALLBACK_FRAMES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [topic, setTopic] = useState("mixed");
  const [usingUnsplash, setUsingUnsplash] = useState(false);
  const [notice, setNotice] = useState("Loading feed...");

  const frameCountRef = useRef(frames.length);
  const fetchInFlightRef = useRef(false);
  const usingUnsplashRef = useRef(usingUnsplash);

  useEffect(() => {
    frameCountRef.current = frames.length;
  }, [frames.length]);

  useEffect(() => {
    usingUnsplashRef.current = usingUnsplash;
  }, [usingUnsplash]);

  const mergeFrames = useCallback((incoming: RollingPhoto[]) => {
    if (incoming.length === 0) {
      return;
    }

    setFrames((previous) => {
      const base = usingUnsplashRef.current ? previous : [];
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
  }, []);

  const fetchUnsplashBatch = useCallback(async () => {
    if (fetchInFlightRef.current) {
      return;
    }

    fetchInFlightRef.current = true;

    try {
      const response = await fetch(`/api/unsplash/random?count=${PREFETCH_COUNT}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as UnsplashRandomResponse;
      const photos = Array.isArray(payload.photos) ? payload.photos : [];

      if (photos.length > 0) {
        setUsingUnsplash(true);
        mergeFrames(photos);
        setTopic(payload.topic ?? "mixed");
        setNotice("Live Unsplash feed");
      } else if (payload.reason === "missing_unsplash_access_key") {
        setNotice("Set UNSPLASH_ACCESS_KEY to enable live images");
      } else if (payload.reason === "unsplash_fetch_failed") {
        setNotice("Unsplash API limit reached or temporarily unavailable");
      }
    } catch {
      setNotice("Image feed temporarily unavailable");
    } finally {
      fetchInFlightRef.current = false;
    }
  }, [mergeFrames]);

  useEffect(() => {
    void fetchUnsplashBatch();
  }, [fetchUnsplashBatch]);

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
    if (frames.length < MIN_BUFFER_SIZE) {
      void fetchUnsplashBatch();
    }
  }, [frames.length, fetchUnsplashBatch]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (frameCountRef.current < MIN_BUFFER_SIZE * 2) {
        void fetchUnsplashBatch();
      }
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [fetchUnsplashBatch]);

  const currentFrame = useMemo(
    () => frames[activeIndex % Math.max(1, frames.length)] ?? FALLBACK_FRAMES[0],
    [activeIndex, frames],
  );

  const previousFrame = useMemo(() => {
    if (frames.length <= 1) {
      return currentFrame;
    }
    const previousIndex = (activeIndex - 1 + frames.length) % frames.length;
    return frames[previousIndex] ?? currentFrame;
  }, [activeIndex, currentFrame, frames]);

  const jitterRotate = (seededNoise(activeIndex * 3.9 + 1.7) * 2 - 1) * 8;
  const jitterScale = 1.04 + seededNoise(activeIndex * 5.7 + 0.8) * 0.18;
  const frameSkew = (seededNoise(activeIndex * 4.3 + 9.1) * 2 - 1) * 2.8;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#060203] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(181,84,52,0.22),transparent_52%),radial-gradient(circle_at_85%_75%,rgba(58,18,16,0.38),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_4px)]" />

      <div className="absolute left-4 top-4 z-20 flex max-w-md flex-col gap-3 border border-white/15 bg-black/55 px-4 py-4 backdrop-blur-sm">
        <p className="font-sans text-[11px] uppercase tracking-[0.11em] text-white/58">
          Exhibition Piece 5 / {PIECE_COUNT}
        </p>
        <h1 className="font-pixel-square text-3xl leading-none text-orange-200 sm:text-4xl">
          Rolling Shutter
        </h1>
        <p className="font-sans text-xs leading-relaxed text-white/80 sm:text-sm">
          A low-res flood of images flips every 0.2 seconds, creating false continuity from
          unrelated frames.
        </p>
        <PieceNavigationControls pieceId={5} />
      </div>

      <div className="absolute left-1/2 top-1/2 z-10 w-[min(78vmin,720px)] -translate-x-1/2 -translate-y-1/2">
        <div className="relative aspect-square overflow-hidden border border-white/30 bg-black shadow-[0_0_0_1px_rgba(0,0,0,0.55),0_28px_100px_rgba(0,0,0,0.68)]">
          <img
            src={previousFrame.url}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-30 blur-[2px]"
            aria-hidden
          />
          <img
            key={`${currentFrame.id}-${activeIndex}`}
            src={currentFrame.url}
            alt={currentFrame.alt}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-150"
            style={{
              transform: `translateZ(0) rotate(${jitterRotate.toFixed(2)}deg) scale(${jitterScale.toFixed(3)}) skew(${frameSkew.toFixed(2)}deg)`,
              transformOrigin: "50% 50%",
            }}
          />
          <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-45 [background-image:linear-gradient(90deg,rgba(255,255,255,0.08),transparent_45%,rgba(255,255,255,0.1))]" />
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_1px,transparent_1px,transparent_3px)]" />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-white/15 bg-black/55 px-3 py-2 font-sans text-[11px] uppercase tracking-[0.08em] text-white/80">
          <span>{notice}</span>
          <span>buffer {frames.length}</span>
          <span>topic {topic}</span>
        </div>

        <div className="mt-2 font-sans text-xs text-white/78">
          {usingUnsplash ? (
            <p>
              Photo by{" "}
              <a
                href={currentFrame.photographerUrl}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/40 underline-offset-2 hover:text-white"
              >
                {currentFrame.photographer}
              </a>{" "}
              on{" "}
              <a
                href={currentFrame.unsplashUrl}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/40 underline-offset-2 hover:text-white"
              >
                Unsplash
              </a>
            </p>
          ) : (
            <p>Fallback mode active until an Unsplash access key is configured.</p>
          )}
        </div>
      </div>
    </div>
  );
}
