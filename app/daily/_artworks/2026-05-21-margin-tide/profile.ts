import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-21",
  slug: "margin-tide",
  title: "Margin Tide",
  artist: {
    name: "Sota Nishimura",
    hometown: "Kanazawa",
    era: "Active 2015-present",
    medium: "letterpress misregisters, stitched notebook margins, and sumi corrections",
    manifesto: "the edge remembers what the center forgets",
  },
  visualBrief: {
    palette: "white-ground",
    composition: "field",
    interaction: "drag",
    renderMode: "canvas-2d",
    mood: "tender",
    material: "document",
  },
  explanation:
    "I keep my notes in the margins because the center of the page always pretends it is the whole truth. When I drag that edge-ink inward, the clean statement starts to wobble and admit what it omitted. This square asks the hand to carry side-remarks into the middle until the page reads honestly.",
  interaction:
    "Drag from the paper's edges to load and pull margin ink inward, because the piece is about moving what was sidelined into the center where it can no longer be ignored.",
  medium: "Canvas 2D advection field + DOM",
  inspiration:
    "Open Library was blocked for the seeded source index, so I used a representative literary fact: marginalia often preserves a reader's most durable interpretation of a text.",
  thumbColor: "#d9ceb4",
};
