import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-26",
  slug: "sternum-ledger",
  title: "Sternum Ledger",
  artist: {
    name: "Roxolana Teresh",
    hometown: "Mariupol",
    era: "Active 2018-present",
    medium: "migration registry ink, choral breathing drills, and municipal queue choreography",
    manifesto: "if the body remembers the route, the record can survive the border",
  },
  visualBrief: {
    palette: "monochrome",
    composition: "timeline",
    interaction: "press",
    renderMode: "text-grid",
    mood: "tender",
    material: "body",
  },
  explanation:
    "I found Ukrainian Greeks and kept thinking about how a people can keep its rhythm while maps keep being redrawn around them. I laid years out as a ribcage ledger where every mark is a breath caught in the sternum before a crossing. The field stays monochrome because memory arrives first as pressure, then as language.",
  interaction:
    "Press anywhere in the ledger to place a new breath mark on that year, because the work treats continuity as something the body must actively re-inscribe.",
  medium: "Responsive monospace text-grid timeline with pressure-decay simulation in React",
  inspiration:
    "Seeded source index 0 (Random Wikipedia) returned Ukrainian Greeks, prompting a premise about embodied continuity surviving repeated border shifts.",
  thumbColor: "#111111",
};
