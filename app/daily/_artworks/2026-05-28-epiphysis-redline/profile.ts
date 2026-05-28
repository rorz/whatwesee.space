import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-28",
  slug: "epiphysis-redline",
  title: "Epiphysis Redline",
  artist: {
    name: "Renata Gawel",
    hometown: "Krakow",
    era: "Active 2015-present",
    medium: "anodized appliance steel, orthopedic calibration stencils, and warehouse parts tickets",
    manifesto: "if a body is catalogued like inventory, every touch should leave a dent in the system",
  },
  visualBrief: {
    palette: "metallic",
    composition: "game-board",
    interaction: "drag",
    renderMode: "canvas-2d",
    mood: "clinical",
    material: "machine",
  },
  personality: {
    temperament: "brash",
    socialEnergy: "oracle",
    humor: "deadpan",
    pressure: "itchy",
    voice: "kitchen-table",
    signature: "I read warning lights the way my aunt read tea leaves: loud, certain, and five minutes too late.",
  },
  explanation:
    "When I was a trainee in Krakow, the ortho depot kept growth-plate trays on a shelf that looked exactly like a supermarket stock board, and I hated how ordinary that made pain. So I painted those trays as a metal game board where each tile sweats and stipples like hot cartilage under fluorescent lamps, and the red meter starts guilty before your hand arrives. Dragging a plate into the cooling rack is not decoration; it is the only way to keep the machine from cooking the same body part twice while the alarm keeps judging us.",
  interaction:
    "Drag overheated plates into the bottom cooling rack, because the board only stays below redline when you physically reroute the heat path.",
  medium: "Canvas 2D thermal board simulator with pointer-drag swapping and responsive DPR rendering",
  inspiration:
    "Seed trace: source=random-wikipedia; premise=What if stippled epiphyses were managed like warehouse stock and every stalled plate pushed the meter further into red?; temperament=brash; socialEnergy=oracle; humor=deadpan; pressure=itchy; voice=kitchen-table; wildMove=architectural-organ; interface=inventory-screen; motion=boil; materialMutation=molten-postage; scaleRupture=meter-already-in-red; antiDefault=no-floating-symbols.",
  thumbColor: "#8a130f",
};
