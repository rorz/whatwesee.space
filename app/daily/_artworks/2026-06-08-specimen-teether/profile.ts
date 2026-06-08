import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-08",
  slug: "specimen-teether",
  title: "Specimen Teether",
  artist: {
    name: "Rosaria Vitale",
    hometown: "Palermo",
    era: "Active 2013–present",
    medium: "cast brass rattles, pyrite dust glazing, and quarry stockroom vitrines",
    manifesto: "if a stone wants soothing, let it earn the lullaby",
  },
  visualBrief: {
    palette: "earth",
    composition: "single-object",
    interaction: "shake",
    renderMode: "canvas-2d",
    mood: "meditative",
    material: "mineral",
  },
  personality: {
    temperament: "ceremonial",
    socialEnergy: "flirtatious",
    humor: "operatic",
    pressure: "triumphant",
    voice: "kitchen-table",
    signature:
      "She coaxes a rude little relic the way other people flirt over supper, one hand on the brass handle and the other already reaching for the good dish towel.",
  },
  explanation:
    "I grew up with my aunt's jewelry scale on the kitchen table, and I still test a pretty stone the way babies test silver: against the teeth, against the nerves, against my patience. Here I made a nursery brute from quarry colors — clay shell, wet brass seam, one warning lamp far too grand for its body, and a stingy inventory window that crawls from sleeping ore to awake ore. Shake it until the jaw parts and the crystals show themselves, because some specimens only confess their appetite after you jostle the lullaby out of them.",
  interaction:
    "Shake the little brute by hand until its wet-metal seam opens and the inventory window finally admits how many stones are awake inside.",
  medium: "Responsive Canvas 2D mineral toy portrait with shake-reactive state, DPR-aware redraw, and procedural brass-and-stone rendering",
  inspiration:
    "Seed trace: source=fallback-concrete-noun=geode teether; premise=What if a quarry inventory toy had to be shaken like a teether before the wet-metal seam admitted which stones were awake inside?; temperament=ceremonial; socialEnergy=flirtatious; humor=operatic; pressure=triumphant; voice=kitchen-table; wildMove=hostile-toy; interface=inventory-screen; motion=crawl; materialMutation=wet-metal; scaleRupture=warning-light-too-large; antiDefault=no-floating-symbols.",
  thumbColor: "#845226",
};
