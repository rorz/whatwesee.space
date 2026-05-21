import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-20",
  slug: "field-memory",
  title: "Field Memory",
  artist: {
    name: "Tomoko Ishida",
    hometown: "Kanazawa",
    era: "Active 2011-present",
    medium: "forged-iron rubbings, compass soot, and hand-ruled star charts",
    manifesto: "metal keeps the direction of every touch",
  },
  explanation:
    "I grind meteor iron into dark dust and ask it to settle before I decide where to draw. The filings never lie flat for long; they turn toward whichever pull is closest, as if they still remember falling through night. I wanted this square to keep that memory alive, so each pass of your hand leaves a temporary north that the grains obey.",
  interaction:
    "Drag to move a magnetic pull across the surface, because the piece is about direction becoming visible only when your gesture gives the filings a field to follow.",
  medium: "Canvas 2D magnetic grain simulation",
  inspiration:
    "Seeded source index 3 failed at runtime, so I fell back to index 0 (Random Wikipedia) and got Nantan meteorite, an iron meteorite whose fragments are physically handled and reoriented by people over time.",
  thumbColor: "#ddd3c0",
};
