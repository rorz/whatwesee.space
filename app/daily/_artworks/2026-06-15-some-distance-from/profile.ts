import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-15",
  slug: "some-distance-from",
  title: "Some Distance From",
  artist: {
    name: "Nora Embley",
    hometown: "Sheffield",
    era: "Active 2015–present",
    medium: "hand-drawn OS map extracts, timetable linings, and stenciled distance circles",
    manifesto: "every platform edge is exactly where it should be; the village just took a different turning",
  },
  visualBrief: {
    palette: "primary",
    composition: "map",
    interaction: "trace",
    renderMode: "svg",
    mood: "comic",
    material: "transit",
  },
  personality: {
    temperament: "giddy",
    socialEnergy: "radio-host",
    humor: "childlike",
    pressure: "sulking",
    voice: "ship-log",
    signature:
      "She reads every platform sign aloud like she is naming the winner, then checks the timetable a second time because something about this stop keeps filing itself under the wrong village.",
  },
  explanation:
    "I grew up in neighborhoods named for places the bus didn't reach, so a station that is technically Finstock but not quite in Finstock felt expected and entirely funny. The railway company built a platform northeast of Charlbury Road in the 1850s, named it for the village, and left Oxfordshire mud to handle the final mile. I made that mud here: trace from the platform toward the village marker and Fawler hamlet will quietly pull the line sideways before you can close the gap.",
  interaction:
    "Trace from the platform toward Finstock village and watch Fawler draw your path sideways the moment the gap starts to close.",
  medium: "Responsive SVG map with pointer-driven trace, Fawler-attraction deflection, and attempt history overlay",
  inspiration:
    "Seed trace: source=random-wikipedia=Finstock railway station serves the village of Finstock and the hamlet of Fawler in Oxfordshire, England. It is some distance from Finstock itself, being situated to the north-east of Charlbury Road, which crosses the line on an overbridge.; premise=What if a platform named for a village it cannot reach let you trace every failed approach until the gap filled up with near-misses?; temperament=giddy; socialEnergy=radio-host; humor=childlike; pressure=sulking; voice=ship-log; wildMove=force-field-deflection; interface=railway-map; motion=drift; materialMutation=proximity-as-distance; scaleRupture=overbridge-too-close-to-matter; antiDefault=no-dark-ground.",
  thumbColor: "#c8372d",
};
