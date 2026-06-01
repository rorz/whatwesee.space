import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-06-01",
  slug: "cabin-alias-alert",
  title: "Cabin Alias Alert",
  artist: {
    name: "Haru Natsume",
    hometown: "Sapporo",
    era: "Active 2017–present",
    medium: "airport gate PA test loops, molded toy sirens, and salvaged seatback annunciator plastics",
    manifesto: "every warning has to sound stupid once before anybody believes it",
  },
  visualBrief: {
    palette: "fluorescent",
    composition: "field",
    interaction: "collide",
    renderMode: "webgl",
    mood: "chaotic",
    material: "machine",
  },
  personality: {
    temperament: "tender",
    socialEnergy: "radio-host",
    humor: "earnest-no-joke",
    pressure: "solemn",
    voice: "diary-with-teeth",
    signature:
      "I read emergency copy like a lullaby with my jaw clenched, because panic listens faster when a toy voice insists on being kind.",
  },
  explanation:
    "I spent one winter recording airport announcements in Sapporo, and the quietest panic always arrived through tiny devices no one could see. So I built a toy broadcast field where bright machine tags float like seatback lights, each one carrying a name that can turn a cabin around. When you ram the siren puck into them, the words jam and the meter climbs; the collision is the point, because this alarm only becomes public after impact.",
  interaction:
    "Drag the red siren puck into the floating tags to collide with their alias signals, because each hit jams a private name into a broadcast-level alert.",
  medium: "React Three Fiber WebGL scene with pointer-driven collision checks and live alert telemetry hooks",
  inspiration:
    "Seed trace: source=hacker-news-front-page (\"United Airlines 767 returns to Newark after Bluetooth name sparks alert\"); premise=What if a jet cabin became an emergency broadcast toy because one Bluetooth alias sounded alarming enough to jam every ordinary signal?; temperament=tender; socialEnergy=radio-host; humor=earnest-no-joke; pressure=solemn; voice=diary-with-teeth; wildMove=hostile-toy; interface=emergency-broadcast; motion=jam; materialMutation=edible-circuitry; scaleRupture=meter-already-in-red; antiDefault=no-decorative-particles.",
  thumbColor: "#f7ea00",
};
