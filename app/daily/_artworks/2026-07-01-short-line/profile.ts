import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-01",
  slug: "short-line",
  title: "Short Line",
  artist: {
    name: "Hiroko Ueda",
    hometown: "Nagoya",
    era: "Active 2011–present",
    medium: "station timetables, rail schematic prints, and transit authority typography",
    manifesto: "the junction does not apologise; it simply points",
  },
  visualBrief: {
    palette: "institutional",
    composition: "timeline",
    interaction: "sort",
    renderMode: "canvas-2d",
    mood: "industrial",
    material: "transit",
  },
  personality: {
    temperament: "bossy",
    socialEnergy: "foreman",
    humor: "deadpan",
    pressure: "itchy",
    voice: "workshop-gothic",
    signature:
      "She routes trains the way she routes arguments — one switch, one direction, no appeal once the wheels are rolling.",
  },
  explanation:
    "The Chikkō Line runs exactly 1.5 kilometres between two stations, and if you blink at the right moment you can see where the freight track peels off and vanishes into the port. I have drawn that junction five hundred times. Every time, there is a moment just before the wheels commit where the switch is neither set nor unset — it is simply open. I wanted to give that moment to someone else.",
  interaction:
    "Press anywhere to flip the junction switch before each unit arrives; passenger trains belong on the main line, freight belongs on the Tōchiku branch.",
  medium: "Canvas 2D railway schematic with junction switch simulation",
  inspiration:
    "Seed trace: source=random-encyclopedia=The Chikkō Line is a 1.5 km Japanese railway line in Nagoya, Aichi Prefecture, owned and operated by the private railway operator Nagoya Railroad (Meitetsu). At Meiden Chikkō, between the line's two stations, there is a connection to the freight-only Nagoya Rinkai Railway Tōchiku line.; premise=What if the single junction point of the world's most minimal railway — two stations, 1.5 km, one freight fork — could be given to a visitor to sort, and the weight was entirely in the silence between each arriving unit?; temperament=bossy; socialEnergy=foreman; humor=deadpan; pressure=itchy; voice=workshop-gothic; wildMove=junction-as-decision-machine; interface=switch-panel; motion=linear-approach; materialMutation=steel-as-sorting-surface; scaleRupture=1.5km-in-a-square; antiDefault=no-dark-ground-no-particle-field-no-control-panel.",
  thumbColor: "#c8102e",
};
