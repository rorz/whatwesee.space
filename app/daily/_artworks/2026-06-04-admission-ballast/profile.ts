import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-04",
  slug: "admission-ballast",
  title: "Admission Ballast",
  artist: {
    name: "Runa Eikrem",
    hometown: "Reykjavík",
    era: "Active 2013–present",
    medium: "school-bell castings, municipal chalk bands, and salvaged calibration masses",
    manifesto: "if a bell cannot carry the class, it should confess its weight out loud",
  },
  visualBrief: {
    palette: "institutional",
    composition: "single-object",
    interaction: "trace",
    renderMode: "mixed-dom",
    mood: "clinical",
    material: "mineral",
  },
  personality: {
    temperament: "ceremonial",
    socialEnergy: "street-vendor",
    humor: "morbid",
    pressure: "medical",
    voice: "municipal-romantic",
    signature:
      "She calls attendance like a market crier in a clinic hallway, smiling while she taps each bell seam the way a nurse checks bruises before signing discharge.",
  },
  explanation:
    "I grew up near a foundry where cracked school bells were cut open for scrap, and every cut showed a fresh stack of hidden ballast behind the bronze skin. Here the bell leans over the floor and the emergency strip barks admissions while mineral pellets spill from every seam you wake up. When you trace each seam by hand, the bell stops pretending to be ceremonial and confesses which weight is carrying the room.",
  interaction:
    "Trace each horizontal seam from left to right to admit a row, because the broadcast only stabilizes after your hand proves where each hidden weight is lodged.",
  medium: "Responsive mixed DOM artwork with SVG ballast bell, pointer tracing logic, and emergency broadcast admission board",
  inspiration:
    "Seed trace: source=hacker-news-front-page=\"They're made out of weights\"; premise=What if the headline \"They're made out of weights\" described a school bell that only admits students after you trace every ballast seam?; temperament=ceremonial; socialEnergy=street-vendor; humor=morbid; pressure=medical; voice=municipal-romantic; wildMove=haunted-spreadsheet; interface=emergency-broadcast; motion=spill; materialMutation=tax-office-neon; scaleRupture=floor-tilted-wrong; antiDefault=no-single-object-reverence.",
  thumbColor: "#1458c9",
};
