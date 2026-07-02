import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-02",
  slug: "on-the-fence",
  title: "On the Fence",
  artist: {
    name: "Pam Holt",
    hometown: "Sheffield",
    era: "Active 1988–present",
    medium: "broadcast set photography, children's television prop studies, and analogue cue-card layouts",
    manifesto: "both sides claiming you is its own kind of answer",
  },
  visualBrief: {
    palette: "primary",
    composition: "split-screen",
    interaction: "press",
    renderMode: "canvas-2d",
    mood: "comic",
    material: "screen",
  },
  personality: {
    temperament: "giddy",
    socialEnergy: "street-vendor",
    humor: "childlike",
    pressure: "itchy",
    voice: "school-notebook",
    signature:
      "She quotes children's films with the same authority other people reserve for court depositions, and she is almost always right about what they meant.",
  },
  explanation:
    "I watched Terry on the Fence when I was nine, sat in my mum's front room while the cul-de-sac hummed outside. The problem with a fence is not that it's uncomfortable — it is — it's that both sides wanting you is a kind of attention most people don't get anywhere else. I built two territories with one rail between them and I still won't tell you which side wins until the numbers do.",
  interaction:
    "Press either side to add weight from that territory; the rail tips toward whichever side accumulates more, because collective pressure has arithmetic and arithmetic eventually runs out.",
  medium: "Canvas 2D split-screen with animated balance-beam fence, pressure counters, and fall physics",
  inspiration:
    "Seed trace: source=random-encyclopedia=Terry on the Fence is a 1985 British children's drama film directed by Frank Godwin and starring Jack McNicholl, Neville Watson, Tracey Ann-Morris, and Susan Jameson. It was produced by the Children's Film and Television Foundation.; premise=What if the fence in the title could be felt as a physical balance beam — each territory pressing its side, the rail tilting until the arithmetic gave out and Terry fell?; temperament=giddy; socialEnergy=street-vendor; humor=childlike; pressure=itchy; voice=school-notebook; wildMove=fence-as-balance-beam; interface=split-screen-pressure; motion=tilt; materialMutation=social-pressure-as-weight; scaleRupture=forty-years-in-one-frame; antiDefault=no-dark-ground-no-particle-field-no-shimmer.",
  thumbColor: "#d11c28",
};
