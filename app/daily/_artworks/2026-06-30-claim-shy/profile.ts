import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-30",
  slug: "claim-shy",
  title: "Claim Shy",
  artist: {
    name: "Elna Bosman",
    hometown: "Johannesburg",
    era: "Active 2004–present",
    medium: "mining-survey prints, claim-peg rubbings, and mineral specimen photography",
    manifesto: "the seam moves; you plant your peg where it was, not where it went",
  },
  visualBrief: {
    palette: "metallic",
    composition: "map",
    interaction: "plant",
    renderMode: "mixed-dom",
    mood: "chaotic",
    material: "mineral",
  },
  personality: {
    temperament: "brash",
    socialEnergy: "conspirator",
    humor: "absurd",
    pressure: "hungry",
    voice: "diary-with-teeth",
    signature:
      "She files her claims the morning after, when everyone else has already moved on, because she knows the seam doubles back by noon.",
  },
  explanation:
    "I have filed claims on the Witwatersrand reef for twenty years and every single time the seam runs under my peg and out the other side. A geologist calls it drag folding; I call it a grudge the rock has had since before I was born. Plant a stake anywhere here — the gold reads the iron and takes itself elsewhere, which is the most honest thing a reef has ever done.",
  interaction:
    "Plant a stake on any visible ore bloom; the bloom migrates away from every claimed cell, because the ore has always known the fastest route to unclaimed ground.",
  medium: "Canvas 2D geological strata + DOM claim markers, ore-vein particle simulation",
  inspiration:
    "Seed trace: source=random-encyclopedia=Revenge of the Virgins is a 1959 American Western nudie cutie film directed by Peter Perry Jr with a screenplay by Ed Wood.; premise=What if the gold on a prospector's claim chart had its own territorial instinct — drifting away from every stake hammered into the rock, treating every marked cell as exactly where it no longer wanted to be?; temperament=brash; socialEnergy=conspirator; humor=absurd; pressure=hungry; voice=diary-with-teeth; wildMove=territory-defends-itself; interface=claim-chart; motion=evasion-drift; materialMutation=gold-vein-as-grudge; scaleRupture=reef-scale-in-a-pocket; antiDefault=no-dark-ground-no-shimmer-no-instrument-panel.",
  thumbColor: "#8b7355",
};
