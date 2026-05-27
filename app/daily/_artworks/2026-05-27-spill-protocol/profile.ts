import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-27",
  slug: "spill-protocol",
  title: "Spill Protocol",
  artist: {
    name: "Lek Saisurat",
    hometown: "Chiang Mai",
    era: "Active 2009–present",
    medium: "clinical reagent flow-charts, pressure-sealed specimen bags, and emergency protocol wall posters",
    manifesto: "taxonomy only becomes an emergency when the specimens are still moving.",
  },
  visualBrief: {
    palette: "night",
    composition: "single-object",
    interaction: "sort",
    renderMode: "html-controls",
    mood: "comic",
    material: "organism",
  },
  personality: {
    temperament: "prissy",
    socialEnergy: "doctor",
    humor: "childlike",
    pressure: "solemn",
    voice: "lab-notes",
    signature: "I label each container twice — once for the record and once because it calms me while the specimen is still moving.",
  },
  explanation:
    "In my laboratory in Chiang Mai I once received a shipment of twelve unclassified organisms and the customs agent had labelled them all 'miscellaneous goods.' I stayed up until 4 a.m. sorting them into the correct bins, and three of them disagreed. The machine you are looking at is a reconstruction of that night: a dark panel, one glowing specimen at a time, four buttons and the knowledge that pressing the wrong one will register on your permanent record. Each organism has a hint printed beneath its name. I wrote the hints myself and I do not apologise for how unhelpful they are.",
  interaction:
    "Press PLANT, ANIMAL, FUNGUS, or UNKNOWN to classify the current specimen; a correct sort advances the queue, a wrong one spills the specimen and logs the error against you.",
  medium: "HTML controls panel with React state and CSS keyframe animations",
  inspiration:
    "Seed trace: source=hacker-news (blocked; representative fact: a Show HN thread demonstrated a live organism auto-classifier that kept mislabelling fungi as plants); premise=What if a machine built to sort living things could not stop spilling them?; temperament=prissy; socialEnergy=doctor; humor=childlike; pressure=solemn; voice=lab-notes; wildMove=hostile-toy; interface=vending-machine; motion=spill; materialMutation=alive-plastic; scaleRupture=button-with-consequences; antiDefault=no-even-spacing.",
  thumbColor: "#060e1c",
};
