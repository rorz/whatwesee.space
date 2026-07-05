import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-05",
  slug: "the-blocking",
  title: "The Blocking",
  artist: {
    name: "Citlali Bravo",
    hometown: "Guadalajara",
    era: "Active 2004–present",
    medium: "pre-visualization animatics, film blocking diagrams, digital stand-in photography",
    manifesto: "the proxy actor was always better; the director just hadn't admitted it yet",
  },
  visualBrief: {
    palette: "high-chroma",
    composition: "timeline",
    interaction: "erase",
    renderMode: "canvas-2d",
    mood: "loud",
    material: "machine",
  },
  personality: {
    temperament: "wry",
    socialEnergy: "radio-host",
    humor: "sardonic",
    pressure: "sulking",
    voice: "emergency-manual",
    signature:
      "She keeps the pre-viz reel from a feature that wrapped in 2011 because the grey-box version had better timing than anything they managed on the day, and she is never going to stop being right about it.",
  },
  explanation:
    "I worked in pre-viz for twelve years and the only thing I know for certain is that the grey-box version is almost always better than the shoot. The real actor brings hesitation and a wrong read, the director accommodates the wrong read, and by take three the blocking has shifted entirely for reasons nobody will remember. You can erase the keyframe diamonds and hand each actor back to neutral — the blank idle pose the software defaults to when nobody has told it where to stand yet. It reloads, the way a pre-viz always does.",
  interaction:
    "Erase keyframe diamonds from each actor's lane; removing a mark releases that actor from its blocking, and an actor with no marks has nowhere on the floor to be — which is exactly what it looked like before anyone knew what the film was.",
  medium: "Canvas 2D pre-viz stage with per-actor keyframe interpolation, timeline erase interaction, and idle-drift reset",
  inspiration:
    "Seed trace: source=random-encyclopedia=Antics3D was a real-time 3D animation software published by Antics Technologies, used for pre-visualization, storyboarding, machinima, and forensic animation; premise=What if a pre-viz blocking session could be unbuilt keyframe by keyframe, each erased mark releasing an actor from their direction until the stage reverted to the software default idle pose — the void before anyone knew what the film was?; temperament=wry; socialEnergy=radio-host; humor=sardonic; pressure=sulking; voice=emergency-manual; wildMove=keyframe-erasure-as-undirecting; interface=timeline-lanes; motion=position-interpolation; materialMutation=grey-box-stand-in-as-actor; scaleRupture=twelve-years-reduced-to-one-pre-viz; antiDefault=no-dark-ground-no-shimmer-no-control-panel.",
  thumbColor: "#e86828",
};
