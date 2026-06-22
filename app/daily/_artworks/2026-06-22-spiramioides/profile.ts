import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-22",
  slug: "spiramioides",
  title: "Spiramioides",
  artist: {
    name: "Tarka Sandhu",
    hometown: "Darwin",
    era: "Active 2019–present",
    medium: "light-trap photography, moth specimen drawings, logarithmic curve studies",
    manifesto: "the moth does not know logarithms; the moth simply believes the light is still",
  },
  visualBrief: {
    palette: "night",
    composition: "pattern-system",
    interaction: "drag",
    renderMode: "svg",
    mood: "meditative",
    material: "organism",
  },
  personality: {
    temperament: "mournful",
    socialEnergy: "oracle",
    humor: "morbid",
    pressure: "solemn",
    voice: "lab-notes",
    signature:
      "He records each spiral pass in field notebooks without conclusions, as if the measured distance between a moth and a bulb were already enough explanation.",
  },
  explanation:
    "I came to logarithms through moth-trapping, not through a textbook. After a week running light traps near the Barkly Highway, I noticed that Niguza spiramioides drew its approach circles in a tightening ratio — measurably the same each pass, every revolution a fixed fraction closer than the last. What you have here is a drag-controllable version of that lamp; move it and the moth re-plots its course without complaint.",
  interaction:
    "Drag the lamp to a new position and the moth recomputes its logarithmic spiral toward it, because the navigational error that drives the approach is always measured relative to where the lamp currently sits.",
  medium: "SVG moth simulation with logarithmic spiral kinematics and drag-repositioned light source",
  inspiration:
    "Seed trace: source=random-encyclopedia=Niguza spiramioides is a species of moth in the family Erebidae. It was first described by Francis Walker in 1858 and is found in Australia in the Northern Territory, Queensland and Western Australia.; premise=What if the logarithmic navigational confusion of a moth under artificial light could be rendered as a precise, drag-steerable specimen study — and the moth never once acknowledged that the lamp had moved?; temperament=mournful; socialEnergy=oracle; humor=morbid; pressure=solemn; voice=lab-notes; wildMove=specimen-study-as-cosmology; interface=light-trap; motion=spiral-toward; materialMutation=orbit-as-arithmetic; scaleRupture=ratio-smaller-each-pass; antiDefault=no-instrument-panel-no-CMY-neon.",
  thumbColor: "#0a0814",
};
