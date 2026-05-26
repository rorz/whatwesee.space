import type { ComponentType } from "react";

/**
 * Type contract for a Daily Artwork in the GUEST WING.
 *
 * Each daily artwork is a self-contained folder under `app/daily/_artworks/`,
 * named `YYYY-MM-DD-kebab-slug/`, with three files:
 *
 *   - `profile.ts`  named export `profile: DailyArtworkProfile`
 *   - `artwork.tsx` "use client" default export — fills 100% of its parent (which is square)
 *   - `index.ts`    default export `DailyArtworkModule`
 *
 * The registry (`daily-registry.ts`) imports the folder's default export and
 * prepends it to `DAILY_ARTWORKS` so newest sits first.
 *
 * See `.github/instructions/daily-artwork.instructions.md` for the agent contract.
 */

export type DailyArtist = {
  /** Real-feeling first + last name. e.g. "Iris Holm" */
  name: string;
  /** City, no country. e.g. "Oslo" */
  hometown: string;
  /** Era. "Contemporary" or "1970s-1980s" or "Active 2014-present" */
  era: string;
  /** Concrete media — what they actually make. e.g. "pigment-on-handmade-paper, digital companion pieces" */
  medium: string;
  /** One-line aesthetic signature in the artist's voice. Lowercase, no period. */
  manifesto: string;
};

export type DailyVisualBrief = {
  /** Dominant color world. Must be intentionally different from recent guests. */
  palette:
    | "black-ground"
    | "white-ground"
    | "high-chroma"
    | "fluorescent"
    | "monochrome"
    | "primary"
    | "earth"
    | "pastel"
    | "institutional"
    | "metallic"
    | "night";
  /** The first read of the square before details. */
  composition:
    | "single-object"
    | "diagram"
    | "map"
    | "instrument"
    | "room-scene"
    | "typographic"
    | "game-board"
    | "pattern-system"
    | "timeline"
    | "split-screen"
    | "field";
  /** The user's primary verb. */
  interaction:
    | "press"
    | "drag"
    | "type"
    | "hold"
    | "erase"
    | "tune"
    | "collide"
    | "sort"
    | "trace"
    | "plant"
    | "shake";
  /** The dominant rendering system. */
  renderMode:
    | "canvas-2d"
    | "svg"
    | "css-dom"
    | "webgl"
    | "html-controls"
    | "text-grid"
    | "mixed-dom";
  /** The piece's visible emotional register. */
  mood:
    | "loud"
    | "clinical"
    | "comic"
    | "severe"
    | "tender"
    | "chaotic"
    | "ceremonial"
    | "deadpan"
    | "meditative"
    | "industrial";
  /** The dominant metaphorical material, not necessarily the implementation. */
  material:
    | "paper"
    | "textile"
    | "mineral"
    | "organism"
    | "machine"
    | "architecture"
    | "weather"
    | "screen"
    | "body"
    | "food"
    | "transit"
    | "document";
};

export type DailyPersonalityBrief = {
  /** The piece's social temperature. */
  temperament:
    | "brash"
    | "wry"
    | "tender"
    | "prissy"
    | "feral"
    | "ceremonial"
    | "suspicious"
    | "giddy"
    | "mournful"
    | "bossy"
    | "shy"
    | "grandiose";
  /** How the artwork seems to address the visitor. */
  socialEnergy:
    | "confessional"
    | "heckling"
    | "maternal"
    | "bureaucratic"
    | "flirtatious"
    | "schoolteacher"
    | "street-vendor"
    | "doctor"
    | "foreman"
    | "oracle"
    | "radio-host"
    | "conspirator";
  /** The comic pressure, even when the work is serious. */
  humor:
    | "dry"
    | "slapstick"
    | "morbid"
    | "camp"
    | "deadpan"
    | "petty"
    | "absurd"
    | "sardonic"
    | "earnest-no-joke"
    | "operatic"
    | "childlike"
    | "menacing";
  /** The kind of trouble the piece brings into the room. */
  pressure:
    | "itchy"
    | "overheated"
    | "solemn"
    | "panicked"
    | "domestic"
    | "litigious"
    | "hungry"
    | "medical"
    | "civic"
    | "ritual"
    | "sulking"
    | "triumphant";
  /** The English register of the plaque and visible copy. */
  voice:
    | "workshop-gothic"
    | "kitchen-table"
    | "municipal-romantic"
    | "stage-whisper"
    | "market-stall"
    | "diary-with-teeth"
    | "ship-log"
    | "school-notebook"
    | "emergency-manual"
    | "sermon"
    | "love-letter"
    | "lab-notes";
  /** One vivid sentence that makes the day's temperament inspectable. */
  signature: string;
};

export type DailyArtworkProfile = {
  /** ISO 8601 date this piece was made. YYYY-MM-DD. */
  date: string;
  /** kebab-case slug, NO date prefix. Used in the route as /daily/{date}-{slug}. */
  slug: string;
  /** Piece title. Title-case. Short. */
  title: string;
  artist: DailyArtist;
  /** Seeded visual diversity contract for archive-scale variety. */
  visualBrief: DailyVisualBrief;
  /** Seeded temperament contract. Entries must feel palpably different here. */
  personality: DailyPersonalityBrief;
  /** Artist's own 2-4 sentence reflection on THIS piece. First-person. */
  explanation: string;
  /** One-line description of the non-superfluous interaction. Required. */
  interaction: string;
  /** Concrete tech used. e.g. "Canvas 2D + DOM", "Pure CSS", "WebGL via three.js" */
  medium: string;
  /** Seed-of-the-day trace: source, premise, personality, weirdness, and anti-default values. */
  inspiration: string;
  /** CSS color used as the archive card background. Pick something representative. */
  thumbColor: string;
};

/**
 * Combined export shape from each artwork folder's `index.ts`.
 */
export type DailyArtworkModule = {
  profile: DailyArtworkProfile;
  Artwork: ComponentType;
};

/**
 * Compose the full route slug used in `/daily/{routeSlug}` URLs.
 * Combines the date prefix with the kebab slug.
 */
export function dailyRouteSlug(profile: DailyArtworkProfile): string {
  return `${profile.date}-${profile.slug}`;
}
