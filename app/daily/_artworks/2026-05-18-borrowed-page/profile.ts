import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-18",
  slug: "borrowed-page",
  title: "Borrowed Page",
  artist: {
    name: "Mina Vukovic",
    hometown: "Belgrade",
    era: "Active 2016-present",
    medium: "paper burnishing, erased ledger studies, and graphite transfers",
    manifesto: "every correction is a second voice",
  },
  explanation:
    "I copied a sentence until the page felt heavy, then lifted it back with a dull blade to hear what stayed behind. The first writing never leaves completely; it keeps surfacing through whatever I place over it. I wanted this square to behave the same way, where the clean layer is only temporary and the older hand waits underneath.",
  interaction:
    "Drag to abrade the top inscription, because the piece only becomes itself when your hand physically uncovers the earlier voice beneath it.",
  medium: "SVG + DOM cellular mask",
  inspiration:
    "Datamuse was unavailable at runtime for the seeded source, so I used a representative OED-style word fact: a palimpsest is a reused page where earlier writing remains traceable.",
  thumbColor: "#d7c7a8",
};
