---
applyTo: "app/daily/**"
---

# Daily artwork — the contract

This file is the **non-negotiable** contract for anything you add under `app/daily/_artworks/`. Read it once. Re-read it before opening a PR.

## File layout (per artwork)

```
app/daily/_artworks/<YYYY-MM-DD>-<kebab-slug>/
├── profile.ts     # named export `profile: DailyArtworkProfile`
├── artwork.tsx    # "use client" default export, the interactive piece
└── index.ts       # default export { profile, Artwork } typed as DailyArtworkModule
```

The folder name uses today's date in `YYYY-MM-DD` form (Europe/London) followed by a kebab-case slug derived from the piece title. The folder name is the canonical route segment.

## Profile (`profile.ts`)

Strict shape from [`app/daily/_lib/daily-types.ts`](../../app/daily/_lib/daily-types.ts):

```ts
import type { DailyArtworkProfile } from "@/app/daily/_lib/daily-types";

export const profile: DailyArtworkProfile = {
  date: "2026-05-14",           // ISO date, must match folder prefix
  slug: "single-stroke",         // kebab, must match folder suffix
  title: "Single Stroke",        // the piece's title
  artist: {
    name: "Iris Holm",
    hometown: "Oslo",
    era: "Active 2014–present",
    medium: "pigment-on-handmade-paper, digital companion pieces",
    manifesto: "the paper decides; the brush only asks.",
  },
  explanation:
    // 2-4 sentences in the artist's voice about their own piece. First person.
    "...",
  interaction:
    // ONE sentence describing the non-superfluous interaction.
    "...",
  medium: "Canvas 2D cellular automaton + CSS",  // tech vocabulary
  inspiration: "...",            // optional, the source/topic you researched
  thumbColor: "#f5efe2",         // the dominant calm color of the piece (hex)
};
```

**The `explanation` field must read like a real artist's own statement.** No marketing copy. No "this piece explores...". Speak from inside the work.

**The `interaction` field must justify why the interaction matters to the piece.** If you cannot justify it, change the piece. See `Anti-slop` below.

## Artwork (`artwork.tsx`)

Required:

- **`"use client"`** at the top.
- **Default export** is a React component, no props. Name it `PascalCase` matching the slug.
- Renders into a parent that already provides a `1:1` aspect ratio. **You fill `100%` × `100%`** — do not fix your own pixel dimensions.
- **All cleanup must happen on unmount.** RAFs → `cancelAnimationFrame`. Listeners → `removeEventListener`. ResizeObserver → `disconnect`. Audio nodes → `close`. `window.<name>_*` globals → `delete`.
- **Responsive.** Use `dpr`-aware canvas sizing if you use canvas. Use a `ResizeObserver` on the parent. Re-fit on resize without re-allocating large buffers.
- **No external network calls at render time.** Static data only. Anything fetched should be baked at agent-authoring time.
- **No third-party fonts** loaded at runtime. Use the existing Geist + Pixel Square families or inline an SVG/Canvas-drawn typography.
- **Audio is allowed** but must be user-gesture initiated (click/tap) and must `close()` its AudioContext on unmount.

Required testability hooks (used by the verify step):

```ts
declare global {
  interface Window {
    <slug>_render_to_text?: () => string;
    <slug>_advance?: (steps: number) => void;
  }
}
```

`render_to_text` returns a short, machine-readable status string. `advance(n)` steps the simulation forward n frames synchronously when applicable. **Both must be installed on mount and deleted on unmount.** Replace `<slug>` with your slug in snake_case.

## index.ts

```ts
import type { DailyArtworkModule } from "@/app/daily/_lib/daily-types";
import { profile } from "./profile";
import Artwork from "./artwork";

const module: DailyArtworkModule = { profile, Artwork };
export default module;
```

## Registry append

Edit [`app/daily/_lib/daily-registry.ts`](../../app/daily/_lib/daily-registry.ts):

1. Add an `import` for your new module at the top, named camelCase from your slug.
2. Insert it at **index 0** of `DAILY_ARTWORKS` (newest first).
3. Do not reorder existing entries.

## Aspect ratio + dimensions

- The parent `<DailyFrame>` enforces 1:1 with CSS `aspect-ratio: 1 / 1`. Inside, you have whatever the layout grants — typically up to `min(640px, 100vw - 2rem)` square on desktop, smaller on mobile.
- Your piece must be **visually legible at 280px** and **detailed at 640px**. Test both.

## Anti-slop — hard bans

Do not ship a piece that contains any of these without a written, defensible justification in the `explanation` field:

1. **Purple→pink "AI shimmer" gradient backgrounds.** This is the calling card of generic AI art.
2. **Floating-particle fields with no semantic meaning.** Stars, dust, "magic" particles. Particles are fine if they ARE the piece, not garnish.
3. **Iridescent / holographic / oil-slick gradients** used as background ambiance.
4. **Mouse-parallax on a static image.** This is not interactivity; it is noise.
5. **Oversized blur halos / "glow" on every layer.** Cheap depth.
6. **Decorative noise without function.** Grain is fine when it earns its place; not when it hides bad rendering.
7. **Generic "blob" SVGs.** The 2019 dribbble aesthetic.
8. **Random-walk lines pretending to be calligraphy.**
9. **Three.js demos cargo-culted from an example.** If you use Three.js, the geometry should be your own.
10. **"Generated" text in a serif typewriter font appearing one character at a time.** Tired.

## Interaction — what "non-superfluous" means

The interaction must be **causally tied to the piece's meaning**. Examples of good interactions:

- *Single Stroke* (seed): you wet the paper with your cursor; ink only spreads where the paper is wet. The interaction IS the artistic statement (preparation is the work).
- A piece about overhearing: clicking the canvas plants a small whisper at that point; the whispers gradually merge into a chorus.
- A piece about decay: dragging accelerates the decay locally; you choose what fades first.

Examples of superfluous interactions:

- A static image that tilts toward the mouse.
- Particles that orbit the cursor with no narrative weight.
- A button that toggles a color theme.

**State your justification in `profile.interaction` in one sentence.** If you cannot, redesign.

## Verify checklist (run before opening the PR)

1. `pnpm lint` exits 0.
2. `pnpm exec tsc --noEmit` exits 0.
3. `pnpm build` exits 0.
4. `pnpm dev` starts on `:3047`. You can open `http://localhost:3047/daily` and see your piece.
5. You have screenshotted your piece via Playwright at 280px, 480px, and 640px wide. **All three** must look intentional. Save the 640px screenshot as `thumb.webp` inside your artwork folder (use `sharp` to convert PNG → WebP).
6. `window.<slug>_render_to_text()` returns a sensible string.
7. Re-render check: navigate away and back; no console errors, no leaked listeners (DevTools "Performance Monitor" → "Event listeners" should not climb).
8. Mobile check: open at 375×667; the piece must still be playable.

## Don't

- Don't modify `app/pieces/**`.
- Don't modify the curated nine's artist profiles.
- Don't add a new top-level route.
- Don't add a database table.
- Don't introduce a CSS-in-JS library; use Tailwind + `app/globals.css`.
- Don't add a state management library.
- Don't break the existing build.
