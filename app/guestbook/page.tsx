"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

type GuestbookEntry = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

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

export default function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const nameInputRef = useRef<HTMLInputElement | null>(null);

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

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

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
    <main className="min-h-screen bg-[#09090d] text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex border border-white/35 bg-black/65 px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.09em] text-white/92 backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            back to start
          </Link>
          <Link
            href="/pieces/1"
            className="inline-flex border border-white/35 bg-black/65 px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.09em] text-white/92 backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            back to pieces
          </Link>
        </div>

        <header className="space-y-2">
          <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-white/55">Public Canvas</p>
          <h1 className="font-pixel-square text-4xl text-cyan-100 sm:text-5xl">Agentic Artistry Guestbook</h1>
          <p className="max-w-3xl font-sans text-sm text-white/76 sm:text-base">
            Leave your name and one message about agentic artistry. This is intentionally simple and
            public.
          </p>
        </header>

        <button
          type="button"
          onClick={openForm}
          className="relative min-h-48 overflow-hidden border border-cyan-200/30 bg-[#0d1424] p-5 text-left transition-colors hover:border-cyan-200/60 hover:bg-[#101a2f]"
        >
          <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_20%_20%,rgba(103,191,255,0.45)_0,transparent_26%),radial-gradient(circle_at_72%_68%,rgba(152,205,255,0.3)_0,transparent_32%),linear-gradient(135deg,rgba(14,21,38,0.96),rgba(11,16,31,0.88))]" />
          <div className="pointer-events-none absolute inset-0 opacity-14 [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.16)_0px,rgba(255,255,255,0.16)_1px,transparent_1px,transparent_7px),repeating-linear-gradient(90deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_1px,transparent_1px,transparent_7px)]" />
          <div className="relative z-10">
            <p className="font-sans text-xs uppercase tracking-[0.12em] text-cyan-100/78">Click to sign the canvas</p>
            <p className="mt-2 font-sans text-sm text-white/84 sm:text-base">
              Share your name and one thought on agentic artistry.
            </p>
          </div>
        </button>

        {showForm ? (
          <form onSubmit={handleSubmit} className="grid gap-3 border border-white/15 bg-black/45 p-4 sm:p-5">
            <label className="grid gap-1 font-sans text-xs uppercase tracking-[0.1em] text-white/65">
              Name
              <input
                ref={nameInputRef}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={64}
                className="h-10 border border-white/30 bg-black/60 px-3 font-sans text-sm text-white outline-none ring-0 placeholder:text-white/35 focus:border-cyan-200"
                placeholder="Your name"
              />
            </label>

            <label className="grid gap-1 font-sans text-xs uppercase tracking-[0.1em] text-white/65">
              Message About Agentic Artistry
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={700}
                rows={4}
                className="border border-white/30 bg-black/60 px-3 py-2 font-sans text-sm text-white outline-none ring-0 placeholder:text-white/35 focus:border-cyan-200"
                placeholder="What does agentic artistry mean to you?"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex border border-cyan-200/60 bg-cyan-300/90 px-3 py-2 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "posting..." : "post message"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex border border-white/35 bg-black/65 px-3 py-2 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-white"
              >
                cancel
              </button>
            </div>
          </form>
        ) : null}

        {error ? <p className="font-sans text-sm text-red-300">{error}</p> : null}

        <section className="space-y-3">
          <h2 className="font-sans text-xs uppercase tracking-[0.13em] text-white/58">Recent Signatures</h2>

          {loading ? (
            <p className="font-sans text-sm text-white/62">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="font-sans text-sm text-white/62">No entries yet. Be the first to sign.</p>
          ) : (
            <ul className="grid gap-2">
              {entries.map((entry) => {
                const when = new Date(entry.createdAt);
                const stamp = Number.isNaN(when.getTime()) ? entry.createdAt : when.toLocaleString();

                return (
                  <li key={entry.id} className="border border-white/12 bg-black/35 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-sans text-sm font-semibold text-cyan-100">{entry.name}</p>
                      <p className="font-sans text-[11px] uppercase tracking-[0.08em] text-white/50">{stamp}</p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap font-sans text-sm text-white/84">{entry.message}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
