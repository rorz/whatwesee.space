import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-06",
  slug: "brine-candy-rack",
  title: "Brine Candy Rack",
  artist: {
    name: "Paloma Nieri",
    hometown: "Callao",
    era: "Active 2018–present",
    medium: "market awning lettering, syrup-cooling coils, and improvised desalination toys",
    manifesto: "if the sea is coming through my stall, it should leave sweet enough for a child",
  },
  visualBrief: {
    palette: "fluorescent",
    composition: "pattern-system",
    interaction: "collide",
    renderMode: "text-grid",
    mood: "chaotic",
    material: "machine",
  },
  personality: {
    temperament: "suspicious",
    socialEnergy: "street-vendor",
    humor: "childlike",
    pressure: "domestic",
    voice: "municipal-romantic",
    signature:
      "She praises the harbor like a mayor in rubber sandals, then narrows her eyes at every valve as if the machine might shortchange a family before supper.",
  },
  explanation:
    "I grew up in Callao where the salt reaches the kitchen before the water does, and my mother still says the sea will walk indoors unless you sweet-talk it first. So I built this rack like a market inventory board: chartreuse cells, a red meter already shouting, and little brine sweets knocking their foreheads together until they remember how to become a drink. Tap the screen and slap the pellets into one another, because I do not trust a clean glass that arrives politely — fresh water ought to survive the same jostle as the street.",
  interaction:
    "Tap the rack to smack the salty pellets off course, because this stall only prints a drink once the weather sweets collide hard enough to turn fresh.",
  medium: "Responsive text-grid inventory screen with pointer shock collisions, simulated pellet motion, and DOM meter readouts",
  inspiration:
    'Seed trace: source=hacker-news-front-page="New method turns ocean water into drinking water, without waste"; premise=What if "New method turns ocean water into drinking water, without waste" showed up as a fluorescent market inventory rack where salty weather sweets had to collide before the stall would pour a clean glass?; temperament=suspicious; socialEnergy=street-vendor; humor=childlike; pressure=domestic; voice=municipal-romantic; wildMove=edible-weather; interface=inventory-screen; motion=breathe; materialMutation=fermented-screen; scaleRupture=meter-already-in-red; antiDefault=no-floating-symbols.',
  thumbColor: "#17c9ff",
};
