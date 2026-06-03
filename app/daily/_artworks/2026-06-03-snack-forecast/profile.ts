import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-03",
  slug: "snack-forecast",
  title: "Snack Forecast",
  artist: {
    name: "Tomoko Igarashi",
    hometown: "Nagoya",
    era: "Active 2017–present",
    medium: "tram timetable silks, hand-cut route decals, and sugar glazing over thermal receipt rolls",
    manifesto: "if the rain is coming, people deserve to taste it before the bus doors fold open",
  },
  visualBrief: {
    palette: "pastel",
    composition: "field",
    interaction: "erase",
    renderMode: "canvas-2d",
    mood: "tender",
    material: "transit",
  },
  personality: {
    temperament: "tender",
    socialEnergy: "maternal",
    humor: "childlike",
    pressure: "solemn",
    voice: "workshop-gothic",
    signature:
      "She talks in a soft station hush, then taps each candy forecast with a wrench as if blessing tiny weather saints before the evening buses arrive.",
  },
  explanation:
    "I spent one monsoon season at a Nagoya depot kiosk handing out throat drops to drivers, and that is when I started calling the sky by flavor instead of cloud type. Here the checkout floor tilts under your shoes while route sweets queue in a jitter, each one stamped with rain, heat, or wind before a single bus has opened its doors. Wipe the steamed glass and the forecast snacks come clear, because my city trusts weather when it can be held on the tongue for a second.",
  interaction:
    "Erase the fogged window with your pointer so the queued forecast sweets become legible enough to choose before your stop appears.",
  medium: "Responsive Canvas 2D field with pointer-erase fog mask, stuttering queue animation, and DPR-aware redraw",
  inspiration:
    "Seed trace: source=hacker-news-front-page=CT scans of BYD car parts; premise=What if CT scans of BYD car parts were sold at a bus-stop checkout as edible weather sweets for riders waiting in line?; temperament=tender; socialEnergy=maternal; humor=childlike; pressure=solemn; voice=workshop-gothic; wildMove=edible-weather; interface=checkout-counter; motion=stutter; materialMutation=radioactive-cloth; scaleRupture=floor-tilted-wrong; antiDefault=no-explainer-panel.",
  thumbColor: "#ff8fb8",
};
