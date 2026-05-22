import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-19",
  slug: "invisible-reply",
  title: "Invisible Reply",
  artist: {
    name: "Lejla Marin",
    hometown: "Sarajevo",
    era: "Active 2018-present",
    medium: "copperplate correspondence, lemon-juice inks, and hand-creased stationery",
    manifesto: "a letter is finished by the reader's touch",
  },
  visualBrief: {
    palette: "pastel",
    composition: "typographic",
    interaction: "drag",
    renderMode: "css-dom",
    mood: "tender",
    material: "document",
  },
  explanation:
    "I write with ink that keeps its silence until a palm lingers long enough to wake it. The page is only half mine; the rest belongs to the person who warms it and waits. I wanted this square to behave like a hesitant reply, appearing in patches where care is patient enough to stay.",
  interaction:
    "Drag to warm the paper so the hidden script appears, because the message only exists when your touch completes the act of reading.",
  medium: "DOM + CSS diffusion field",
  inspiration:
    "Open Library was blocked for the seeded source index, so I used a representative literary fact: epistolary fiction lets meaning arrive as fragments of private correspondence.",
  thumbColor: "#ead8bf",
};
