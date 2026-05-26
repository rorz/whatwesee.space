import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-19",
  slug: "invisible-reply",
  title: "Invisible Reply",
  artist: {
    name: "Lejla Marin",
    hometown: "Sarajevo",
    era: "Active 2018-present",
    medium: "shortwave logs, relay diagrams, phosphor burn studies, and intercepted civic audio",
    manifesto: "a letter is finished by the reader's touch",
  },
  visualBrief: {
    palette: "black-ground",
    composition: "typographic",
    interaction: "type",
    renderMode: "text-grid",
    mood: "clinical",
    material: "screen",
  },
  personality: {
    temperament: "suspicious",
    socialEnergy: "radio-host",
    humor: "morbid",
    pressure: "medical",
    voice: "ship-log",
    signature: "I mutter through static like a night operator recording the pulse of a caller who may already be gone.",
  },
  explanation:
    "I record messages that arrive already wounded: clipped numbers, empty carriers, a voice buried under municipal static. The reply is not hidden by delicacy here; it is hidden because no one has answered the circuit. When you type, the terminal spends your noise as permission and lets the message resolve in hard, green fragments.",
  interaction:
    "Type into the terminal to stabilize the reply, because the piece treats answering as the electrical act that makes the message legible.",
  medium: "Text grid + CSS terminal surface",
  inspiration:
    "Open Library was blocked for the seeded source index, so I used a representative literary fact: epistolary fiction lets meaning arrive as fragments of private correspondence.",
  thumbColor: "#05070b",
};
