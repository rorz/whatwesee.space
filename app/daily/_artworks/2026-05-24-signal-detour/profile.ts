import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-24",
  slug: "signal-detour",
  title: "Signal Detour",
  artist: {
    name: "Maksym Dorosh",
    hometown: "Odesa",
    era: "Active 2016-present",
    medium: "tram dispatch consoles, enamel route plates, and depot public-address rehearsals",
    manifesto: "a route earns trust only after it survives a wrong turn",
  },
  visualBrief: {
    palette: "earth",
    composition: "diagram",
    interaction: "press",
    renderMode: "mixed-dom",
    mood: "deadpan",
    material: "transit",
  },
  explanation:
    "I found a brief note about Muriel Hazeldene and thought about the supporting operator who keeps a city moving while everyone watches the lead carriage. I drew a dispatch board where each pressed junction becomes an official detour stamp, because transit authority is mostly accumulated interruptions. The map stays calm, but every new seal proves the network only becomes believable after it has been rerouted in public.",
  interaction:
    "Press any point on the route map to stamp a detour at the nearest junction, because the piece treats authority as a record of deliberate, visible reroutes.",
  medium: "Responsive SVG transit diagram + DOM dispatch console",
  inspiration:
    "Seeded source index 0 (Random Wikipedia) returned Muriel Hazeldene, prompting a premise about quiet supporting roles that still keep a whole system coherent.",
  thumbColor: "#6b3f1d",
};
