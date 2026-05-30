import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-30",
  slug: "altitude-dispatch",
  title: "Altitude Dispatch",
  artist: {
    name: "Enid Owusu",
    hometown: "Kumasi",
    era: "Active 2004–present",
    medium: "hand-stamped registry forms, altitude notation studies, and zinc-block survey prints",
    manifesto: "where a record survives, the place was allowed to insist on being counted",
  },
  visualBrief: {
    palette: "monochrome",
    composition: "typographic",
    interaction: "shake",
    renderMode: "canvas-2d",
    mood: "ceremonial",
    material: "architecture",
  },
  personality: {
    temperament: "wry",
    socialEnergy: "doctor",
    humor: "earnest-no-joke",
    pressure: "litigious",
    voice: "municipal-romantic",
    signature:
      "She speaks like a clerk who has fallen in love with the forms themselves—precise, unhurried, and prepared to certify whatever coordinates God sees fit to produce.",
  },
  explanation:
    "I trained at the surveyors' school where we memorised coordinates for places we would never stand in. Waliso appeared one afternoon—8°32′N 37°58′E—and I copied it so many times the numbers felt like a name I had been handed to keep. The form here is that act: all columns and stacked data, not asking to be beautiful. Over time the characters drift from their home positions, the way a record goes sideways in a drawer nobody opens. When you shake, they snap back—not because anything is fixed, but because somebody finally rattled the desk.",
  interaction:
    "Shake the canvas by dragging rapidly; drifted characters snap back to their registered columns and the coherence meter climbs toward green.",
  medium: "Canvas 2D typographic form with per-field drift simulation and pointer-velocity shake detection",
  inspiration:
    "Seed trace: source=random-wikipedia; premise=What if the precise bureaucratic intake form for Waliso (8°32′N 37°58′E, 2063 m) were a living document that decays unless you physically rattle it back into coherence?; temperament=wry; socialEnergy=doctor; humor=earnest-no-joke; pressure=litigious; voice=municipal-romantic; wildMove=tiny-game; interface=pinball-backglass; motion=snap; materialMutation=porcelain-software; scaleRupture=meter-already-in-red; antiDefault=no-decorative-particles.",
  thumbColor: "#4a4440",
};
