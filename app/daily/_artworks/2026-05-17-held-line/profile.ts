import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-17",
  slug: "held-line",
  title: "Held Line",
  artist: {
    name: "Vesna Kovacevic",
    hometown: "Sarajevo",
    era: "Active 2012-present",
    medium: "public-address switches, lacquered warning panels, switchboard choreography, and confiscated civic sirens",
    manifesto: "if nobody holds it, it was never said",
  },
  visualBrief: {
    palette: "primary",
    composition: "instrument",
    interaction: "hold",
    renderMode: "html-controls",
    mood: "loud",
    material: "machine",
  },
  personality: {
    temperament: "brash",
    socialEnergy: "foreman",
    humor: "menacing",
    pressure: "overheated",
    voice: "emergency-manual",
    signature: "I talk in red paint and short orders, with one palm flat on the switch until the room admits it heard me.",
  },
  explanation:
    "I wanted the sentence to stop fading like a tasteful archive and start behaving like a public alarm with one very crude button. The line survives only while the body commits pressure to it; release it and the switchboard loses nerve. It is ugly on purpose, because quiet systems are too good at making refusal look procedural.",
  interaction:
    "Hold the panel down to keep the warning circuit alive, because the work makes attention into a physical load on the machine.",
  medium: "HTML control surface + CSS alarm grid",
  inspiration:
    "Seed index 2 (Hacker News top of day) was network-blocked, so I used a representative front-page fact: headlines churn quickly and only the lines readers keep returning to stay culturally visible.",
  thumbColor: "#ff2638",
};
