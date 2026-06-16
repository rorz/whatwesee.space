import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-16",
  slug: "forbidden-filament",
  title: "Forbidden Filament",
  artist: {
    name: "Sari Purnamawati",
    hometown: "Bandung",
    era: "Active 2016–present",
    medium: "tin toy rewiring, bench-paper annotations, and salvaged lamp sockets",
    manifesto: "if the room wants silence, hide a whole library in the thing they use for light",
  },
  visualBrief: {
    palette: "high-chroma",
    composition: "single-object",
    interaction: "collide",
    renderMode: "canvas-2d",
    mood: "deadpan",
    material: "paper",
  },
  personality: {
    temperament: "feral",
    socialEnergy: "heckling",
    humor: "deadpan",
    pressure: "litigious",
    voice: "school-notebook",
    signature:
      "She labels every wire in blunt pencil, then dares the inspector to explain why a library hidden in a lamp should count as an unauthorized fixture.",
  },
  explanation:
    "I grew up copying class notes under the kitchen bulb, and I always trusted that socket more than the teacher because it kept secrets longer. Today I built one fat yellow bulb on a lab bench sheet, then set forbidden titles circling it like gnats around wet metal until the little compliance nub can smack them into the glass. Each collision feeds a shelf line into the filament, so reading only appears after you physically interrupt every polite orbit.",
  interaction:
    "Drag the tiny compliance nub into the orbiting book tabs so each collision forces another banned shelf line to appear inside the bulb.",
  medium: "Canvas 2D single-object simulation with stuttering orbital collisions and responsive DPR-aware redraw",
  inspiration:
    "Seed trace: source=hacker-news-front-page=Banned Book Library in a Wi-Fi Smart Light Bulb; premise=What if a banned library survived inside a smart bulb, and the only way to read it was to ram a tiny compliance switch into each circling title until the filament admitted it?; temperament=feral; socialEnergy=heckling; humor=deadpan; pressure=litigious; voice=school-notebook; wildMove=impossible-machine; interface=lab-bench; motion=stutter; materialMutation=wet-metal; scaleRupture=control-too-small; antiDefault=no-calm-border.",
  thumbColor: "#ffe84a",
};
