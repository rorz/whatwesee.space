import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-13",
  slug: "the-count",
  title: "The Count",
  artist: {
    name: "Dolores Vigil",
    hometown: "Detroit",
    era: "Active 1977–present",
    medium: "boxing gymnasium photography, corner-bucket documentation, ring-canvas close study",
    manifesto: "the canvas remembers everything; the count does not",
  },
  visualBrief: {
    palette: "metallic",
    composition: "room-scene",
    interaction: "collide",
    renderMode: "css-dom",
    mood: "severe",
    material: "body",
  },
  personality: {
    temperament: "bossy",
    socialEnergy: "radio-host",
    humor: "morbid",
    pressure: "medical",
    voice: "emergency-manual",
    signature:
      "She announces the knockdown before it completes and the referee has never once beaten her count, which is the only statistic she keeps.",
  },
  explanation:
    "I have worked ringside at nine hundred and forty-two professional bouts in forty-seven years. Every body that hits the canvas makes the same shape — a temporary shape, sometimes, and sometimes not. The ten-count is not for the fighter; it is for the record. I built you the count: you decide if it closes.",
  interaction:
    "Click the canvas to push against it — each strike adds brief upward force, and if you accumulate enough before the referee reaches ten, the fighter rises; the canvas only keeps what you fail to contest.",
  medium: "CSS-DOM room-scene with setInterval count loop and impact ripple physics",
  inspiration:
    "Seed trace: source=random-encyclopedia; premise=Knockout is a 1941 American sports drama film directed by William Clemens and written by M. Coates Webster. The film stars Arthur Kennedy, Olympe Bradna, Virginia Field, Anthony Quinn, Cliff Edwards and Cornel Wilde.; temperament=bossy; socialEnergy=radio-host; humor=morbid; pressure=medical; voice=emergency-manual; wildMove=visitor-as-fighter-pushing-off-canvas; interface=ring-canvas-floor; motion=force-accumulation; materialMutation=body-against-canvas; scaleRupture=nine-hundred-bouts-one-count; antiDefault=no-dark-ground-no-particle-field-no-gradient-wash.",
  thumbColor: "#c8d8e8",
};
