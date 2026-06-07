import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-07",
  slug: "mbp-triage",
  title: "MBP Triage",
  artist: {
    name: "Marisol Quintero",
    hometown: "Lima",
    era: "Active 2016–present",
    medium: "hospital incident whiteboards, bone density tracing films, and emergency ward stamp pads",
    manifesto: "if the dosage keeps multiplying, the chart should panic before the patient does",
  },
  visualBrief: {
    palette: "metallic",
    composition: "diagram",
    interaction: "collide",
    renderMode: "mixed-dom",
    mood: "loud",
    material: "machine",
  },
  personality: {
    temperament: "feral",
    socialEnergy: "conspirator",
    humor: "sardonic",
    pressure: "solemn",
    voice: "sermon",
    signature:
      "She preaches like a night-shift radiology chief, slapping wet stamps onto steel clipboards until every polite number confesses what it was hiding.",
  },
  explanation:
    "I learned to mistrust calm laboratory language after watching a night ward stay polite while the alarms kept climbing, so I built this chart to stop whispering. The left bay is a crooked receptor floor where stamped nodes scuttle like vertebrae on castors, and your marker body has to ram them into contact before the diagnosis log will admit what is happening. Each collision multiplies the potency readout because some hazards do not arrive loud at first; they arrive small, then suddenly too strong for the room to pretend it has time.",
  interaction:
    "Drive the marker puck into moving receptor nodes so each collision stamps the chart and forces the potency meter to reveal its runaway escalation.",
  medium: "Responsive mixed DOM diagram with collision simulation, stamped medical-chart ledger, and RAF-driven receptor drift",
  inspiration:
    "Seed trace: source=random-encyclopedia=4-Methyl-2,4-bis(4-hydroxyphenyl)pent-1-ene (MBP) is a metabolite of bisphenol A (BPA). MBP has potent estrogenic activity in vitro and in vivo, up to thousandfold stronger than BPA.; premise=What if a hospital triage operating system had to confess that a metabolite can hit receptors with thousandfold force before anyone sees the danger on the chart?; temperament=feral; socialEnergy=conspirator; humor=sardonic; pressure=solemn; voice=sermon; wildMove=fake-operating-system; interface=medical-chart; motion=stamp; materialMutation=bone-architecture; scaleRupture=viewport-split-unevenly; antiDefault=no-explainer-panel.",
  thumbColor: "#2f5dff",
};
