import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-31",
  slug: "fossil-tide",
  title: "Fossil Tide",
  artist: {
    name: "Nour Amrani",
    hometown: "Béchar",
    era: "Active 2008–present",
    medium: "desert-floor fossil rubbings, compressed sandstone casts, sonar archive charts",
    manifesto: "the Sahara has been a seabed three times; I am collecting the invoices.",
  },
  visualBrief: {
    palette: "earth",
    composition: "split-screen",
    interaction: "hold",
    renderMode: "canvas-2d",
    mood: "deadpan",
    material: "weather",
  },
  personality: {
    temperament: "shy",
    socialEnergy: "bureaucratic",
    humor: "absurd",
    pressure: "domestic",
    voice: "school-notebook",
    signature:
      "I write my coordinates before I describe what I found, because the location is the part of the sentence that cannot be argued with.",
  },
  explanation:
    "I pick up marine fossils from the Algerian plateau the way other people pick up loose change — the Tethys Sea left its invoice here before anyone was keeping records. This shell is a real one: Cretaceous, probably a hundred million years old, sitting on sand that used to be seafloor. Hold long enough and the plateau remembers what it was. Let go and it goes back to forgetting.",
  interaction:
    "Hold anywhere on the canvas to let geological time run: the Tethys Sea rises back through the Algerian sand until you release.",
  medium: "Canvas 2D split-screen with time-keyed palette shift and procedural ammonite rendering",
  inspiration:
    "Seed trace: source=hacker-news-front-page; premise=I found a seashell in the middle of the desert — verbatim, a real discovery from today's front page implying a sea that no longer exists; temperament=shy; socialEnergy=bureaucratic; humor=absurd; pressure=domestic; voice=school-notebook; wildMove=slow-geological-reveal; interface=patience-meter; motion=flood; materialMutation=sand-to-seabed; scaleRupture=100-million-years-per-hold; antiDefault=no-glowing-orb-no-dark-panel-no-particle-cloud.",
  thumbColor: "#c9a96e",
};
