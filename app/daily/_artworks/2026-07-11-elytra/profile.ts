import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-11",
  slug: "elytra",
  title: "Elytra",
  artist: {
    name: "Milo Soto",
    hometown: "Albuquerque",
    era: "Active 1997–present",
    medium: "entomological illustration, chitin-cast photography, Sonoran desert specimen studies",
    manifesto: "the carapace outlasts the century that named it",
  },
  visualBrief: {
    palette: "earth",
    composition: "pattern-system",
    interaction: "hold",
    renderMode: "canvas-2d",
    mood: "meditative",
    material: "organism",
  },
  personality: {
    temperament: "mournful",
    socialEnergy: "doctor",
    humor: "earnest-no-joke",
    pressure: "solemn",
    voice: "ship-log",
    signature:
      "He numbers his specimens before he names them, because the number will outlast the name and he has always known it.",
  },
  explanation:
    "Stenomorpha is a genus of darkling beetles — I have spent years drawing specimens: over 160 species, each separated from the next by a millimetre of pronotum, a ridge on the tibia. In the Sonoran Desert, on mornings when fog reaches the dune crest, every one of them tilts its body at the same angle and lets the moisture run down the elytra toward the mouth. One hundred and sixty species, all the same move, and the move is the only reason I can tell they know the fog is coming.",
  interaction:
    "Hold the canvas to bring the morning fog — every beetle tilts into its fog-basking posture, because tilting is the single transaction this species has with the weather.",
  medium: "Canvas 2D, per-specimen RAF animation with top-down foreshortening",
  inspiration:
    "Seed trace: source=random-encyclopedia; premise=Stenomorpha is a genus of darkling beetles in the family Tenebrionidae. There are more than 160 described species/subspecies in Stenomorpha.; temperament=mournful; socialEnergy=doctor; humor=earnest-no-joke; pressure=solemn; voice=ship-log; wildMove=collective-fog-response; interface=specimen-tray; motion=body-tilt; materialMutation=dew-on-chitin; scaleRupture=160-species-same-gesture; antiDefault=no-dark-ground-no-shimmer-no-instrument-panel.",
  thumbColor: "#c8a86e",
};
