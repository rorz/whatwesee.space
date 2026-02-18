import Image from "next/image";
import Link from "next/link";
import { getPieceArtistProfile } from "../_lib/piece-artist-profiles";
import { PIECE_COUNT } from "../_lib/piece-constants";

type PieceNavigationControlsProps = {
  pieceId: number;
  className?: string;
  hideQuickLinks?: boolean;
  hideArtistCard?: boolean;
  hidePieceGrid?: boolean;
};

export default function PieceNavigationControls({
  pieceId,
  className,
  hideQuickLinks = false,
  hideArtistCard = false,
  hidePieceGrid = false,
}: PieceNavigationControlsProps) {
  const profile = getPieceArtistProfile(pieceId);
  const rootClassName = ["mt-3 flex flex-col gap-3", className].filter(Boolean).join(" ");

  return (
    <div className={rootClassName}>
      {!hideArtistCard ? (
        <div className="wws-cart-card pointer-events-none inline-block self-start">
          <div className="wws-cart-ridge">
            <p className="font-pixel-square text-[0.5rem] leading-none tracking-[0.14em] text-[#121317]">
              agentic artist:
            </p>
          </div>

          <div className="wws-cart-sticker">
            <div className="wws-cart-avatar-wrap">
              <Image
                src={profile.avatar}
                alt={`Portrait of ${profile.name}`}
                width={32}
                height={32}
                className="h-8 w-8 object-cover"
              />
            </div>

            <div className="min-w-0">
              <p className="font-pixel-square text-[0.48rem] uppercase leading-none tracking-[0.12em] text-[#2c313a]">
                Piece {pieceId}
              </p>
              <p className="truncate pt-0.5 font-pixel-square text-[0.62rem] leading-none tracking-[0.05em] text-[#0f1217]">
                {profile.name}
              </p>
              <p className="truncate pt-1 font-pixel-square text-[0.54rem] leading-none tracking-[0.06em] text-[#222730]">
                {profile.city}
              </p>
            </div>
          </div>

          <span className="wws-cart-notch wws-cart-notch--left" aria-hidden />
          <span className="wws-cart-notch wws-cart-notch--right" aria-hidden />
        </div>
      ) : null}

      {!hideQuickLinks ? (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="pointer-events-auto inline-flex min-h-10 items-center justify-center border border-black/70 bg-yellow-300 px-3 py-2 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:bg-yellow-200 sm:min-h-0 sm:py-1.5 sm:text-[11px]"
          >
            start
          </Link>
          <Link
            href="/guestbook"
            className="pointer-events-auto inline-flex min-h-10 items-center justify-center border border-black/55 bg-sky-200 px-2.5 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.09em] text-black backdrop-blur-sm transition-colors hover:bg-sky-100 sm:min-h-0 sm:px-2 sm:py-1 sm:text-[9px]"
          >
            guestbook
          </Link>
        </div>
      ) : null}

      {!hidePieceGrid ? (
        <div className="grid w-full grid-cols-5 gap-1.5 sm:grid-cols-10">
          {Array.from({ length: PIECE_COUNT }, (_, index) => {
            const id = index + 1;
            const active = id === pieceId;

            return (
              <Link
                key={`piece-link-${id}`}
                href={`/pieces/${id}`}
                className={`pointer-events-auto inline-flex h-10 w-full items-center justify-center border-2 px-1 font-pixel-square text-base leading-none tracking-[0.03em] transition-colors sm:h-9 ${
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
      ) : null}
    </div>
  );
}
