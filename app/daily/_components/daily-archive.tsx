import Link from "next/link";
import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";
import { dailyRouteSlug } from "@/app/daily/_lib/daily-types";

type DailyArchiveProps = {
  entries: ReadonlyArray<DailyArtworkProfile>;
  currentSlug?: string;
};

const ROTATIONS = ["-1.4deg", "0.8deg", "-0.6deg", "1.2deg", "-1deg", "0.4deg"];

export function DailyArchive({ entries, currentSlug }: DailyArchiveProps) {
  if (entries.length === 0) {
    return (
      <p className="wws-daily-archive-empty">
        No prior guests. The next stamp arrives at 8am London.
      </p>
    );
  }

  return (
    <ol className="wws-daily-archive">
      {entries.map((entry, index) => {
        const route = dailyRouteSlug(entry);
        const isCurrent = currentSlug === route;
        const tilt = ROTATIONS[index % ROTATIONS.length];
        return (
          <li
            key={route}
            className={`wws-daily-archive-card${isCurrent ? " wws-daily-archive-card--current" : ""}`}
            style={{ "--wws-tilt": tilt } as React.CSSProperties}
          >
            <Link href={`/daily/${route}`} className="wws-daily-archive-link">
              <div className="wws-daily-archive-thumb" style={{ background: entry.thumbColor }}>
                <span className="wws-daily-archive-thumb-date">{entry.date}</span>
              </div>
              <div className="wws-daily-archive-meta">
                <p className="wws-daily-archive-title">{entry.title}</p>
                <p className="wws-daily-archive-artist">
                  {entry.artist.name}
                  <span aria-hidden>{" · "}</span>
                  {entry.artist.hometown}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
