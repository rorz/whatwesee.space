import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-19",
  slug: "minimum-witness",
  title: "Minimum Witness",
  artist: {
    name: "Teppo Leinonen",
    hometown: "Tampere",
    era: "Active 2001–present",
    medium: "plotted state-transition diagrams, silk-screened computation traces, and precision-cut acetate overlays",
    manifesto: "every machine hides a smaller machine inside it; the craft is knowing which states to throw away",
  },
  visualBrief: {
    palette: "white-ground",
    composition: "field",
    interaction: "press",
    renderMode: "text-grid",
    mood: "severe",
    material: "machine",
  },
  personality: {
    temperament: "feral",
    socialEnergy: "heckling",
    humor: "menacing",
    pressure: "civic",
    voice: "kitchen-table",
    signature: "He draws automata the way a butcher sections a carcass — minimum cuts, no sentiment, and he is visibly annoyed if the machine needed more states than the proof allows.",
  },
  explanation:
    "I spent years drawing these on graph paper before I understood the minimality proof. The proof requires a witness string — one sequence that separates two states by landing the machine in acceptance from one and rejection from the other. Four rooms is all this language demands: whether you have seen both A and B, or only one, or neither. I gave you the field and two corridors. Press through enough sequences and you will know which room you want before you reach it.",
  interaction:
    "Press A or B to route each character through the machine; the active state cell shifts at every press, and only strings that carry both letters ever reach the ACCEPTED cell.",
  medium: "CSS DOM text-grid with useReducer state machine and transition-history tape",
  inspiration:
    "Seed trace: source=random-encyclopedia=Kai Tapani Salomaa is a Finnish Canadian theoretical computer scientist, known for his numerous contributions to the state complexity of finite automata. His highly cited 1994 joint paper with Yu and Zhuang laid the foundations of the area.; premise=What if the minimum number of states in a finite automaton became a witness game — four rooms, two corridors, and you pressing letters until the machine proves it cannot be made smaller?; temperament=feral; socialEnergy=heckling; humor=menacing; pressure=civic; voice=kitchen-table; wildMove=architectural-organ; interface=inventory-screen; motion=jam; materialMutation=wet-metal; scaleRupture=object-cropped-hard; antiDefault=no-terminal-only.",
  thumbColor: "#c4a020",
};
