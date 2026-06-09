import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-09",
  slug: "rack-rent-orrery",
  title: "Rack Rent Orrery",
  artist: {
    name: "Tomoko Furuya",
    hometown: "Sapporo",
    era: "Active 2015–present",
    medium: "factory annunciator plates, observatory maintenance ledgers, and tax-office acrylic laminates",
    manifesto: "if a machine asks for rent, make it sing the receipt before dawn",
  },
  visualBrief: {
    palette: "high-chroma",
    composition: "instrument",
    interaction: "tune",
    renderMode: "svg",
    mood: "deadpan",
    material: "organism",
  },
  personality: {
    temperament: "feral",
    socialEnergy: "doctor",
    humor: "operatic",
    pressure: "overheated",
    voice: "diary-with-teeth",
    signature:
      "She checks every machine like a feverish patient and still finds room to sing at it when the numbers start hissing.",
  },
  explanation:
    "During winter maintenance at the hill station I watched a telescope spend more time proving its property value than finding one clean star, so I built this wrong instrument as revenge and diagnosis. The board is all bruised orange enamel and tiny rent knobs, while the observatory lungs puff off-axis and the central meter refuses to line up with its own labels. When you tune the controls, the rack stops posing as a lab and starts belting a landlord aria, and that shift from measurement to performance is the only honest reading I trust.",
  interaction:
    "Tune the three tiny controls until the crooked meter and the breathing rack agree on a key, because this instrument only admits a star after it sings the rent roll out loud.",
  medium: "Responsive SVG instrument panel with React state, seeded misalignment animation, and tiny-control tuning interaction",
  inspiration:
    'Seed trace: source=hacker-news:"xAI is looking more like a datacentre REIT than a frontier lab"; premise=What if an observatory control rack had to tune its rent yield like an aria before it was allowed to report a star?; temperament=feral; socialEnergy=doctor; humor=operatic; pressure=overheated; voice=diary-with-teeth; wildMove=wrong-instrument; interface=factory-hmi; motion=misalign; materialMutation=tax-office-neon; scaleRupture=control-too-small; antiDefault=no-poetic-grid.',
  thumbColor: "#ff5a1f",
};
