import Link from "next/link";
import { notFound } from "next/navigation";
import { DailyArchive } from "@/app/daily/_components/daily-archive";
import { DailyFrame } from "@/app/daily/_components/daily-frame";
import {
  DAILY_ARTWORKS,
  getDailyByRouteSlug,
  getDailyProfiles,
} from "@/app/daily/_lib/daily-registry";
import { dailyRouteSlug } from "@/app/daily/_lib/daily-types";

type DailyPieceParams = { slug: string };

export async function generateStaticParams(): Promise<DailyPieceParams[]> {
  return DAILY_ARTWORKS.map((entry) => ({
    slug: dailyRouteSlug(entry.profile),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<DailyPieceParams>;
}) {
  const { slug } = await params;
  const entry = getDailyByRouteSlug(slug);
  if (!entry) {
    return { title: "Guest Wing · WHAT WE SEE" };
  }
  return {
    title: `${entry.profile.title} by ${entry.profile.artist.name} · WHAT WE SEE`,
    description: entry.profile.explanation,
  };
}

export default async function DailyPiecePage({
  params,
}: {
  params: Promise<DailyPieceParams>;
}) {
  const { slug } = await params;
  const entry = getDailyByRouteSlug(slug);

  if (!entry) {
    notFound();
  }

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

      <section aria-label="Guest artwork" className="wws-daily-page-frame-section">
        <DailyFrame profile={entry.profile}>
          <entry.Artwork />
        </DailyFrame>
      </section>

      <section aria-label="Archive" className="wws-daily-page-archive-section">
        <h2 className="wws-daily-page-archive-title">Archive</h2>
        <DailyArchive entries={profiles} currentSlug={slug} />
      </section>
    </div>
  );
}
