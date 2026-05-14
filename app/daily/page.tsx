import Link from "next/link";
import { DailyArchive } from "@/app/daily/_components/daily-archive";
import { DailyFrame } from "@/app/daily/_components/daily-frame";
import { getDailyProfiles, getLatestDaily } from "@/app/daily/_lib/daily-registry";
import { dailyRouteSlug } from "@/app/daily/_lib/daily-types";

export const metadata = {
  title: "Daily Guest · WHAT WE SEE",
  description:
    "A fresh artwork by a fictitious guest artist, generated daily by an agent. Distinct from the nine-room exhibition.",
};

export default function DailyIndexPage() {
  const latest = getLatestDaily();
  const profiles = getDailyProfiles();

  return (
    <div className="wws-daily-page">
      <header className="wws-daily-page-header">
        <Link href="/" className="wws-daily-page-back">
          ← back to lobby
        </Link>
        <h1 className="wws-daily-page-title">Guest Wing</h1>
        <p className="wws-daily-page-subtitle">
          A new guest is admitted at 08:00 London time. Each piece is one stroke of one stranger.
        </p>
      </header>

      {latest ? (
        <section aria-label="Today's guest" className="wws-daily-page-frame-section">
          <DailyFrame profile={latest.profile}>
            <latest.Artwork />
          </DailyFrame>
        </section>
      ) : (
        <section className="wws-daily-page-empty">
          <p>The wing is being prepared. The first guest is en route.</p>
        </section>
      )}

      <section aria-label="Archive" className="wws-daily-page-archive-section">
        <h2 className="wws-daily-page-archive-title">Archive</h2>
        <DailyArchive
          entries={profiles}
          currentSlug={latest ? dailyRouteSlug(latest.profile) : undefined}
        />
      </section>
    </div>
  );
}
