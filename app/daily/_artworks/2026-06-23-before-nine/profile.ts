import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-23",
  slug: "before-nine",
  title: "Before Nine",
  artist: {
    name: "Fenna Groot",
    hometown: "Groningen",
    era: "Active 2006–present",
    medium: "stage-prop inventories, production model photography, and handwritten blocking notes",
    manifesto: "a room told sideways is still a room; it just takes longer to leave",
  },
  visualBrief: {
    palette: "monochrome",
    composition: "room-scene",
    interaction: "hold",
    renderMode: "css-dom",
    mood: "tender",
    material: "document",
  },
  personality: {
    temperament: "tender",
    socialEnergy: "confessional",
    humor: "earnest-no-joke",
    pressure: "domestic",
    voice: "stage-whisper",
    signature:
      "She names every prop in a production before rehearsals begin, entering them in a small ledger — not because anyone else reads it, but because unnamed objects have a tendency to disappear.",
  },
  explanation:
    "I read 'night, Mother for the third time and noticed I kept skimming the stage directions to get to the dialogue — which is the only thing everyone else does too. But the stage directions are the play: candy dish filled, check; stove burner tested, check; gun cleaned, cleaned again. I built this room from those notes. Hold any object long enough and it settles — into you, or into the record, or just into having been held.",
  interaction:
    "Hold to dwell on an object; release when ready, because Jessie did the same — she was not in a hurry, she was being careful.",
  medium: "CSS-DOM room scene with pointer-hold duration tracking and per-object memory state",
  inspiration:
    "Seed trace: source=random-encyclopedia='night, Mother is a play by American playwright Marsha Norman. The play won the 1983 Pulitzer Prize for Drama and was nominated for the 1983 Tony Award for Best Play.; premise=What if the stage directions of 'night, Mother — the filling of the candy dish, the cleaning of the gun, the testing of the coffee maker — could be held and released as props in a final inventory, each one memorized by the gesture of dwelling?; temperament=tender; socialEnergy=confessional; humor=earnest-no-joke; pressure=domestic; voice=stage-whisper; wildMove=touring-a-room-as-a-farewell; interface=prop-shelf; motion=hold-and-release; materialMutation=room-as-document; scaleRupture=two-hours-in-one-frame; antiDefault=no-dark-ground-no-shimmer-no-instrument-panel.",
  thumbColor: "#b0a898",
};
