import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-20",
  slug: "fifteen-seats",
  title: "Fifteen Seats",
  artist: {
    name: "Ngaio Pryor",
    hometown: "Wellington",
    era: "Active 2009–present",
    medium: "electoral tally sheets, swing-district charts, and acetate vote overlays",
    manifesto: "a majority is just a held breath; hold long enough and it drops",
  },
  visualBrief: {
    palette: "earth",
    composition: "diagram",
    interaction: "erase",
    renderMode: "mixed-dom",
    mood: "deadpan",
    material: "weather",
  },
  personality: {
    temperament: "wry",
    socialEnergy: "bureaucratic",
    humor: "sardonic",
    pressure: "overheated",
    voice: "municipal-romantic",
    signature: "She catalogs swing percentages the way other people catalog grievances — quietly, in columns, adding the asterisk only when the result is larger than anyone expected.",
  },
  explanation:
    "I keep a box of 1990s Victorian tally sheets under the spare bed, the photocopied kind that scrutineers held at counting tables and marked in pencil as results came in. Fifteen seats is a small number until you watch them go: each one a rural district the Coalition had counted on since 1992. The golden squares in the middle are the rural marginals; drag over them and feel which ones soften. The blue ones on the left were always going to stay.",
  interaction:
    "Drag to erase the golden rural seats from the Coalition's tally — each pass wears them a little closer to flipping, because a marginal rural community does not switch in one night.",
  medium: "Responsive mixed-DOM grid with canvas-drawn seat tally, pointer-drag pressure simulation, and live count",
  inspiration:
    "Seed trace: source=random-wikipedia=The Liberal–National Coalition led by Jeff Kennett and Pat McNamara, which had held majority government since the 1992 election, lost 15 seats and its majority due mainly to a swing against it in rural and regional Victoria.; premise=What if you could replay the 1999 Victorian rural swing seat by seat, erasing the Coalition's hold one competitive percentage at a time?; temperament=wry; socialEnergy=bureaucratic; humor=sardonic; pressure=overheated; voice=municipal-romantic; wildMove=majority-as-held-breath; interface=tally-sheet; motion=erase; materialMutation=seat-as-weather-front; scaleRupture=fifteen-looks-small-until-it-lands; antiDefault=no-dark-ground-no-canvas.",
  thumbColor: "#d4a850",
};
