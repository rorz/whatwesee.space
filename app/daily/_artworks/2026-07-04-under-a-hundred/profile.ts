import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-04",
  slug: "under-a-hundred",
  title: "Under a Hundred",
  artist: {
    name: "Brid Conneely",
    hometown: "Clifden",
    era: "Active 2010–present",
    medium: "parish register reproductions, census-form woodblock prints, administrative cartography",
    manifesto: "the form asks for what exists; the existence is what the form cannot keep",
  },
  visualBrief: {
    palette: "institutional",
    composition: "field",
    interaction: "sort",
    renderMode: "text-grid",
    mood: "industrial",
    material: "transit",
  },
  personality: {
    temperament: "suspicious",
    socialEnergy: "foreman",
    humor: "petty",
    pressure: "civic",
    voice: "workshop-gothic",
    signature:
      "She photocopies parish schedules the day before they change and files the old versions in a folder labeled EVIDENCE, because she has found no better word for it.",
  },
  explanation:
    "I grew up eight miles from a townland so small the census office had already decided to count it elsewhere before the ink dried. At eighty-seven residents, Walden Stubbs officially ceased to be a countable unit in 2011 — its people absorbed wholesale into Womersley, a village they had never lived in. Sort them however you like; the column they end up in belongs to somewhere else.",
  interaction:
    "Click to cycle the sort mode — each new axis hands the census a cleaner register, and a cleaner register is how a village disappears into its neighbor's headcount.",
  medium: "DOM text-grid with RAF position interpolation and absorption sequence",
  inspiration:
    "Seed trace: source=random-encyclopedia=Walden Stubbs is a small, rural village and civil parish in North Yorkshire, England. At the 2011 Census, the population was less than 100, so the details are included in the civil parish of Womersley.; premise=What if the 87 residents of Walden Stubbs could be sorted by any administrative axis, and each successful sort moved them one step closer to being counted out of existence — absorbed into the neighboring parish as the census required?; temperament=suspicious; socialEnergy=foreman; humor=petty; pressure=civic; voice=workshop-gothic; wildMove=sorting-as-erasure; interface=census-register; motion=alphabetical-drift; materialMutation=village-as-headcount; scaleRupture=eighty-seven-names-in-one-column; antiDefault=no-dark-ground-no-shimmer-no-instrument-panel.",
  thumbColor: "#4a6980",
};
