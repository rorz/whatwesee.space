import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-28",
  slug: "arm-chart",
  title: "Arm Chart",
  artist: {
    name: "Cal Norten",
    hometown: "Duluth",
    era: "Active 2016–present",
    medium: "chalk diagrams on dugout concrete, hand-annotated radar printouts",
    manifesto: "the shoulder never lies, even when the pitcher does.",
  },
  visualBrief: {
    palette: "high-chroma",
    composition: "map",
    interaction: "drag",
    renderMode: "canvas-2d",
    mood: "meditative",
    material: "mineral",
  },
  personality: {
    temperament: "suspicious",
    socialEnergy: "foreman",
    humor: "dry",
    pressure: "civic",
    voice: "ship-log",
    signature: "I write down arm angles on my palm if I run out of notebook, because the shoulder tells the truth even when the pitch doesn't.",
  },
  explanation:
    "I spent three seasons in Duluth watching the same kid throw the same pitch to the same outside corner, and I started mapping it. Not on a screen — on graph paper, folded in my jacket pocket, one dot per pitch. By game four the heat told me everything: he owned the low-right quadrant, avoided the hands, and had no plan for a lefty who crowded the plate. What you are looking at is that pocket chart, promoted to a wall.",
  interaction:
    "Drag from anywhere on the canvas toward the zone to throw a pitch; releasing inside the zone registers it on the chart and the scout's running read updates every third arrival.",
  medium: "Canvas 2D with heat overlay and React state",
  inspiration:
    "Seed trace: source=random-wikipedia; premise=Joe Bisenius — a pitcher who became an area scout, watching from the third row the same motion he performed six thousand times. What if the notebook he keeps is a living heat map, one dot per pitch, slowly revealing the arm's honest opinion of itself?; temperament=suspicious; socialEnergy=foreman; humor=dry; pressure=civic; voice=ship-log; wildMove=the-chart-becomes-the-verdict; interface=probability-map; motion=accumulate; materialMutation=chalk-on-stone; scaleRupture=each-dot-is-a-read; antiDefault=no-dark-panel-no-neon.",
  thumbColor: "#e05c1a",
};
