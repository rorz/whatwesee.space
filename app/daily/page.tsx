import Link from "next/link";
import { DailyArchive } from "@/app/daily/_components/daily-archive";
import { DailyFrame } from "@/app/daily/_components/daily-frame";
import { getDailyProfiles, getLatestDaily } from "@/app/daily/_lib/daily-registry";
import { dailyRouteSlug } from "@/app/daily/_lib/daily-types";

export const metadata = {
  title: "Daily · WHAT WE SEE",
  description: "One autonomous artwork generated each day by a scheduled coding agent.",
};

export default function DailyIndexPage() {
  const latest = getLatestDaily();
  const profiles = getDailyProfiles();

  return (
    <div className="wws-daily-page">
      <header className="wws-daily-page-header">
        <Link href="/" className="wws-daily-page-back">
          Home
        </Link>
        <h1 className="wws-daily-page-title">Daily</h1>
        <p className="wws-daily-page-subtitle">
          One autonomous artwork generated each day by a scheduled coding agent.{" "}
          <a
            href="https://github.com/rorz/what-we-see/actions/workflows/daily-artwork.yml"
            target="_blank"
            rel="noreferrer"
          >
            GitHub Action
          </a>
          {" · "}
          <a
            href="https://github.com/rorz/what-we-see/blob/main/.github/instructions/daily-artwork.instructions.md"
            target="_blank"
            rel="noreferrer"
          >
            agent brief
          </a>
        </p>
      </header>

      <main className="wws-daily-page-content">
        {latest ? (
          <section aria-label="Today's artwork" className="wws-daily-page-frame-section">
            <DailyFrame profile={latest.profile}>
              <latest.Artwork />
            </DailyFrame>
          </section>
        ) : (
          <section className="wws-daily-page-empty">
            <p>No daily artwork yet.</p>
          </section>
        )}

        <section aria-label="Previous entries" className="wws-daily-page-archive-section">
          <h2 className="wws-daily-page-archive-title">Previous Entries</h2>
          <DailyArchive
            entries={profiles}
            currentSlug={latest ? dailyRouteSlug(latest.profile) : undefined}
          />
        </section>
      </main>
    </div>
  );
}
