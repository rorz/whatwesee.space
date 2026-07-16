import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-16",
  slug: "by-marriage",
  title: "By Marriage",
  artist: {
    name: "Lena Hirsch",
    hometown: "Vienna",
    era: "Active 1992–present",
    medium: "heraldic diagram illustration, genealogical archive reconstruction, noble lineage prints on vellum",
    manifesto: "every title you inherit is somebody else's story wearing your face",
  },
  visualBrief: {
    palette: "fluorescent",
    composition: "diagram",
    interaction: "drag",
    renderMode: "svg",
    mood: "severe",
    material: "mineral",
  },
  personality: {
    temperament: "grandiose",
    socialEnergy: "bureaucratic",
    humor: "petty",
    pressure: "civic",
    voice: "workshop-gothic",
    signature:
      "She insists she does not personally believe in hereditary titles, which is why she has memorised the exact spelling of every Austrian archduchess back to 1547.",
  },
  explanation:
    "I have been cataloguing title transfers for thirty years — the moment in the archive where a woman's description changes from one column heading to another, all four previous titles struck through and replaced with a single new one. Helena got four for one. She was born with four and left with one, and the one is hereditary duchess consort, which is not even a first noun. I wanted to see what that rearrangement looks like in motion — not metaphorically, just spatially, as a diagram. The thing that happens in the middle is yours to name.",
  interaction:
    "Drag each of Helena's birth titles from the Habsburg column to the Württemberg frame; each badge briefly sprouts jointed appendages as it crosses the transfer line, which is the only acknowledgment this piece makes that the crossing was strange.",
  medium: "SVG diagram with RAF metamorphosis animation on drag-cross, drag-and-drop pointer events",
  inspiration:
    "Seed trace: source=random-encyclopedia; premise=Archduchess Helena of Austria was a member of the Tuscan branch of the House of Habsburg-Lorraine and an Archduchess of Austria and Princess of Bohemia, Hungary, and Tuscany by birth. Through her marriage to Philipp Albrecht, Hereditary Duke of Württemberg, Helena became a member of the House of Württemberg and Hereditary Duchess consort of Württemberg.; temperament=grandiose; socialEnergy=bureaucratic; humor=petty; pressure=civic; voice=workshop-gothic; wildMove=kafka-metamorphosis-legs-on-title-transfer; interface=archival-diagram; motion=drag-across-threshold; materialMutation=heraldic-medal-as-insect-body; scaleRupture=four-titles-reduced-to-one; antiDefault=no-dark-ground-no-particle-field-no-gradient-wash.",
  thumbColor: "#ff6700",
};
