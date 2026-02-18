import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Filter } from "bad-words";
import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GuestbookEntry = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

const DATA_FILE = join(process.cwd(), "output", "guestbook.json");
const MAX_NAME_LENGTH = 64;
const MAX_MESSAGE_LENGTH = 50;
const MAX_ENTRIES = 500;
const ALPHANUMERIC_AND_SPACES_ONLY = /^[a-z0-9 ]+$/i;
const profanityFilter = new Filter();
const DATABASE_URL = process.env.DATABASE_URL ?? "";

const globalDbState = globalThis as typeof globalThis & {
  guestbookPool?: Pool;
  guestbookSchemaReady?: Promise<void>;
};

const guestbookPool =
  DATABASE_URL.length > 0
    ? (globalDbState.guestbookPool ??=
        new Pool({
          connectionString: DATABASE_URL,
          max: 3,
        }))
    : null;

function isAlphanumericWithSpaces(value: string): boolean {
  return ALPHANUMERIC_AND_SPACES_ONLY.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeEntry(value: unknown): GuestbookEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === "string" ? value.id : "";
  const name = typeof value.name === "string" ? value.name : "";
  const message = typeof value.message === "string" ? value.message : "";
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : "";

  if (!id || !name || !message || !createdAt) {
    return null;
  }

  return { id, name, message, createdAt };
}

function toIsoTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

async function ensureGuestbookSchema(): Promise<void> {
  if (!guestbookPool) {
    return;
  }

  if (!globalDbState.guestbookSchemaReady) {
    globalDbState.guestbookSchemaReady = guestbookPool
      .query(
        `
          CREATE TABLE IF NOT EXISTS guestbook_entries (
            id TEXT PRIMARY KEY,
            name VARCHAR(64) NOT NULL,
            message VARCHAR(50) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS guestbook_entries_created_at_idx
            ON guestbook_entries (created_at DESC);
        `,
      )
      .then(() => undefined);
  }

  await globalDbState.guestbookSchemaReady;
}

type GuestbookRow = {
  id: string;
  name: string;
  message: string;
  created_at: string | Date;
};

async function readEntriesFromDatabase(): Promise<GuestbookEntry[]> {
  if (!guestbookPool) {
    return [];
  }

  await ensureGuestbookSchema();
  const result = await guestbookPool.query<GuestbookRow>(
    `
      SELECT id, name, message, created_at
      FROM guestbook_entries
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [MAX_ENTRIES],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: toIsoTimestamp(row.created_at),
  }));
}

async function readEntries(): Promise<GuestbookEntry[]> {
  if (guestbookPool) {
    return readEntriesFromDatabase();
  }

  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const entries: GuestbookEntry[] = [];
    for (let index = 0; index < parsed.length; index += 1) {
      const entry = normalizeEntry(parsed[index]);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  } catch {
    return [];
  }
}

async function trimDatabaseEntries(): Promise<void> {
  if (!guestbookPool) {
    return;
  }

  await guestbookPool.query(
    `
      DELETE FROM guestbook_entries
      WHERE id IN (
        SELECT id
        FROM guestbook_entries
        ORDER BY created_at DESC
        OFFSET $1
      )
    `,
    [MAX_ENTRIES],
  );
}

async function insertEntryIntoDatabase(entry: GuestbookEntry): Promise<void> {
  if (guestbookPool) {
    await ensureGuestbookSchema();
    await guestbookPool.query(
      `
        INSERT INTO guestbook_entries (id, name, message, created_at)
        VALUES ($1, $2, $3, $4::timestamptz)
      `,
      [entry.id, entry.name, entry.message, entry.createdAt],
    );
    await trimDatabaseEntries();
    return;
  }
}

async function writeEntries(entries: GuestbookEntry[]): Promise<void> {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf8");
}

export async function GET() {
  const entries = await readEntries();
  return NextResponse.json({ entries }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const rawName = typeof body.name === "string" ? body.name : "";
    const rawMessage = typeof body.message === "string" ? body.message : "";

    const name = rawName.trim().slice(0, MAX_NAME_LENGTH);
    const message = rawMessage.trim().slice(0, MAX_MESSAGE_LENGTH);

    if (!name || !message) {
      return NextResponse.json(
        { error: "Name and message are required." },
        { status: 400 },
      );
    }

    if (!isAlphanumericWithSpaces(name) || !isAlphanumericWithSpaces(message)) {
      return NextResponse.json(
        { error: "Only letters, numbers, and spaces are allowed." },
        { status: 400 },
      );
    }

    if (profanityFilter.isProfane(name) || profanityFilter.isProfane(message)) {
      return NextResponse.json(
        { error: "Profanity is not allowed." },
        { status: 400 },
      );
    }

    const entry: GuestbookEntry = {
      id: randomUUID(),
      name,
      message,
      createdAt: new Date().toISOString(),
    };

    if (guestbookPool) {
      await insertEntryIntoDatabase(entry);
    } else {
      const entries = await readEntries();
      entries.unshift(entry);
      if (entries.length > MAX_ENTRIES) {
        entries.length = MAX_ENTRIES;
      }

      await writeEntries(entries);
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to save entry." }, { status: 500 });
  }
}
