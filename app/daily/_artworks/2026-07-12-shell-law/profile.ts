import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-12",
  slug: "shell-law",
  title: "Shell Law",
  artist: {
    name: "Keiko Narita",
    hometown: "Osaka",
    era: "Active 2001–present",
    medium: "molluscan cross-section photography, fossil-cast prints, lathe-cut shell study prints",
    manifesto: "the shell is indifferent to everything you learn from it",
  },
  visualBrief: {
    palette: "monochrome",
    composition: "timeline",
    interaction: "erase",
    renderMode: "css-dom",
    mood: "loud",
    material: "screen",
  },
  personality: {
    temperament: "grandiose",
    socialEnergy: "radio-host",
    humor: "absurd",
    pressure: "overheated",
    voice: "emergency-manual",
    signature:
      "She annotates her specimens with management advice the specimens never took, files the annotations under INAPPROPRIATE PROTOCOLS, and considers this the most rigorous natural history she has done.",
  },
  explanation:
    "I found Solariella iris in a footnote about gastropod phylogeny — a sea snail named after the sun and the rainbow, which is a lot to ask of something four millimetres across. Its shell cross-section is a perfect timeline of concentric growth rings, and while I was drawing them I kept thinking: what if Robert Greene had got there first? Each ring in this piece carries one of the 48 Laws of Power, deposited in the calcium during growth. The snail enacted none of them. You are welcome to uncover the full record.",
  interaction:
    "Drag across the shell to erase each growth ring and reveal the Law deposited in that calcium layer — because the only way to read the management advice is to destroy the shell.",
  medium: "CSS-DOM with pointer-drag erase reveal, band-level opacity transition",
  inspiration:
    "Seed trace: source=random-encyclopedia; premise=Solariella iris is a species of sea snail, a marine gastropod mollusk in the family Solariellidae. What if its shell cross-section — a perfect concentric growth timeline — had been quietly encoding the 48 Laws of Power during each calcium deposit, and the snail had enacted none of them?; temperament=grandiose; socialEnergy=radio-host; humor=absurd; pressure=overheated; voice=emergency-manual; wildMove=gastropod-as-management-consultant; interface=scratch-reveal; motion=band-erase; materialMutation=calcium-as-text; scaleRupture=48-laws-in-4mm-shell; antiDefault=no-dark-ground-no-shimmer-no-instrument-panel.",
  thumbColor: "#7a7874",
};
