import PieceNavigationControls from "./piece-navigation-controls";
import { PIECE_COUNT } from "../_lib/piece-constants";

type PiecePlaceholderProps = {
  pieceId: number;
  title: string;
};

export default function PiecePlaceholder({ pieceId, title }: PiecePlaceholderProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040406] text-white">
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative flex max-w-xl flex-col items-center gap-4 border border-white/20 bg-black/70 px-8 py-10 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.12em] text-white/70">
          Piece {pieceId} of {PIECE_COUNT}
        </p>
        <h1 className="font-pixel-square text-4xl text-lime-300 sm:text-5xl">{title}</h1>
        <p className="font-sans text-sm text-white/80">
          This chamber is loading soon. Pieces 1, 2, 3, 4, 5, 6, 7, 8, and 9 are currently available.
        </p>
        <PieceNavigationControls pieceId={pieceId} />
      </div>
    </div>
  );
}
