"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type GuestbookEntry = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

const MAX_NAME_LENGTH = 64;
const MAX_MESSAGE_LENGTH = 50;
const NON_ALPHANUMERIC_OR_SPACE = /[^a-z0-9 ]/gi;

function sanitizeAlphanumeric(value: string, maxLength: number): string {
  return value.replace(NON_ALPHANUMERIC_OR_SPACE, "").slice(0, maxLength);
}

async function fetchEntries(): Promise<GuestbookEntry[]> {
  const response = await fetch("/api/guestbook", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load guestbook.");
  }

  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("entries" in payload) ||
    !Array.isArray((payload as { entries: unknown }).entries)
  ) {
    return [];
  }

  return ((payload as { entries: unknown[] }).entries ?? [])
    .filter((entry): entry is GuestbookEntry => {
      return (
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as { id?: unknown }).id === "string" &&
        typeof (entry as { name?: unknown }).name === "string" &&
        typeof (entry as { message?: unknown }).message === "string" &&
        typeof (entry as { createdAt?: unknown }).createdAt === "string"
      );
    })
    .slice(0, 200);
}

type EntryLayout = {
  x: number;
  y: number;
  width: number;
};

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createEntryLayout(id: string): EntryLayout {
  const hash = hashString(id);

  return {
    x: 7 + ((hash & 1023) / 1023) * 86,
    y: 8 + (((hash >>> 10) & 1023) / 1023) * 82,
    width: 220 + (((hash >>> 4) & 255) / 255) * 320,
  };
}

export default function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const laidOutEntries = useMemo(() => {
    return entries.slice(0, 240).map((entry) => ({
      entry,
      layout: createEntryLayout(entry.id),
    }));
  }, [entries]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const nextEntries = await fetchEntries();
        if (!active) {
          return;
        }
        setEntries(nextEntries);
        setError("");
      } catch {
        if (!active) {
          return;
        }
        setError("Could not load the guestbook.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#f7f6f2";
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(151, 28, 36, 0.34)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(84.5, 0);
      context.lineTo(84.5, height);
      context.stroke();

      context.strokeStyle = "rgba(12, 17, 21, 0.06)";
      context.lineWidth = 1;
      for (let y = 14; y < height; y += 24) {
        context.beginPath();
        context.moveTo(0, y + 0.5);
        context.lineTo(width, y + 0.5);
        context.stroke();
      }
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [laidOutEntries]);

  const openForm = () => {
    setShowForm(true);
    setError("");
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const trimmedName = sanitizeAlphanumeric(name.trim(), MAX_NAME_LENGTH);
    const trimmedMessage = sanitizeAlphanumeric(message.trim(), MAX_MESSAGE_LENGTH);

    if (!trimmedName || !trimmedMessage) {
      setError("Name and message are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          message: trimmedMessage,
        }),
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const apiError =
          typeof payload === "object" && payload !== null && typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "Unable to save your message.";
        throw new Error(apiError);
      }

      const payload: unknown = await response.json();
      const entry =
        typeof payload === "object" &&
        payload !== null &&
        "entry" in payload &&
        typeof (payload as { entry?: unknown }).entry === "object" &&
        (payload as { entry?: unknown }).entry !== null
          ? ((payload as { entry: GuestbookEntry }).entry as GuestbookEntry)
          : null;

      if (!entry) {
        throw new Error("Unable to save your message.");
      }

      setEntries((previous) => [entry, ...previous]);
      setName("");
      setMessage("");
      setShowForm(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save your message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-[100svh] h-[100dvh] overflow-hidden bg-[#f7f6f2] text-[#0b0d0f]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

      <div className="relative z-10 min-h-[100svh] h-[100dvh]">
        <div className="pointer-events-auto absolute left-3 top-3 flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center border border-black/70 bg-yellow-300 px-3 py-2 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:bg-yellow-200 sm:min-h-0 sm:py-1.5 sm:text-[11px]"
          >
            start
          </Link>
          <Link
            href="/pieces/1"
            className="inline-flex min-h-10 items-center justify-center border border-black/35 bg-[#f7f6f2]/92 px-3 py-2 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-black/72 transition-colors hover:bg-[#f7f6f2] sm:min-h-0 sm:py-1.5 sm:text-[11px]"
          >
            pieces
          </Link>
        </div>

        {!showForm ? (
          <button
            type="button"
            onClick={openForm}
            className="pointer-events-auto absolute right-3 top-3 inline-flex items-center gap-2 border-2 border-black bg-black px-5 py-3 font-sans text-base font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#161616]"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] shrink-0"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.5 20.5L8.1 19.6L18.9 8.8C20.1 7.6 20.1 5.7 18.9 4.5C17.7 3.3 15.8 3.3 14.6 4.5L3.8 15.3L3.5 20.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.8 6.3L17.1 10.6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 18.8L5.2 16.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            sign
          </button>
        ) : null}

        {showForm ? (
          <form
            onSubmit={handleSubmit}
            className="pointer-events-auto absolute right-3 top-12 flex w-[min(92vw,360px)] flex-col gap-2 border border-black/24 bg-[#f7f6f2]/95 p-3 backdrop-blur-sm"
          >
            <input
              ref={nameInputRef}
              value={name}
              onChange={(event) => setName(sanitizeAlphanumeric(event.target.value, MAX_NAME_LENGTH))}
              maxLength={MAX_NAME_LENGTH}
              className="h-10 border border-black/24 bg-transparent px-2 font-sans text-sm text-black outline-none ring-0 placeholder:text-black/38 focus:border-black/55"
              placeholder="name (a-z, 0-9, spaces)"
            />
            <textarea
              value={message}
              onChange={(event) => setMessage(sanitizeAlphanumeric(event.target.value, MAX_MESSAGE_LENGTH))}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={4}
              className="border border-black/24 bg-transparent px-2 py-2 font-sans text-sm text-black outline-none ring-0 placeholder:text-black/38 focus:border-black/55"
              placeholder="message (max 50, a-z, 0-9, spaces)"
            />
            <p className="font-sans text-[10px] uppercase tracking-[0.1em] text-black/48">
              {message.length}/{MAX_MESSAGE_LENGTH}
            </p>
            <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.16em]">
              <button
                type="submit"
                disabled={submitting}
                className="min-h-9 border border-black/35 px-3 py-1 text-black/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "..." : "post"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="min-h-9 border border-black/20 px-3 py-1 text-black/60"
              >
                close
              </button>
            </div>
          </form>
        ) : null}

        {error ? (
          <p className="pointer-events-none absolute bottom-3 left-3 font-sans text-xs uppercase tracking-[0.1em] text-red-700/85">
            {error}
          </p>
        ) : null}

        {loading && laidOutEntries.length === 0 ? (
          <p className="pointer-events-none absolute bottom-3 right-3 font-sans text-[10px] uppercase tracking-[0.16em] text-black/38">
            loading
          </p>
        ) : null}

        {!loading && laidOutEntries.length === 0 ? (
          <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-sans text-[11px] uppercase tracking-[0.18em] text-black/35">
            be first
          </p>
        ) : null}

        <section className="pointer-events-none absolute inset-0">
          {laidOutEntries.map(({ entry, layout }) => (
            <article
              key={entry.id}
              className="absolute whitespace-pre-wrap leading-snug [text-wrap:balance]"
              style={{
                left: `${layout.x}%`,
                top: `${layout.y}%`,
                transform: "translate(-50%, -50%)",
                maxWidth: `${layout.width}px`,
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.01em",
                color: "#8f1f2a",
                opacity: 0.96,
                zIndex: 12,
              }}
            >
              <span className="mr-2 uppercase tracking-[0.02em]" style={{ color: "#1d4ed8" }}>
                {entry.name}
              </span>
              <span>{entry.message}</span>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
