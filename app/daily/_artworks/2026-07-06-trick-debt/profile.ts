import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-07-06",
  slug: "trick-debt",
  title: "Trick Debt",
  artist: {
    name: "Tove Lindqvist",
    hometown: "Malmö",
    era: "Active 2003–present",
    medium: "playing-card woodblock prints, trick-table etchings, wagering-register studies",
    manifesto: "one trick is enough, and knowing that has never made it easier to win one",
  },
  visualBrief: {
    palette: "high-chroma",
    composition: "game-board",
    interaction: "collide",
    renderMode: "canvas-2d",
    mood: "deadpan",
    material: "machine",
  },
  personality: {
    temperament: "wry",
    socialEnergy: "heckling",
    humor: "sardonic",
    pressure: "overheated",
    voice: "municipal-romantic",
    signature:
      "She annotates the house cards in blue biro before anyone sits down, not because it helps, but because she has found that a pen in the hand is the only cure for pretending not to care.",
  },
  explanation:
    "My grandfather taught me Knack on a Sunday in Malmö and then immediately won two öre off me, which he kept in an envelope and labeled with my name. The cruelty of the game is not losing all three tricks — it is losing the first two and realizing you still have one card and one slot and the house has been waiting since the deal. I built this board to show that confrontation. You see everything from the start. The only secret is which battle you pick.",
  interaction:
    "Select a card from your hand, then click a trick slot to throw it against the house card — because in Knack the decision of when to spend your strongest card is the whole game.",
  medium: "Canvas 2D card-table simulation with collision flash and hand-tracking",
  inspiration:
    "Seed trace: source=random-encyclopedia=Knack is a Swedish card game, mainly played for money, in which the aim is to win at least one of the three tricks. It is also known as Trekort or Trikort, although that usually refers to a more basic game of Danish origin that is probably its progenitor.; premise=What if the three-trick confrontation of Knack could be laid bare on a single board — house cards face-up from the deal, the player forced to choose which fight to pick, the penalty of zero tricks rendered as KNOCKED rather than lost?; temperament=wry; socialEnergy=heckling; humor=sardonic; pressure=overheated; voice=municipal-romantic; wildMove=the-knock-as-final-word; interface=card-table; motion=collision-throw; materialMutation=trick-as-machine-cycle; scaleRupture=one-card-left-one-slot-left; antiDefault=no-dark-ground-no-shimmer-no-floating-particles.",
  thumbColor: "#1a7a2e",
};
