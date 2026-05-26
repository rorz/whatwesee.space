import Link from "next/link";
import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";
import { dailyRouteSlug } from "@/app/daily/_lib/daily-types";

type DailyArchiveProps = {
  entries: ReadonlyArray<DailyArtworkProfile>;
  currentSlug?: string;
};

export function DailyArchive({ entries, currentSlug }: DailyArchiveProps) {
  const previousEntries = entries.filter((entry) => dailyRouteSlug(entry) !== currentSlug);

  if (previousEntries.length === 0) {
    return <p className="wws-daily-archive-empty">No previous entries yet.</p>;
  }

  return (
    <ol className="wws-daily-archive">
      {previousEntries.map((entry) => {
        const route = dailyRouteSlug(entry);
        return (
          <li key={route} className="wws-daily-archive-card">
            <Link href={`/daily/${route}`} className="wws-daily-archive-link">
              <div className="wws-daily-archive-meta">
                <p className="wws-daily-archive-date">{entry.date}</p>
                <p className="wws-daily-archive-title">{entry.title}</p>
                <p className="wws-daily-archive-artist">{entry.artist.name}</p>
              </div>
              <span className="wws-daily-archive-arrow" aria-hidden>
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
