import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-14",
  slug: "verdict-and-verse",
  title: "Verdict and Verse",
  artist: {
    name: "Catalina Ruiz Méndez",
    hometown: "Oaxaca",
    era: "Active 2011–present",
    medium: "two-column filing systems, municipal court stamp collections, and newspaper column cutout assemblages",
    manifesto: "the verdict and the poem are the same sentence wearing different clothes",
  },
  visualBrief: {
    palette: "monochrome",
    composition: "split-screen",
    interaction: "sort",
    renderMode: "css-dom",
    mood: "severe",
    material: "document",
  },
  personality: {
    temperament: "prissy",
    socialEnergy: "schoolteacher",
    humor: "dry",
    pressure: "litigious",
    voice: "diary-with-teeth",
    signature:
      "She dates every line and files it twice — once under jurisprudence, once under regret — and she will find the duplicate.",
  },
  explanation:
    "I come from a line of women who kept two kinds of records — one set for the registry and one set for the drawer that nobody opened until someone died. When I heard about a man who sat in the same chair to write a verdict before noon and a poem by dusk, I recognized that habit completely. Here I took eight words that become law on the left and elegy on the right, and gave you the filing cabinet. You decide which column is the real one.",
  interaction:
    "Sort each word left into the verdict or right into the verse — the same eight words fill both documents, and which column you call the verdict is entirely yours to argue.",
  medium: "Responsive CSS-DOM split-screen with useReducer state, keyboard and pointer sort, and no external dependencies",
  inspiration:
    "Seed trace: source=random-wikipedia=Alexandro Martínez Camberos was a Mexican poet, writer, lawyer and judge.; premise=What if the verdict and the poem were the same eight words, and only your sorting of them determined which document was real?; temperament=prissy; socialEnergy=schoolteacher; humor=dry; pressure=litigious; voice=diary-with-teeth; wildMove=shared-vocabulary; interface=filing-cabinet; motion=snap; materialMutation=sentence-as-two-registers; scaleRupture=eight-words-too-few-for-either-document; antiDefault=no-animation-no-canvas.",
  thumbColor: "#5c6b7a",
};
