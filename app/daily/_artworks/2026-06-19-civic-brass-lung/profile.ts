import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-19",
  slug: "civic-brass-lung",
  title: "Civic Brass Lung",
  artist: {
    name: "Thiago Nunes",
    hometown: "Recife",
    era: "Active 2012–present",
    medium: "salvaged stairwell vents, municipal alarm housings, and cast-brass reed arrays",
    manifesto: "if a city wants to breathe, it has to confess through its pipes",
  },
  visualBrief: {
    palette: "white-ground",
    composition: "field",
    interaction: "press",
    renderMode: "text-grid",
    mood: "severe",
    material: "architecture",
  },
  personality: {
    temperament: "feral",
    socialEnergy: "heckling",
    humor: "menacing",
    pressure: "civic",
    voice: "kitchen-table",
    signature:
      "He listens to stairwells the way mechanics listen to engines, grinning when a clean intake turns ragged and the whole block starts wheezing in unison.",
  },
  explanation:
    "I grew up over a bus corridor where every apartment learned to sleep through alarm tests, and I still trust a building more when it coughs at me first. So I built this white intake wall: cropped shafts, steel ribs, and brass throats that choke whenever one lane gets fed too hard. Your press is the verdict here — each shove reroutes breath across the block, and the jam tells you which tower now has to inhale secondhand.",
  interaction:
    "Press any lane to force extra air into it; the neighboring shafts seize and recover with it, because one overfed intake makes the whole block breathe out of sequence.",
  medium: "Responsive text-grid simulation with lane-pressure diffusion, deterministic jam dynamics, and pointer-press controls",
  inspiration:
    "Seed trace: source=fallback-noun=stairwell vent (issue world seed unavailable); premise=What if a city block had to breathe through one shared brass lung, and every forced intake made another shaft choke in public?; temperament=feral; socialEnergy=heckling; humor=menacing; pressure=civic; voice=kitchen-table; wildMove=architectural-organ; interface=inventory-screen; motion=jam; materialMutation=wet-metal; scaleRupture=object-cropped-hard; antiDefault=no-terminal-only.",
  thumbColor: "#1f9d55",
};
