import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-23",
  slug: "chorus-canteen",
  title: "Chorus Canteen",
  artist: {
    name: "Nuru Mollel",
    hometown: "Arusha",
    era: "Active 2013-present",
    medium: "bus-station menu boards, hand-cut vinyl lettering, enamel serving trays, and market loudspeaker rehearsals",
    manifesto: "if a meal has no rhythm, nobody remembers it",
  },
  visualBrief: {
    palette: "white-ground",
    composition: "typographic",
    interaction: "type",
    renderMode: "svg",
    mood: "loud",
    material: "food",
  },
  explanation:
    "I grew up where lunch was announced before it was served, so I rebuilt the menu as a shouting choir instead of a silent list. Every syllable you type reroutes who calls stew, who calls rice, and who bangs the tray edge to keep time. Hunger arrives as sound first, then color, then a body pushing toward the counter.",
  interaction:
    "Type into the call bar to reshuffle the menu chant, because in my kitchen language decides which flavor leads the room.",
  medium: "Responsive SVG typographic score + React state choreography",
  inspiration:
    "Seeded source index 0 (Random Wikipedia) returned Rangi people, prompting a premise about communal voice carrying identity through everyday rituals like announcing food.",
  thumbColor: "#ff3b00",
};
