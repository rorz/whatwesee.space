import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-11",
  slug: "the-address",
  title: "The Address",
  artist: {
    name: "Leila Benali",
    hometown: "Casablanca",
    era: "Active 2019–present",
    medium: "municipal address indices, digit-strip scrollwork, and off-register city directories",
    manifesto: "every coordinate is already filed; you only lack the page number",
  },
  visualBrief: {
    palette: "night",
    composition: "timeline",
    interaction: "type",
    renderMode: "text-grid",
    mood: "clinical",
    material: "screen",
  },
  personality: {
    temperament: "suspicious",
    socialEnergy: "oracle",
    humor: "absurd",
    pressure: "civic",
    voice: "municipal-romantic",
    signature:
      "She looks up your number in the infinite directory with a pen behind her ear and the patience of someone who has already checked every column twice and still suspects the registry is hiding a floor.",
  },
  explanation:
    "I catalogued mortgage indices for three years in a registry office where every document arrives wearing its own serial number before it earns a story. That habit stuck: before I trust any idea, I want to know its address. π is the longest directory I have ever opened — a non-repeating, non-terminating sequence where every finite string of digits is believed to appear eventually, somewhere in the decimal expansion. Here I built a counter into it, so you can type any short number from your own life and read back exactly which row it occupies.",
  interaction:
    "Type any digit sequence into the counter strip and the grid scrolls to the exact row in π where your numbers already live.",
  medium: "Canvas 2D text-grid with real-time digit search across 50 000 decimal digits of π",
  inspiration:
    "Seed trace: source=hacker-news-front-page=πFS; premise=What if the digits of π formed an infinite address directory and you could look up the exact position of any short sequence you typed, finding where your own numbers already live?; temperament=suspicious; socialEnergy=oracle; humor=absurd; pressure=civic; voice=municipal-romantic; wildMove=address-lookup; interface=directory-counter; motion=scroll; materialMutation=digit-as-document; scaleRupture=address-space-too-large-for-room; antiDefault=no-pretty-animation.",
  thumbColor: "#f5a623",
};
