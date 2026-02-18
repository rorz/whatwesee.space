import Link from "next/link";
import { PIECE_COUNT } from "../_lib/piece-constants";

type PieceNavigationControlsProps = {
  pieceId: number;
};

export default function PieceNavigationControls({ pieceId }: PieceNavigationControlsProps) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/"
          className="pointer-events-auto inline-flex border border-white/35 bg-black/65 px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.09em] text-white/92 backdrop-blur-sm transition-colors hover:bg-black/80"
        >
          back to start
        </Link>
        <Link
          href="/guestbook"
          className="pointer-events-auto inline-flex border border-white/35 bg-black/65 px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.09em] text-white/92 backdrop-blur-sm transition-colors hover:bg-black/80"
        >
          guestbook
        </Link>
      </div>

      <div className="grid w-full grid-cols-10 gap-1.5">
        {Array.from({ length: PIECE_COUNT }, (_, index) => {
          const id = index + 1;
          const active = id === pieceId;

          return (
            <Link
              key={`piece-link-${id}`}
              href={`/pieces/${id}`}
              className={`pointer-events-auto inline-flex h-8 w-full items-center justify-center border-2 px-1 font-pixel-square text-sm leading-none tracking-[0.03em] transition-colors sm:h-9 sm:text-base ${
                active
                  ? "border-orange-200 bg-orange-400 text-black"
                  : "border-white/40 bg-black/45 text-white hover:border-orange-100/80 hover:text-orange-100"
              }`}
            >
              {id}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
