import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-17",
  slug: "unincorporated",
  title: "Unincorporated",
  artist: {
    name: "Wade Ellison",
    hometown: "Shreveport",
    era: "Active 2007–present",
    medium: "survey-peg diagrams, county cadastral map reproductions, and color-coded land registry prints",
    manifesto: "a lot needs a color before it needs a zoning code",
  },
  visualBrief: {
    palette: "high-chroma",
    composition: "game-board",
    interaction: "plant",
    renderMode: "html-controls",
    mood: "loud",
    material: "architecture",
  },
  personality: {
    temperament: "grandiose",
    socialEnergy: "foreman",
    humor: "sardonic",
    pressure: "domestic",
    voice: "workshop-gothic",
    signature: "He reads a cadastral survey the way other people read a recipe, marking the margins when a lot line surprises him — and a lot line always surprises him, because unincorporated land has no obligation to make sense.",
  },
  explanation:
    "I keep a folder of county plats where whole communities show up — roads named, post offices running, census takers making their rounds — without a word of incorporation on record. Fontanet is that kind of place: 347 residents, ZIP 47851, and no mayor because nobody ever filed the paperwork for one. You build a town the same way you build a friendship: one lot at a time, no charter required, just the old rule that touching makes you neighbors.",
  interaction:
    "Click any empty lot to plant a building; touching lots pick up the same block color, because adjacency is the only zoning law on the books.",
  medium: "Responsive HTML grid with BFS component coloring and a running census tally",
  inspiration:
    "Seed trace: source=random-wikipedia=Fontanet is an unincorporated census-designated place in central Nevins Township, Vigo County, in the U.S. state of Indiana. It lies along Baldwin St., northeast of the city of Terre Haute. Although Fontanet is unincorporated, it has a post office, with the ZIP Code of 47851. As of the 2020 census, Fontanet had a population of 347.; premise=What if the 347 residents of Fontanet had to build their town lot by lot, with no charter and no zoning board, and adjacency was the only rule that made neighbors?; temperament=grandiose; socialEnergy=foreman; humor=sardonic; pressure=domestic; voice=workshop-gothic; wildMove=community-without-authority; interface=cadastral-grid; motion=snap; materialMutation=lot-as-building; scaleRupture=347-never-quite-enough; antiDefault=no-dark-ground.",
  thumbColor: "#2563eb",
};
