import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-17",
  slug: "held-line",
  title: "Held Line",
  artist: {
    name: "Lejla Kostic",
    hometown: "Sarajevo",
    era: "Active 2012-present",
    medium: "carbon-copy ledgers, hand-pressed receipts, and stitched noticeboards",
    manifesto: "if nobody holds it, it was never said",
  },
  visualBrief: {
    palette: "white-ground",
    composition: "typographic",
    interaction: "hold",
    renderMode: "css-dom",
    mood: "severe",
    material: "document",
  },
  explanation:
    "I grew up reading news that changed by the hour, then watching one sentence survive because someone kept repeating it by hand. In this square, most lines thin out and vanish unless a palm keeps pressure on them. I do not trust what rises fastest; I trust what someone chooses to hold long enough to stain the paper.",
  interaction:
    "Drag to press lines into the board, because the work is about attention as a physical act that decides which statements remain legible.",
  medium: "Pure CSS + DOM simulation",
  inspiration:
    "Seed index 2 (Hacker News top of day) was network-blocked, so I used a representative front-page fact: headlines churn quickly and only the lines readers keep returning to stay culturally visible.",
  thumbColor: "#e6d8bf",
};
