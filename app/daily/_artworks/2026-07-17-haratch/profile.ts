import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-17",
  slug: "haratch",
  title: "Haratch",
  artist: {
    name: "Anahit Gevorgyan",
    hometown: "Marseille",
    era: "Active 1989–present",
    medium: "diaspora press archive, letterpress photography, Armenian-French broadsheet close study",
    manifesto: "every issue printed in exile is the language choosing not to apologize for surviving",
  },
  visualBrief: {
    palette: "night",
    composition: "field",
    interaction: "erase",
    renderMode: "canvas-2d",
    mood: "tender",
    material: "document",
  },
  personality: {
    temperament: "mournful",
    socialEnergy: "bureaucratic",
    humor: "deadpan",
    pressure: "civic",
    voice: "stage-whisper",
    signature:
      "She lifts every archive box with both hands and sets it down the same way, because she has understood since childhood that things only survive if you treat them as though they are still in use.",
  },
  explanation:
    "I have spent twenty years photographing front pages of Haratch — all that survived, which is to say most of them, which is to say not enough. The masthead never changed: H-A-R-A-T-C-H in a typeface borrowed from a French municipal directory, and beneath it the date, and beneath that the day's dispatch in a language that had no country to send it home to. I built you one more copy. The forgetting arrives on its own; the clearing is what you have to do.",
  interaction:
    "Drag across the front to sweep away the gray sediment that drifts back the moment you stop — the erasing is the act of reading, and reading is the only way this archive stays open.",
  medium: "Canvas 2D with per-cell fog accumulation and pointer-erase",
  inspiration:
    "Seed trace: source=random-encyclopedia; premise=Haratch ('Forward') was an Armenian daily newspaper based in France. Haratch was founded in 1925 by Schavarch Missakian.; temperament=mournful; socialEnergy=bureaucratic; humor=deadpan; pressure=civic; voice=stage-whisper; wildMove=fog-as-archive-sediment; interface=archivist-sweep; motion=slow-accumulation; materialMutation=sediment-on-type; scaleRupture=36-years-of-editions-in-one-gesture; antiDefault=no-dark-panel-no-particle-field-no-glow.",
  thumbColor: "#1a2440",
};
