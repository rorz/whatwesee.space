import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-10",
  slug: "district-missing",
  title: "District Missing",
  artist: {
    name: "Talia Verran",
    hometown: "Wellington",
    era: "Active 2018–present",
    medium: "floodgate pennants, nylon survey webbing, and estuary notice sleeves",
    manifesto: "if a map wants filing, let the missing line be the one that bites back",
  },
  visualBrief: {
    palette: "institutional",
    composition: "typographic",
    interaction: "press",
    renderMode: "mixed-dom",
    mood: "deadpan",
    material: "textile",
  },
  personality: {
    temperament: "wry",
    socialEnergy: "heckling",
    humor: "morbid",
    pressure: "panicked",
    voice: "emergency-manual",
    signature:
      "She reads the evacuation card with one eyebrow up, as if the dampest missing page in the cabinet has finally found a chance to heckle the room back.",
  },
  explanation:
    "I grew up near harbor offices where every loose thing got a strap before it got a story, and I still mistrust any estuary file that arrives too tidy. Here I turned Goat Island into an olive admission card: county, slough, and elevation buckle in politely while the district line coughs red plastic, slips sideways, and refuses every false manager you offer it. Keep pressing that bad line until it finally files the truth — not managed by any reclamation district — because a place this low and this exact should enter the room under its refusal, not under a district invented for clerks.",
  interaction:
    "Press the filing straps until the district band stops pretending to belong anywhere and locks into the card as not managed by any reclamation district.",
  medium: "Responsive mixed DOM typographic filing game with SVG strap routing, interval-driven jam motion, and press-triggered state changes",
  inspiration:
    "Seed trace: source=It is part of Solano County, and is not managed by any reclamation district.; premise=What if Goat Island could only be admitted to the archive after a filing bench jammed until the district line confessed that it is not managed by any reclamation district?; temperament=wry; socialEnergy=heckling; humor=morbid; pressure=panicked; voice=emergency-manual; wildMove=tiny-game; interface=lab-bench; motion=jam; materialMutation=alive-plastic; scaleRupture=manual-with-missing-page; antiDefault=no-terminal-only.",
  thumbColor: "#6f7b4b",
};
