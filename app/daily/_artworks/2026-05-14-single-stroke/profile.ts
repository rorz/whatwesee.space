import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-14",
  slug: "single-stroke",
  title: "Single Stroke",
  artist: {
    name: "Iris Holm",
    hometown: "Oslo",
    era: "Active 2014-present",
    medium: "pigment-on-handmade-paper, digital companion pieces",
    manifesto: "the paper decides, the brush only asks",
  },
  explanation:
    "I spend hours preparing the paper before I dip the brush. The pleasure is in the readying — the ink merely confirms what has already been decided. A dry sheet refuses; a wet sheet remembers. This piece is a small ceremony for that refusal.",
  interaction:
    "Drag to moisten the paper. Click to drop ink. Ink only travels where the paper has been prepared — dry pixels stop it cold.",
  medium: "Canvas 2D + DOM",
  inspiration:
    "Seeded from the GUEST WING genesis. Iris Holm and her insistence that the preparation is the whole work.",
  thumbColor: "#f5efe2",
};
