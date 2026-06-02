import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-02",
  slug: "payload-limit",
  title: "Payload Limit",
  artist: {
    name: "Jim Hartnett",
    hometown: "Kenora",
    era: "Active 1998–present",
    medium: "aviation incident documentation, laminated load charts, photocopied weight-and-balance envelopes",
    manifesto: "the weight that kills the plane was on the manifest before anyone loaded the bags",
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
      "I weigh everything before I touch it — I keep a gram scale in my car for when the grocery receipt doesn't add up.",
  },
  explanation:
    "I found the load chart for Flight 126 in a library archive, printed on thermal paper that had already started going grey at the edges. Ten names, ten weights, the computed CG sitting exactly where the dispatcher wrote it — legal on paper, legal enough to board, legal enough to wave the plane onto the ramp. The kiosk shows the manifest as it should have stood at the Pelee Island gate: each seat occupied, each kilogram declared, the running total climbing past the certified limit while the balance diagram plots where the centre of gravity actually landed. Shake it and the dot moves to where physics said it was going.",
  interaction:
    "Tap or click the kiosk to shake it: the CG dot on the right panel jumps from the dispatcher's pencilled position to its true computed location, sitting outside the aft limit of the envelope.",
  medium: "Mixed DOM: CSS-styled HTML kiosk frame, inline SVG weight-and-balance envelope, React state",
  inspiration:
    "Seed trace: source=random-wikipedia; premise=Georgian Express Flight 126 — a ten-seat Cessna 208B overloaded and iced out of Pelee Island on 17 January 2004; the load chart held the answer before the engine started; temperament=prissy; socialEnergy=foreman; humor=operatic; pressure=hungry; voice=emergency-manual; wildMove=overconfident-kiosk; interface=vending-machine; motion=breathe; materialMutation=porcelain-software; scaleRupture=viewport-split-unevenly; antiDefault=no-decorative-particles.",
  thumbColor: "#D01E2F",
};
