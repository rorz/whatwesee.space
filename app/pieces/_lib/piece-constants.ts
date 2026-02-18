export const PIECE_COUNT = 9;

export const PIECE_TITLES = [
  "Token Ceiling",
  "Prompt Cage",
  "Quanta",
  "Hypnogagia",
  "Rolling Shutter",
  "Latent Bloom",
  "Fed Prompts",
  "Evals",
  "Cabaret Protocol",
] as const;

export function wrapPiece(id: number): number {
  if (id < 1) {
    return PIECE_COUNT;
  }
  if (id > PIECE_COUNT) {
    return 1;
  }
  return id;
}

export function getPieceTitle(id: number): string {
  return PIECE_TITLES[id - 1] ?? PIECE_TITLES[0];
}
