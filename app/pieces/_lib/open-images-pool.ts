import "server-only";

import type { RollingShutterFrame } from "./rolling-shutter-types";

type OpenImagesSplit = "train" | "validation" | "test";

type OpenImagesIdReference = {
  id: string;
  split: OpenImagesSplit;
};

type OpenImagesSource = {
  split: OpenImagesSplit;
  url: string;
};

type PoolStatus = "idle" | "warming" | "ready" | "error";

const OPEN_IMAGES_DOWNLOAD_PAGE =
  "https://storage.googleapis.com/openimages/web/download_v7.html#download-manually";

const OPEN_IMAGES_IMAGE_HOST = "https://open-images-dataset.s3.amazonaws.com";

const OPEN_IMAGES_ID_SOURCES: OpenImagesSource[] = [
  {
    split: "validation",
    url: "https://storage.googleapis.com/openimages/2018_04/validation/validation-images-with-rotation.csv",
  },
  {
    split: "test",
    url: "https://storage.googleapis.com/openimages/2018_04/test/test-images-with-rotation.csv",
  },
];

const ID_FETCH_TIMEOUT_MS = 60000;
const SAMPLE_SIZE_PER_SOURCE = 12000;

let pool: OpenImagesIdReference[] = [];
let poolStatus: PoolStatus = "idle";

function normalizeOpenImagesId(raw: string): string | null {
  const trimmed = raw.trim().replace(/^"+|"+$/g, "");
  if (!trimmed) {
    return null;
  }
  if (!/^[0-9a-f]{16}$/i.test(trimmed)) {
    return null;
  }
  return trimmed.toLowerCase();
}

function parseSourceLine(source: OpenImagesSource, line: string): OpenImagesIdReference | null {
  const row = line.trim();
  if (!row) {
    return null;
  }

  const firstCell = row.split(",")[0]?.trim() ?? "";
  if (!firstCell || firstCell.toLowerCase() === "imageid") {
    return null;
  }

  let split: OpenImagesSplit = source.split;
  let rawId = firstCell;

  if (firstCell.includes("/")) {
    const [rawSplit, idCandidate] = firstCell.split("/", 2);
    const normalizedSplit = rawSplit.trim().toLowerCase();
    if (normalizedSplit === "train" || normalizedSplit === "validation" || normalizedSplit === "test") {
      split = normalizedSplit;
    }
    rawId = idCandidate ?? rawId;
  }

  const normalizedId = normalizeOpenImagesId(rawId);
  if (!normalizedId) {
    return null;
  }

  return { split, id: normalizedId };
}

function pushReservoir(
  reservoir: OpenImagesIdReference[],
  candidate: OpenImagesIdReference,
  seenCount: number,
): void {
  if (reservoir.length < SAMPLE_SIZE_PER_SOURCE) {
    reservoir.push(candidate);
    return;
  }

  const replaceIndex = Math.floor(Math.random() * seenCount);
  if (replaceIndex < SAMPLE_SIZE_PER_SOURCE) {
    reservoir[replaceIndex] = candidate;
  }
}

async function streamSampleSource(source: OpenImagesSource): Promise<OpenImagesIdReference[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ID_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(source.url, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      return [];
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const reservoir: OpenImagesIdReference[] = [];

    let seen = 0;
    let carry = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      carry += decoder.decode(value, { stream: true });
      let newlineIndex = carry.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = carry.slice(0, newlineIndex);
        carry = carry.slice(newlineIndex + 1);

        const reference = parseSourceLine(source, line);
        if (reference) {
          seen += 1;
          pushReservoir(reservoir, reference, seen);
        }

        newlineIndex = carry.indexOf("\n");
      }
    }

    carry += decoder.decode();
    const lastReference = parseSourceLine(source, carry);
    if (lastReference) {
      seen += 1;
      pushReservoir(reservoir, lastReference, seen);
    }

    return reservoir;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function dedupeIds(list: OpenImagesIdReference[]): OpenImagesIdReference[] {
  const seen = new Set<string>();
  const deduped: OpenImagesIdReference[] = [];

  for (let index = 0; index < list.length; index += 1) {
    const entry = list[index];
    const key = `${entry.split}/${entry.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(entry);
  }

  return deduped;
}

function buildOpenImagesImageUrl(split: OpenImagesSplit, id: string): string {
  return `${OPEN_IMAGES_IMAGE_HOST}/${split}/${id}.jpg`;
}

function mapIdToFrame(reference: OpenImagesIdReference): RollingShutterFrame {
  return {
    id: `open-images-${reference.split}-${reference.id}`,
    url: buildOpenImagesImageUrl(reference.split, reference.id),
    alt: `Open Images ${reference.split} frame ${reference.id}`,
    name: `${reference.split}/${reference.id}.jpg`,
    split: reference.split,
    rawId: reference.id,
    sourceLabel: `Open Images (${reference.split})`,
    sourceUrl: OPEN_IMAGES_DOWNLOAD_PAGE,
  };
}

function selectRandomSubset<T>(items: readonly T[], count: number): T[] {
  if (items.length === 0 || count <= 0) {
    return [];
  }

  if (count >= items.length) {
    return [...items];
  }

  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = temp;
  }

  return copy.slice(0, count);
}

function setPool(next: OpenImagesIdReference[]): void {
  pool = dedupeIds(next);
}

function ensurePoolWarmup(): void {
  if (poolStatus === "warming" || poolStatus === "ready") {
    return;
  }

  poolStatus = "warming";
  void (async () => {
    const nextPool: OpenImagesIdReference[] = [];

    for (let index = 0; index < OPEN_IMAGES_ID_SOURCES.length; index += 1) {
      const sampled = await streamSampleSource(OPEN_IMAGES_ID_SOURCES[index]);
      if (sampled.length > 0) {
        nextPool.push(...sampled);
        setPool(nextPool);
      }
    }

    if (pool.length > 0) {
      poolStatus = "ready";
      return;
    }

    poolStatus = "error";
  })()
    .catch(() => {
      poolStatus = "error";
    });
}

export function getOpenImagesPoolSnapshot(): { status: PoolStatus; poolSize: number } {
  ensurePoolWarmup();
  return {
    status: poolStatus,
    poolSize: pool.length,
  };
}

export function getRollingShutterFrameBatch(frameCount: number): {
  frames: RollingShutterFrame[];
  status: PoolStatus;
  poolSize: number;
} {
  const normalizedCount = Math.max(1, Math.floor(frameCount));
  const snapshot = getOpenImagesPoolSnapshot();

  if (snapshot.poolSize === 0) {
    return {
      frames: [],
      status: snapshot.status,
      poolSize: snapshot.poolSize,
    };
  }

  return {
    frames: selectRandomSubset(pool, normalizedCount).map(mapIdToFrame),
    status: snapshot.status,
    poolSize: snapshot.poolSize,
  };
}

export function getRollingShutterSsrFrames(frameCount: number): RollingShutterFrame[] {
  return getRollingShutterFrameBatch(frameCount).frames;
}
