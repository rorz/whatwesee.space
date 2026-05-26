import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-18",
  slug: "borrowed-page",
  title: "Borrowed Page",
  artist: {
    name: "Mina Vukovic",
    hometown: "Belgrade",
    era: "Active 2016-present",
    medium: "checkout-card games, public library signage, enamel pins, and repaired children's books",
    manifesto: "every correction is a second voice",
  },
  visualBrief: {
    palette: "primary",
    composition: "game-board",
    interaction: "sort",
    renderMode: "css-dom",
    mood: "comic",
    material: "document",
  },
  personality: {
    temperament: "giddy",
    socialEnergy: "schoolteacher",
    humor: "petty",
    pressure: "domestic",
    voice: "school-notebook",
    signature: "I grin with chalk on my fingers, delighted by every bent corner that refuses to sit in the proper tray.",
  },
  explanation:
    "I learned library order from the messy table near the returns desk, not from the catalogue. The good pages came back bent, loud, overdue, and full of somebody else's urgency. I made a sorting floor where borrowing is not quiet stewardship but a small public game of putting things back badly, then better.",
  interaction:
    "Click the page cards to sort and unsort them, because the work treats borrowing as a visible negotiation between order and use.",
  medium: "CSS DOM game-board",
  inspiration:
    "Datamuse was unavailable at runtime for the seeded source, so I used a representative OED-style word fact: a palimpsest is a reused page where earlier writing remains traceable.",
  thumbColor: "#ffe600",
};
