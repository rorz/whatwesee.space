import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-22",
  slug: "slow-colony",
  title: "Slow Colony",
  artist: {
    name: "Kwame Asante",
    hometown: "Kumasi",
    era: "Active 1978–present",
    medium: "arcade cabinets, funeral cloth geometry, ultraviolet resin, and hacked planetarium projectors",
    manifesto: "the oldest thread is always the one that holds the edge",
  },
  visualBrief: {
    palette: "fluorescent",
    composition: "room-scene",
    interaction: "plant",
    renderMode: "webgl",
    mood: "chaotic",
    material: "organism",
  },
  explanation:
    "I wanted the colony to stop behaving like a polite stain and start behaving like it had found electricity. The oldest growth is no longer a tidy ring at the edge; it is a glowing body that drags its own scaffolding through the dark. Plant another one and the room gets less like a specimen tray and more like a small, badly supervised planetarium.",
  interaction:
    "Click the 3D floor to plant another neon colony, because the work treats growth as an invasive spatial event rather than a passive surface mark.",
  medium: "Three.js via React Three Fiber + Drei",
  inspiration:
    "Seeded source index 3 (Wikimedia Commons featured file) was network-blocked; representative fact: Wikimedia Commons Featured Pictures frequently document crustose lichen colonies on rock surfaces, where circular growth rings record decades of patient expansion.",
  thumbColor: "#ff2bd6",
};
