import PieceViewClient from "./piece-view-client";

const PIECE_COUNT = 10;

const PIECE_TITLES = [
  "Token Ceiling",
  "Latent Bloom",
  "Edge Grammar",
  "Ghost Buffer",
  "Soft Prompt",
  "State Mirror",
  "Silent Branch",
  "Fork Pulse",
  "Memory Lattice",
  "Final Resolve",
];

const TOKEN_CORPUS_TEXT = `
Language travels in fragments before it becomes whole.
The room listens while thought turns into form, then fails, then forms again.
Our agents rehearse memory, revision, and intuition in a luminous grid.
Signals gather, split, and return as if every sentence were a living structure.
A prompt is not an instruction alone; it is a weather system for intent.
Artists and machines meet in iterative loops of attention and surprise.
Meaning appears as compression, distortion, rhythm, and selective recall.
The model learns edge by edge, token by token, frame by frame.
What we see is the residue of countless micro-decisions in motion.
From noise comes pattern, from pattern comes language, from language comes world.
`;

type PieceRouteParams = {
  id?: string | string[];
};

type PiecePageProps = {
  params: Promise<PieceRouteParams> | PieceRouteParams;
};

function wrapPiece(id: number): number {
  if (id < 1) {
    return PIECE_COUNT;
  }
  if (id > PIECE_COUNT) {
    return 1;
  }
  return id;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function collectWordTokens(word: string): string[] {
  const options = new Set<string>();

  if (word.length >= 2 && word.length <= 5) {
    options.add(word);
  }

  for (let length = 2; length <= 5; length += 1) {
    if (word.length < length) {
      continue;
    }
    options.add(word.slice(0, length));
    options.add(word.slice(word.length - length));
  }

  if (word.length >= 6) {
    const middleLength = Math.min(5, Math.max(2, Math.floor(word.length * 0.45)));
    const middleStart = Math.floor((word.length - middleLength) / 2);
    options.add(word.slice(middleStart, middleStart + middleLength));
  }

  return Array.from(options).filter((token) => token.length >= 2 && token.length <= 5);
}

function buildServerTokenPool(): string[] {
  const random = createSeededRandom(Date.now());
  const words = TOKEN_CORPUS_TEXT.toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2);

  const collected: string[] = [];

  for (const word of words) {
    const candidates = collectWordTokens(word);
    if (candidates.length === 0) {
      continue;
    }

    const pickCount = Math.min(candidates.length, 1 + Math.floor(random() * 3));
    for (let index = 0; index < pickCount; index += 1) {
      const choice = candidates[Math.floor(random() * candidates.length)];
      collected.push(choice);
    }
  }

  const unique = Array.from(new Set(collected));

  for (let index = unique.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = unique[index];
    unique[index] = unique[swapIndex];
    unique[swapIndex] = current;
  }

  return unique.slice(0, 360);
}

const SERVER_TOKEN_POOL = buildServerTokenPool();

export default async function PiecePage({ params }: PiecePageProps) {
  const resolvedParams = await params;
  const rawId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;
  const parsedId = Number(rawId);
  const pieceId = Number.isFinite(parsedId) ? wrapPiece(Math.floor(parsedId)) : 1;
  const title = PIECE_TITLES[pieceId - 1] ?? PIECE_TITLES[0];

  return <PieceViewClient pieceId={pieceId} title={title} tokenPool={SERVER_TOKEN_POOL} />;
}
