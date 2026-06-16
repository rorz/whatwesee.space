import type { DailyArtworkModule, DailyArtworkProfile } from "@/app/daily/_lib/daily-types";
import { dailyRouteSlug } from "@/app/daily/_lib/daily-types";
import forbiddenFilament from "@/app/daily/_artworks/2026-06-16-forbidden-filament";
import someDistanceFrom from "@/app/daily/_artworks/2026-06-15-some-distance-from";
import verdictAndVerse from "@/app/daily/_artworks/2026-06-14-verdict-and-verse";
import theAddress from "@/app/daily/_artworks/2026-06-11-the-address";
import districtMissing from "@/app/daily/_artworks/2026-06-10-district-missing";
import specimenTeether from "@/app/daily/_artworks/2026-06-08-specimen-teether";
import mbpTriage from "@/app/daily/_artworks/2026-06-07-mbp-triage";
import snackForecast from "@/app/daily/_artworks/2026-06-03-snack-forecast";
import payloadLimit from "@/app/daily/_artworks/2026-06-02-payload-limit";
import fossilTide from "@/app/daily/_artworks/2026-05-31-fossil-tide";
import injunctionRibbon from "@/app/daily/_artworks/2026-05-29-injunction-ribbon";
import armChart from "@/app/daily/_artworks/2026-05-28-arm-chart";
import spillProtocol from "@/app/daily/_artworks/2026-05-27-spill-protocol";
import sternumLedger from "@/app/daily/_artworks/2026-05-26-sternum-ledger";
import rattleAlphabet from "@/app/daily/_artworks/2026-05-25-rattle-alphabet";
import signalDetour from "@/app/daily/_artworks/2026-05-24-signal-detour";
import chorusCanteen from "@/app/daily/_artworks/2026-05-23-chorus-canteen";
import slowColony from "@/app/daily/_artworks/2026-05-22-slow-colony";
import marginTide from "@/app/daily/_artworks/2026-05-21-margin-tide";
import fieldMemory from "@/app/daily/_artworks/2026-05-20-field-memory";
import invisibleReply from "@/app/daily/_artworks/2026-05-19-invisible-reply";
import borrowedPage from "@/app/daily/_artworks/2026-05-18-borrowed-page";
import platformRubbing from "@/app/daily/_artworks/2026-05-16-platform-rubbing";
import heldLine from "@/app/daily/_artworks/2026-05-17-held-line";
import singleStroke from "@/app/daily/_artworks/2026-05-14-single-stroke";

export const DAILY_ARTWORKS: ReadonlyArray<DailyArtworkModule> = [
  forbiddenFilament,
  someDistanceFrom,
  verdictAndVerse,
  theAddress,
  districtMissing,
  specimenTeether,
  mbpTriage,
  snackForecast,
  payloadLimit,
  fossilTide,
  injunctionRibbon,
  armChart,
  spillProtocol,
  sternumLedger,
  rattleAlphabet,
  signalDetour,
  chorusCanteen,
  slowColony,
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
