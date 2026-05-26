import Link from "next/link";
import { getLatestDaily } from "@/app/daily/_lib/daily-registry";
import { dailyRouteSlug } from "@/app/daily/_lib/daily-types";

type DailyMarqueeProps = {
  variant?: "desktop-corner" | "inline-mobile";
};

export function DailyMarquee({ variant = "desktop-corner" }: DailyMarqueeProps) {
  const latest = getLatestDaily();
  if (!latest) {
    return null;
  }

  const href = `/daily/${dailyRouteSlug(latest.profile)}`;
  const className =
    variant === "desktop-corner"
      ? "wws-daily-marquee wws-daily-marquee--corner"
      : "wws-daily-marquee wws-daily-marquee--inline";

  return (
    <Link href={href} className={className}>
      <span className="wws-daily-marquee-stamp" aria-hidden>
        NEW
      </span>
      <span className="wws-daily-marquee-body">
        <span className="wws-daily-marquee-label">Daily</span>
        <span className="wws-daily-marquee-name">{latest.profile.title}</span>
        <span className="wws-daily-marquee-title">
          {latest.profile.artist.name} · {latest.profile.date}
        </span>
      </span>
      <span className="wws-daily-marquee-arrow" aria-hidden>
        →
      </span>
    </Link>
  );
}
