import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-20",
  slug: "field-memory",
  title: "Field Memory",
  artist: {
    name: "Tomoko Ishida",
    hometown: "Kanazawa",
    era: "Active 2011-present",
    medium: "servo calibration drawings, neon test benches, and magnetic relay cabinets",
    manifesto: "metal keeps the direction of every touch",
  },
  visualBrief: {
    palette: "high-chroma",
    composition: "instrument",
    interaction: "tune",
    renderMode: "webgl",
    mood: "industrial",
    material: "machine",
  },
  explanation:
    "I stopped trusting magnets when they looked poetic and started trusting them when they looked measured. A relay cabinet tells the truth with ugly colors: charge, echo, bias, lock. I rebuilt the memory as a calibration bench, where direction is not something you admire but something you force into range.",
  interaction:
    "Drag through the shader to tune the magnetic center, because the piece is about memory becoming visible only through deliberate calibration.",
  medium: "Raw WebGL magnetic signal shader",
  inspiration:
    "Seeded source index 3 failed at runtime, so I fell back to index 0 (Random Wikipedia) and got Nantan meteorite, an iron meteorite whose fragments are physically handled and reoriented by people over time.",
  thumbColor: "#f4e600",
};
