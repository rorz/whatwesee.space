import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-29",
  slug: "storm-loom-tribunal",
  title: "Storm Loom Tribunal",
  artist: {
    name: "Junko Arakawa",
    hometown: "Kobe",
    era: "Active 2016–present",
    medium: "jacquard repair rituals, rain-harbor signal boards, and municipal warning siren rehearsals",
    manifesto: "if you want mercy from weather, stitch your testimony by hand",
  },
  visualBrief: {
    palette: "fluorescent",
    composition: "split-screen",
    interaction: "trace",
    renderMode: "mixed-dom",
    mood: "severe",
    material: "textile",
  },
  personality: {
    temperament: "wry",
    socialEnergy: "maternal",
    humor: "childlike",
    pressure: "litigious",
    voice: "sermon",
    signature: "I smile while issuing warnings, because a room listens better when judgment arrives carrying a lunchbox and a thunderclap.",
  },
  explanation:
    "I grew up watching harbor crews stitch torn tarps before typhoon season, and I learned that every knot is both prayer and evidence. On the left, fluorescent seams boil as you drag your finger through the loom, while the right console tallies each line as if weather could be cross-examined. When you trace the pattern yourself, the verdict button stops being decoration and starts feeling like a dare you are responsible for pressing.",
  interaction:
    "Trace across the loom to build a storm case, then press CONVICT STORM so the console turns your handwork into a public warning.",
  medium: "Responsive SVG loom map + React DOM weather-console controls with pointer-traced stitch simulation",
  inspiration:
    "Seed trace: source=hacker-news-front-page(blocked-representative-fact); premise=What if a weather console treated each traced seam as legal testimony against an incoming storm?; temperament=wry; socialEnergy=maternal; humor=childlike; pressure=litigious; voice=sermon; wildMove=tiny-game; interface=weather-console; motion=boil; materialMutation=edible-circuitry; scaleRupture=button-with-consequences; antiDefault=no-decorative-particles.",
  thumbColor: "#d5ff00",
};
