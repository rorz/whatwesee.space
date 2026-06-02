import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-02",
  slug: "payload-limit",
  title: "Payload Limit",
  artist: {
    name: "Jim Hartnett",
    hometown: "Thunder Bay",
    era: "Active 2011–present",
    medium: "charter dispatch worksheets, painted gate signage, and balance-envelope wall diagrams",
    manifesto: "a departure only deserves applause when the numbers survive being shaken",
  },
  visualBrief: {
    palette: "primary",
    composition: "room-scene",
    interaction: "shake",
    renderMode: "mixed-dom",
    mood: "loud",
    material: "body",
  },
  personality: {
    temperament: "prissy",
    socialEnergy: "foreman",
    humor: "operatic",
    pressure: "hungry",
    voice: "emergency-manual",
    signature:
      "He barks evacuation-grade instructions with a theater usher's flourish, as if every carry-on, elbow, and apology has to pass a final inspection whistle.",
  },
  explanation:
    "I learned dispatch from men who could estimate a load by the tilt of your shoulders at check-in, but they still kept a ruler in the breast pocket for the center-of-gravity chart. This room is my bright gate kiosk: names down the left, envelope on the right, all of it smiling too hard while the dot waits where I first penciled it. Shake the manifest and the smile slips, because the aircraft only tells the truth after every body is counted at full weight.",
  interaction:
    "Shake the manifest to force a re-weigh, because this flight only reveals its real balance once every passenger is physically thrown back onto the scale.",
  medium: "Responsive mixed-DOM departure kiosk with React state, animated manifest shake, and SVG weight-and-balance envelope plot",
  inspiration:
    "Seed trace: source=random-wikipedia=Georgian Express Flight 126 crash report + hacker-news-front-page aviation safety thread; premise=What if a gate kiosk looked triumphant until one hard shake exposed that the passenger weights had been underdeclared?; temperament=prissy; socialEnergy=foreman; humor=operatic; pressure=hungry; voice=emergency-manual; wildMove=overconfident-kiosk; interface=vending-machine; motion=breathe; materialMutation=porcelain-software; scaleRupture=viewport-split-unevenly; antiDefault=no-decorative-particles.",
  thumbColor: "#d01e2f",
};
