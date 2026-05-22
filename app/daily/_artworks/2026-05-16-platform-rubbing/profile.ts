import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-16",
  slug: "platform-rubbing",
  title: "Platform Rubbing",
  artist: {
    name: "Nermin Basic",
    hometown: "Sarajevo",
    era: "Active 2018-present",
    medium: "tram enamel, traffic bollards, laminated strike maps, and queue-barrier hardware",
    manifesto: "the city speaks clearest through what commuters wear away",
  },
  visualBrief: {
    palette: "metallic",
    composition: "map",
    interaction: "drag",
    renderMode: "mixed-dom",
    mood: "comic",
    material: "transit",
  },
  explanation:
    "The old version waited for someone to uncover a route; this one panics first. The map is a municipal mouth full of colored tracks, loose route teeth, and a signal puck that keeps making confident decisions. Drag the signal and the timetable becomes less like information and more like a small transport authority having a public episode.",
  interaction:
    "Drag the signal puck to reroute the board, because the piece treats commuter memory as an unstable machine rather than a recovered surface.",
  medium: "Mixed DOM + SVG transit apparatus",
  inspiration:
    "The seeded source was Random Wikipedia (index 0), but network access was blocked; I used a representative fact that random entries often surface obscure station pages where almost everything meaningful is in small local details.",
  thumbColor: "#00d5ff",
};
