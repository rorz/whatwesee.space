import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-19",
  slug: "shared-shelf",
  title: "Shared Shelf",
  artist: {
    name: "Leila Haddad",
    hometown: "Tangier",
    era: "Active 2018-present",
    medium: "hand-lettered index cards, stitched bindings, and annotated library slips",
    manifesto: "a shelf is a sentence written by many hands",
  },
  explanation:
    "I keep thinking about how no subject stands upright by itself; each spine leans because another one leans back. I wanted these books to behave like that, where touching one title pulls a whole neighborhood into a new grammar. The order is never fixed, only temporarily balanced by whoever is reading.",
  interaction:
    "Drag across the spines to make one subject pull its neighbors out of line, because the piece is about classification as a shared physical negotiation rather than a fixed list.",
  medium: "SVG + React state choreography",
  inspiration:
    "Seeded source index 4 failed to load in this environment; representative Open Library fact used: subjects group many unrelated books into shared discoverable shelves.",
  thumbColor: "#d8c7ab",
};
