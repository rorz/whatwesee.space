import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-25",
  slug: "rattle-alphabet",
  title: "Rattle Alphabet",
  artist: {
    name: "Arvi Ketola",
    hometown: "Turku",
    era: "Active 2012-present",
    medium: "field radio cue cards, onion-skin signal logs, and lacquered rehearsal desks",
    manifesto: "clarity is only true after the table survives a jolt",
  },
  visualBrief: {
    palette: "black-ground",
    composition: "instrument",
    interaction: "shake",
    renderMode: "webgl",
    mood: "chaotic",
    material: "paper",
  },
  personality: {
    temperament: "mournful",
    socialEnergy: "conspirator",
    humor: "sardonic",
    pressure: "litigious",
    voice: "market-stall",
    signature: "I keep a rehearsal desk because certainty is a product I sell only to people willing to watch it fall apart.",
  },
  explanation:
    "I found the Finnish Armed Forces radio alphabet and remembered how a clean call sign can collapse once the desk starts shaking. I built a rehearsal instrument where paper strips keep slapping the chassis and swapping order, because certainty in transmission is always temporary. The black room stays strict, but the labels only become trustworthy after I rattle them and watch which ones settle first.",
  interaction:
    "Shake the instrument by rapidly dragging across it, because the work treats legibility as something tested by physical disturbance rather than guaranteed by design.",
  medium: "React Three Fiber scene with procedural paper-strip instrument physics",
  inspiration:
    "Seeded source index 0 (Random Wikipedia) returned Finnish Armed Forces radio alphabet, prompting a premise about phonetic certainty being stress-tested by bodily motion.",
  thumbColor: "#07070d",
};
