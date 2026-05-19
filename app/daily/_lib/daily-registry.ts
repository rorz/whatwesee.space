import type { DailyArtworkModule, DailyArtworkProfile } from "@/app/daily/_lib/daily-types";
import { dailyRouteSlug } from "@/app/daily/_lib/daily-types";
import borrowedPage from "@/app/daily/_artworks/2026-05-18-borrowed-page";
import heldLine from "@/app/daily/_artworks/2026-05-17-held-line";
import singleStroke from "@/app/daily/_artworks/2026-05-14-single-stroke";

export const DAILY_ARTWORKS: ReadonlyArray<DailyArtworkModule> = [
  heldLine,
  borrowedPage,
  singleStroke,
];

export function getDailyProfiles(): ReadonlyArray<DailyArtworkProfile> {
  return DAILY_ARTWORKS.map((entry) => entry.profile);
}

export function getDailyByRouteSlug(routeSlug: string): DailyArtworkModule | undefined {
  return DAILY_ARTWORKS.find((entry) => dailyRouteSlug(entry.profile) === routeSlug);
}

export function getLatestDaily(): DailyArtworkModule | undefined {
  return DAILY_ARTWORKS[0];
}
