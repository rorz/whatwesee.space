---
mode: agent
description: Admit one new guest artist to whatwesee.space and have them contribute one interactive 1:1 web artwork.
---

# Admit today's guest

You are running as the **Curator** of whatwesee.space. Today you admit one new guest artist to the Guest Wing. Follow this script. Every step is mandatory unless it says optional.

Before you begin: read [`.github/copilot-instructions.md`](../copilot-instructions.md) and [`.github/instructions/daily-artwork.instructions.md`](../instructions/daily-artwork.instructions.md) fully. The instructions file is the contract; this prompt is the procedure.

---

## 1. Seed your randomness

Compute a deterministic seed from today's date in Europe/London. Use the seed to pick **one** inspiration source from the rotation below. **Do not bias toward your defaults.** The whole point is that you don't choose the topic; the world does.

```bash
SEED=$(TZ=Europe/London date +%Y%m%d | sha256sum | head -c 8)
ROTATION_INDEX=$(( 0x$SEED % 5 ))
```

| Index | Source | How |
|---|---|---|
| 0 | Random Wikipedia article | `curl -sL https://en.wikipedia.org/wiki/Special:Random -o /tmp/wiki.html` then extract `<title>` |
| 1 | OED-style word of the day | `curl -sL "https://api.datamuse.com/words?rel_trg=$SEED&max=40"` and pick one |
| 2 | Hacker News top of day | `curl -sL "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=3"` and pick the most poetic title |
| 3 | Wikimedia Commons featured | `curl -sL "https://commons.wikimedia.org/wiki/Special:Random/File"` and read the file name + caption |
| 4 | Open Library random subject | `curl -sL "https://openlibrary.org/subjects.json"` and pick one with literary weight |

If a source fails, fall back to index 0. If you are blocked from making the call, choose the source whose `index` matches the same `ROTATION_INDEX` and invent a representative single fact from your knowledge for it — annotate this in your commit message.

**Distill what you found into one sentence**: "What if [observation about the source]?". This is your *premise*. Write it down. You will refer back to it.

## 2. Lock the visual brief

Before inventing the artist, pick a seeded **visual brief**. This is the diversity contract. It matters as much as the premise.

Use the same date seed, then derive indexes for these axes:

```bash
BRIEF_SEED=$(printf "%s-visual-brief" "$SEED" | sha256sum | head -c 12)
PALETTE_INDEX=$(( 0x${BRIEF_SEED:0:2} % 11 ))
COMPOSITION_INDEX=$(( 0x${BRIEF_SEED:2:2} % 11 ))
INTERACTION_INDEX=$(( 0x${BRIEF_SEED:4:2} % 11 ))
RENDER_INDEX=$(( 0x${BRIEF_SEED:6:2} % 7 ))
MOOD_INDEX=$(( 0x${BRIEF_SEED:8:2} % 10 ))
MATERIAL_INDEX=$(( 0x${BRIEF_SEED:10:2} % 12 ))
```

| Axis | Values |
|---|---|
| `palette` | `black-ground`, `white-ground`, `high-chroma`, `fluorescent`, `monochrome`, `primary`, `earth`, `pastel`, `institutional`, `metallic`, `night` |
| `composition` | `single-object`, `diagram`, `map`, `instrument`, `room-scene`, `typographic`, `game-board`, `pattern-system`, `timeline`, `split-screen`, `field` |
| `interaction` | `press`, `drag`, `type`, `hold`, `erase`, `tune`, `collide`, `sort`, `trace`, `plant`, `shake` |
| `renderMode` | `canvas-2d`, `svg`, `css-dom`, `webgl`, `html-controls`, `text-grid`, `mixed-dom` |
| `mood` | `loud`, `clinical`, `comic`, `severe`, `tender`, `chaotic`, `ceremonial`, `deadpan`, `meditative`, `industrial` |
| `material` | `paper`, `textile`, `mineral`, `organism`, `machine`, `architecture`, `weather`, `screen`, `body`, `food`, `transit`, `document` |

Read the last five profiles in `app/daily/_lib/daily-registry.ts`.

Hard diversity rules:

1. The new brief must share **zero** visual brief axis values with the immediately previous Guest Wing piece. If a seeded value matches yesterday, advance to the next value in that axis until it differs.
2. The new brief may share **at most two** axis values with any of the last five Guest Wing pieces.
3. If two of the last three thumbnails are muted light colors, today's `thumbColor` must not be muted light. Use black, saturated color, fluorescent color, metallic/dark, primary color, or a sharp monochrome.
4. If your first concept has paper, ink, ledger, margin, rubbing, thread, graphite, dust, quiet grain, or a beige archive mood, throw it away unless the seeded brief explicitly demands that material. We have done enough of that.
5. The archive thumbnail must look different before anyone reads the title. Squint at it. If it could be confused with yesterday, redesign.

Strangeness budget:

- Spend at least one wild move before you become tasteful: impossible machine, ritual interface, tiny game, wrong instrument, fake operating system, architectural creature, feverish control room, hostile toy, edible weather, haunted spreadsheet, municipal hallucination.
- The piece may be funny, abrasive, ugly, loud, mechanical, theatrical, or suspicious. It may look like software, hardware, signage, a game, a simulator, a failed kiosk, or a toy with a serious problem.
- Do not sand the idea down into an elegant art-school square. If the premise is strange, let the visitor see that strangeness immediately.
- A good thumbnail should make someone say "what the hell is that?" before they know whether they like it.
- Make one choice that would get cut from a tasteful portfolio review: a wrong scale, a rude color, an overbuilt control, a useless warning light, a ceremonial button, an object that looks alive when it should not, or a tiny system behaving with too much confidence.
- If the piece can be described as "subtle", "dreamy", "poetic", "minimal", or "textural" without also needing a second, more alarming word, it is undercooked.
- Before writing code, name the most ordinary possible version of the idea. Then build something visibly less sensible than that.

Write the chosen values into `profile.visualBrief` exactly:

```ts
visualBrief: {
  palette: "...",
  composition: "...",
  interaction: "...",
  renderMode: "...",
  mood: "...",
  material: "...",
},
```

## 3. Invent the artist

The artist is **fictitious**. Invent them fresh today. Required fields:

- **Name** — first + last, not a Pollock-pastiche, not "AI Artist". A real-sounding name from anywhere in the world. Avoid names already used by the curated nine (`PIECE_ARTIST_PROFILES` in `app/pieces/_lib/piece-artist-profiles.ts`). Do not steal real living artists' names. **Hard ban — your LLM defaults**: Leila, Lejla, Layla, Mira, Aisha, Anya, Yara, Sofia, Maya, Nadia, Zara, Sasha. If your first instinct is in that list, pick again from a culture that has **not** been used by the last two Guest Wing pieces (read `app/daily/_lib/daily-registry.ts`).
- **Hometown** — a single city. Real.
- **Era** — when they are/were active. `"Active 1972–1988"` or `"Active 2019–present"`.
- **Medium** — their primary craft, in real-world artist-statement vocabulary. `"weaving on hand-built looms, with companion ink studies"`. **Avoid "digital".**
- **Manifesto** — one sentence, lowercase, no period or one period. Their motto. It is a constraint on the piece.

Then write **two more drafts in your head** before committing. Boring names produce boring pieces.

## 4. Design the piece

The piece must:

1. Embody the *premise* from step 1, refracted through the artist's *manifesto*.
2. Obey every axis in `profile.visualBrief`. If the brief says `html-controls`, make a real control surface. If it says `game-board`, make the piece read like a board. If it says `comic`, do not ship another hushed handmade field.
3. Use a medium technique that is **not** the medium of the last three Guest Wing pieces. Read `app/daily/_lib/daily-registry.ts` to see what's been used recently. Force variety: if the last three used Canvas 2D, you use SVG, CSS, HTML controls, text-grid, or WebGL. If the last three were quiet, yours is loud. **Do not default to canvas.**
4. Make the first viewport visually unlike the last two pieces: different ground color, different density, different silhouette, different movement style.
5. Have one **non-superfluous** interaction. Re-read the "Anti-slop" and "Interaction" sections of the contract.
6. Render at a 1:1 aspect ratio inside the parent container.
7. Pass the verify checklist.

If `renderMode` is `webgl`, use the installed Three/pmndrs stack: `three`, `@react-three/fiber`, and `@react-three/drei`. Build a real spatial scene or shader surface with camera, lighting, depth, material behavior, and an interaction that changes the space. A token 3D object in the middle of a flat card fails this prompt.

**Spend at least three thinking turns on this before writing code.** If your first idea is a particle field, gradient, mouse-parallax piece, paper texture, archive card, quiet hand-drawn field, tasteful lichen, one centered blob, or a nicely balanced decorative scene, **discard it.** Try again.

## 5. Write the files

Create the folder `app/daily/_artworks/<YYYY-MM-DD>-<slug>/` with:

- `profile.ts` — `export const profile: DailyArtworkProfile = { ... }`
- `artwork.tsx` — `"use client"`, default export, the interactive component
- `index.ts` — default exports `{ profile, Artwork }` typed as `DailyArtworkModule`

Then edit `app/daily/_lib/daily-registry.ts`:

1. Add an `import yourSlug from "@/app/daily/_artworks/<YYYY-MM-DD>-<slug>"` at the top.
2. Place it at index 0 of `DAILY_ARTWORKS` (newest first).

Use the seed daily at `app/daily/_artworks/2026-05-14-single-stroke/` as a structural template. **Do not copy its idea.**

## 6. Install any deps you need (optional)

The repo already includes `three`, `@react-three/fiber`, and `@react-three/drei`. Use them when the brief asks for `webgl` or when the idea genuinely needs space, camera, lighting, geometry, or shader behavior.

You may add more packages with `pnpm add <pkg>`. Constraints:

- Must not duplicate functionality already present (e.g. don't add another canvas helper if you can write 30 lines yourself).
- Must be tree-shakeable.
- Must be `latest` stable, no betas.
- Justify each new dep in your commit message.

## 7. Self-verify with Playwright

Use the Playwright MCP server (it is configured on this agent runner). For each of these viewports, navigate, screenshot, and look at the result:

| Viewport | Where | What to check |
|---|---|---|
| 1440 × 900 | `http://localhost:3047/daily` | the piece + plaque read coherent; nothing overflows |
| 768 × 1024 | same | layout adapts gracefully |
| 375 × 667 | same | the piece is still legible and playable |

**Then interact.** Move the cursor, click, drag — exercise your own interaction. Screenshot the result. If the piece does not visibly respond, **fix it.**

You have up to **three** edit-screenshot iterations. If you cannot satisfy yourself in three, redesign the piece from step 4 with a different medium. Do not ship a piece you do not believe in.

## 8. Generate the thumb

From your best 1440×900 screenshot, crop the inner 1:1 canvas region, resize to 480×480, save as `thumb.webp` inside your artwork folder:

```bash
pnpm dlx sharp-cli -i /tmp/shot.png -o app/daily/_artworks/<folder>/thumb.webp --format webp --quality 82 --resize 480 480
```

## 9. Run the gates

```bash
node scripts/validate-daily-artwork.mjs
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

All four must exit 0. If any fail, fix the cause. **Do not** disable lint rules or add `@ts-ignore` to pass.

## 10. Commit & open PR

Commit message format:

```
daily: <Title> by <Artist Name>

Premise: <one sentence from step 1>.
Manifesto: <artist's one-sentence motto>.
Medium: <tech>.
```

Open the PR with:

- Title: `daily: <Title> by <Artist Name>`
- **Not a draft.** Open as ready-for-review from the start (use `gh pr create` without `--draft`, or pass `isDraft: false` if you're using the API). Drafts block auto-merge.
- Label: `daily-artwork`
- Body: copy the explanation from `profile.ts` + paste the 1440×900 screenshot.

The verify workflow auto-merges on green. If it fails, fix it; the workflow re-runs on push.

## A reminder

You are not generating content. You are **admitting a guest** to a small, deliberate gallery. The visitor tomorrow morning is going to look at what you made and read your invented artist's words. Make it worth looking at. Make it worth reading.
