import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-15",
  slug: "suave-form",
  title: "Suave Form",
  artist: {
    name: "Haruto Sekigawa",
    hometown: "Osaka",
    era: "Active 1988–present",
    medium: "woodblock totalisator prints, ceremonial race form documentation",
    manifesto:
      "the printer does not decide the favourite; the printer makes the favourite legible.",
  },
  visualBrief: {
    palette: "primary",
    composition: "diagram",
    interaction: "collide",
    renderMode: "svg",
    mood: "industrial",
    material: "machine",
  },
  personality: {
    temperament: "wry",
    socialEnergy: "oracle",
    humor: "operatic",
    pressure: "ritual",
    voice: "workshop-gothic",
    signature:
      "He sets the type for the favourite the night before the gates open, insisting this is not prophecy but preparation — a distinction he defends with considerable force and a mallet.",
  },
  explanation:
    "In Osaka in 1992 I printed my first race form the morning after the favourite had already lost. The numbers were right; the machine had simply chosen the wrong horse. I have been correcting for that ever since. Every block I set, every pressure I apply — the type eventually pulls toward the true result. This board is one such machine: collide the entries however you like, push the gates around, watch the odds scatter. Suave Richard's block will find its way back. It always does. The machine does not cheat; it remembers.",
  interaction:
    "Click any entry block to collide its odds pressure into the surrounding gates — but Suave Richard's weight slowly reasserts itself, pulling the board back toward the inevitable favourite no matter what you do.",
  medium: "SVG tote board with probabilistic correction and stamp-flash animation",
  inspiration:
    "Seed trace: source=random-encyclopedia; premise=Suave Richard is a Japanese Thoroughbred racehorse best known for winning the 2019 Japan Cup — what if the totalisator machine displaying race odds was also a hostile toy that corrected itself back to the true result no matter what odds-collisions the visitor applied?; temperament=wry; socialEnergy=oracle; humor=operatic; pressure=ritual; voice=workshop-gothic; wildMove=hostile-toy; interface=stamp-desk; motion=stamp; materialMutation=fermented-screen; scaleRupture=manual-with-missing-page; antiDefault=no-soft-archive.",
  thumbColor: "#cc2200",
};
