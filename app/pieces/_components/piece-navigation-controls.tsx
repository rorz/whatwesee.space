import Link from "next/link";
import { PIECE_COUNT, wrapPiece } from "../_lib/piece-constants";

type PieceNavigationControlsProps = {
  pieceId: number;
};

export default function PieceNavigationControls({ pieceId }: PieceNavigationControlsProps) {
  const prev = wrapPiece(pieceId - 1);
  const next = wrapPiece(pieceId + 1);

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/"
          className="pointer-events-auto inline-flex border border-black bg-orange-500 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-black shadow-[0_4px_0_#7c2d12] sm:text-sm"
        >
          back to start
        </Link>
        <Link
          href={`/pieces/${prev}`}
          className="pointer-events-auto inline-flex border border-white/30 bg-black/65 px-3 py-2 font-sans text-xs font-semibold uppercase tracking-[0.09em] text-white hover:bg-white/10 sm:text-sm"
        >
          prev piece
        </Link>
        <Link
          href={`/pieces/${next}`}
          className="pointer-events-auto inline-flex border border-white/30 bg-black/65 px-3 py-2 font-sans text-xs font-semibold uppercase tracking-[0.09em] text-white hover:bg-white/10 sm:text-sm"
        >
          next piece
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: PIECE_COUNT }, (_, index) => {
          const id = index + 1;
          const active = id === pieceId;

          return (
            <Link
              key={`piece-link-${id}`}
              href={`/pieces/${id}`}
              className={`pointer-events-auto inline-flex min-w-[2rem] items-center justify-center border px-2 py-1 font-mono text-[11px] font-semibold tracking-[0.04em] ${active ? "border-orange-300 bg-orange-400 text-black" : "border-white/25 bg-black/55 text-white hover:bg-white/10"}`}
            >
              {id}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
