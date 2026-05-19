import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-16",
  slug: "platform-rubbing",
  title: "Platform Rubbing",
  artist: {
    name: "Lejla Arslan",
    hometown: "Sarajevo",
    era: "Active 2018-present",
    medium: "pencil rubbings on transit notices and stitched ticket ledgers",
    manifesto: "the city speaks clearest through what commuters wear away",
  },
  explanation:
    "I keep taking graphite to station notices because the official text is never the full message. The useful parts are the smudges from sleeves, the names half-erased by waiting hands, the places people touched while deciding where to go. I built this square the same way: the timetable is present from the start, but it only speaks when someone rubs the surface with intention.",
  interaction:
    "Drag to rub the board, because this piece is about recovering a route map from commuter wear, not passively looking at a finished sign.",
  medium: "DOM grid abrasion field + SVG timetable lines",
  inspiration:
    "The seeded source was Random Wikipedia (index 0), but network access was blocked; I used a representative fact that random entries often surface obscure station pages where almost everything meaningful is in small local details.",
  thumbColor: "#cec3ad",
};
