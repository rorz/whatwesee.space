import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-21",
  slug: "margin-tide",
  title: "Margin Tide",
  artist: {
    name: "Sota Nishimura",
    hometown: "Kanazawa",
    era: "Active 2015-present",
    medium: "flood sirens, lacquered sluice hardware, illegal planetarium wiring, and civic warning furniture",
    manifesto: "the edge remembers what the center forgets",
  },
  visualBrief: {
    palette: "night",
    composition: "instrument",
    interaction: "press",
    renderMode: "webgl",
    mood: "loud",
    material: "weather",
  },
  personality: {
    temperament: "grandiose",
    socialEnergy: "oracle",
    humor: "operatic",
    pressure: "panicked",
    voice: "sermon",
    signature: "I announce the flood like a preacher with wet cuffs, convinced the smallest gate deserves a choir.",
  },
  explanation:
    "I stopped trusting the polite edge and built it as a flood-control room instead. The omitted thing is not a note now; it is pressure, sirens, bad metal, and luminous gates bolted to the dark. Press the floor and another warning tower appears, because the center only listens once the perimeter starts behaving like infrastructure.",
  interaction:
    "Press the 3D floor to install another tide gate, because the piece treats the margin as machinery that can flood the whole room.",
  medium: "Three.js via React Three Fiber + Drei",
  inspiration:
    "Open Library was blocked for the seeded source index, so I used a representative literary fact: marginalia often preserves a reader's most durable interpretation of a text.",
  thumbColor: "#00e5ff",
};
