import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-07",
  slug: "the-billing-conflict",
  title: "The Billing Conflict",
  artist: {
    name: "Adão Seixas",
    hometown: "Lisbon",
    era: "Active 2009–present",
    medium: "comparative vocal studies, frequency portrait drawings, phonograph-record reproductions",
    manifesto: "a voice that fits six rooms at once is the room's problem, not the voice's",
  },
  visualBrief: {
    palette: "earth",
    composition: "split-screen",
    interaction: "drag",
    renderMode: "svg",
    mood: "comic",
    material: "body",
  },
  personality: {
    temperament: "grandiose",
    socialEnergy: "radio-host",
    humor: "operatic",
    pressure: "triumphant",
    voice: "municipal-romantic",
    signature:
      "He translates venue announcements into every register the venue was not designed for, and considers the distance between them a personal contribution to urban acoustics.",
  },
  explanation:
    "Yanky Lemmer sings liturgy at Carnegie Hall and opera in the synagogue and considers neither arrangement an error. I wanted to know where the seam is — the exact point where the reverent becomes theatrical and the theatrical starts sounding like prayer. Drag it yourself; the billing conflict is real and the waveforms will not shake hands.",
  interaction:
    "Drag the centre divider left or right to adjust how much of the canvas each tradition occupies; at the midpoint they meet and neither bends.",
  medium: "SVG split-screen with RAF-animated waveform paths and direct DOM manipulation",
  inspiration:
    'Seed trace: source=random-encyclopedia=Yaakov ("Yanky") Lemmer is an American Chazzan and performing artist. Lemmer performs traditional Hebrew liturgy, Yiddish folk, opera, Broadway, Israeli, and Hasidic music.; premise=What if the seam between a chazzan\'s liturgical voice and his operatic voice could be shown as a draggable border — two waveforms with completely different harmonic characters refusing to share the canvas at equal width?; temperament=grandiose; socialEnergy=radio-host; humor=operatic; pressure=triumphant; voice=municipal-romantic; wildMove=venue-billing-as-territorial-dispute; interface=split-screen-divider; motion=resist-at-midpoint; materialMutation=voice-as-frequency-portrait; scaleRupture=carnegie-hall-and-synagogue-in-one-square; antiDefault=no-dark-ground-no-shimmer-no-particle-field.',
  thumbColor: "#c87830",
};
