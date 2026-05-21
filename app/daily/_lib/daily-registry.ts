import type { DailyArtworkModule, DailyArtworkProfile } from "@/app/daily/_lib/daily-types";
import { dailyRouteSlug } from "@/app/daily/_lib/daily-types";
import marginTide from "@/app/daily/_artworks/2026-05-21-margin-tide";
import fieldMemory from "@/app/daily/_artworks/2026-05-20-field-memory";
import invisibleReply from "@/app/daily/_artworks/2026-05-19-invisible-reply";
import borrowedPage from "@/app/daily/_artworks/2026-05-18-borrowed-page";
import platformRubbing from "@/app/daily/_artworks/2026-05-16-platform-rubbing";
import heldLine from "@/app/daily/_artworks/2026-05-17-held-line";
import singleStroke from "@/app/daily/_artworks/2026-05-14-single-stroke";

export const DAILY_ARTWORKS: ReadonlyArray<DailyArtworkModule> = [
  marginTide,
  fieldMemory,
  invisibleReply,
  heldLine,
  borrowedPage,
  platformRubbing,
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
