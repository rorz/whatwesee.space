import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-08",
  slug: "lyttelton-dispatch",
  title: "Lyttelton Dispatch",
  artist: {
    name: "Tane Wirihana",
    hometown: "Christchurch",
    era: "Active 2007–present",
    medium: "colonial broadsheet facsimiles, letterpress proof photography, archival ink-bath studies",
    manifesto: "the same event, reported twice, is not the same event",
  },
  visualBrief: {
    palette: "earth",
    composition: "typographic",
    interaction: "tune",
    renderMode: "canvas-2d",
    mood: "deadpan",
    material: "machine",
  },
  personality: {
    temperament: "wry",
    socialEnergy: "heckling",
    humor: "sardonic",
    pressure: "litigious",
    voice: "municipal-romantic",
    signature:
      "He keeps a file of corrections he has never sent, organised by newspaper and sorted by how long the editor took to stop being wrong.",
  },
  explanation:
    "I found Crosbie Ward in a footnote — the kind that says 'see also' and takes you somewhere the main text couldn't afford to go. He bought the Lyttelton Times in 1856 and spent eleven years making Canterbury's public record accurate and uncomfortable in equal measure. I rebuilt one of his dispatches and handed the dial to you. Turn it: at zero you get the official account; at full rotation you get what Ward would have sent to press, which is the same meeting reported at a different frequency.",
  interaction:
    "Drag the tuner to increase the editorial frequency; at each register the compositor substitutes a sharper phrase, because a satirist and a straight reporter transcribe different facts from the same room.",
  medium: "Canvas 2D newspaper compositor with horizontal wit-tuner and token-level phrase substitution",
  inspiration:
    "Seed trace: source=random-wikipedia; premise=Crosbie Ward was a New Zealand politician who served as a member of the Canterbury Provincial Council (1855–1867) and as a member of parliament (1858–1867). His younger brother Hamilton and two elder brothers had gone to New Zealand and when the elder brothers drowned, Crosbie Ward came to New Zealand to support Hamilton. Together with Charles Bowen, Ward bought the Lyttelton Times in 1856 and he was soon regarded as 'Canterbury's best satirical writer' with a 'penetrating wit'. He successfully — what if that editorial frequency — the wit dial — could be applied to a colonial provincial dispatch so the same meeting could be read at any register from formal reportage to full Ward-style satire?; temperament=wry; socialEnergy=heckling; humor=sardonic; pressure=litigious; voice=municipal-romantic; wildMove=dial-as-editorial-lens; interface=newspaper-compositor; motion=phrase-substitution; materialMutation=column-as-register; scaleRupture=eleven-years-of-wit-in-one-turn; antiDefault=no-dark-ground-no-shimmer-no-instrument-panel.",
  thumbColor: "#c8860a",
};
