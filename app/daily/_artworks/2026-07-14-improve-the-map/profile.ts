import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-14",
  slug: "improve-the-map",
  title: "Improve the Map",
  artist: {
    name: "Preethi Subramaniam",
    hometown: "Chennai",
    era: "Active 2001–present",
    medium: "hand-embroidered cartography, archival interventions in colonial survey documents",
    manifesto: "every map is already a kind of wrong; I add more wrongs until the territory admits it was never there",
  },
  visualBrief: {
    palette: "monochrome",
    composition: "map",
    interaction: "type",
    renderMode: "mixed-dom",
    mood: "comic",
    material: "textile",
  },
  personality: {
    temperament: "tender",
    socialEnergy: "maternal",
    humor: "earnest-no-joke",
    pressure: "panicked",
    voice: "lab-notes",
    signature: "She measures everything twice before noting it once, and has been known to add a question mark to a fact she witnessed personally, just to be safe.",
  },
  explanation:
    "My grandmother kept a folded survey of her city — not the right city, as it turned out, but a British rendering of what her city was meant to be, with roads that ran three kilometres wide and a harbour that had been moved north for administrative convenience. I have been adding corrections to that survey for twenty years with whatever tools are at hand. This one is yours now: click somewhere you think should be noted, then type what you know. Whether the result improves the survey is not my concern.",
  interaction:
    "Click to plant a mark on the survey, then type your observation — each keystroke stamps a large cream character onto the amber ground, and the map fills up with what visitors have decided to call things.",
  medium: "SVG map layer + DOM positioned annotation overlays",
  inspiration:
    "Seed trace: source=hacker-news; premise=An Englishwoman who sketched India before photography took hold — what if her field survey could receive new annotations from every visitor, each typed observation stamping large onto the amber ground until the map is more record than territory?; temperament=tender; socialEnergy=maternal; humor=earnest-no-joke; pressure=panicked; voice=lab-notes; wildMove=municipal-hallucination; interface=switchboard; motion=stamp; materialMutation=edible-circuitry; scaleRupture=oversized-labels; antiDefault=no-calm-border.",
  thumbColor: "#b86c14",
};
