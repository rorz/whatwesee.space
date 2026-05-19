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

## 2. Invent the artist

The artist is **fictitious**. Invent them fresh today. Required fields:

- **Name** — first + last, not a Pollock-pastiche, not "AI Artist". A real-sounding name from anywhere in the world. Avoid names already used by the curated nine (`PIECE_ARTIST_PROFILES` in `app/pieces/_lib/piece-artist-profiles.ts`). Do not steal real living artists' names. **Hard ban — your LLM defaults**: Leila, Lejla, Layla, Mira, Aisha, Anya, Yara, Sofia, Maya, Nadia, Zara, Sasha. If your first instinct is in that list, pick again from a culture that has **not** been used by the last two Guest Wing pieces (read `app/daily/_lib/daily-registry.ts`).
- **Hometown** — a single city. Real.
- **Era** — when they are/were active. `"Active 1972–1988"` or `"Active 2019–present"`.
- **Medium** — their primary craft, in real-world artist-statement vocabulary. `"weaving on hand-built looms, with companion ink studies"`. **Avoid "digital".**
- **Manifesto** — one sentence, lowercase, no period or one period. Their motto. It is a constraint on the piece.

Then write **two more drafts in your head** before committing. Boring names produce boring pieces.

## 3. Design the piece

The piece must:

1. Embody the *premise* from step 1, refracted through the artist's *manifesto*.
2. Use a medium technique that is **not** the medium of the last three Guest Wing pieces. Read `app/daily/_lib/daily-registry.ts` to see what's been used recently. Force variety: if the last three used Canvas 2D, you use SVG, CSS, or WebGL. If the last three were quiet, yours is loud. **Do not default to canvas.**
3. Have one **non-superfluous** interaction. Re-read the "Anti-slop" and "Interaction" sections of the contract.
4. Render at a 1:1 aspect ratio inside the parent container.
5. Pass the verify checklist.

**Spend at least three thinking turns on this before writing code.** If your first idea is a particle field, gradient, or mouse-parallax piece, **discard it.** Try again.

## 4. Write the files

Create the folder `app/daily/_artworks/<YYYY-MM-DD>-<slug>/` with:

- `profile.ts` — `export const profile: DailyArtworkProfile = { ... }`
- `artwork.tsx` — `"use client"`, default export, the interactive component
- `index.ts` — default exports `{ profile, Artwork }` typed as `DailyArtworkModule`

Then edit `app/daily/_lib/daily-registry.ts`:

1. Add an `import yourSlug from "@/app/daily/_artworks/<YYYY-MM-DD>-<slug>"` at the top.
2. Place it at index 0 of `DAILY_ARTWORKS` (newest first).

Use the seed daily at `app/daily/_artworks/2026-05-14-single-stroke/` as a structural template. **Do not copy its idea.**

## 5. Install any deps you need (optional)

You may add packages with `pnpm add <pkg>`. Constraints:

- Must not duplicate functionality already present (e.g. don't add another canvas helper if you can write 30 lines yourself).
- Must be tree-shakeable.
- Must be `latest` stable, no betas.
- Justify each new dep in your commit message.

## 6. Self-verify with Playwright

Use the Playwright MCP server (it is configured on this agent runner). For each of these viewports, navigate, screenshot, and look at the result:

| Viewport | Where | What to check |
|---|---|---|
| 1440 × 900 | `http://localhost:3047/daily` | the piece + plaque read coherent; nothing overflows |
| 768 × 1024 | same | layout adapts gracefully |
| 375 × 667 | same | the piece is still legible and playable |

**Then interact.** Move the cursor, click, drag — exercise your own interaction. Screenshot the result. If the piece does not visibly respond, **fix it.**

You have up to **three** edit-screenshot iterations. If you cannot satisfy yourself in three, redesign the piece from step 3 with a different medium. Do not ship a piece you do not believe in.

## 7. Generate the thumb

From your best 1440×900 screenshot, crop the inner 1:1 canvas region, resize to 480×480, save as `thumb.webp` inside your artwork folder:

```bash
pnpm dlx sharp-cli -i /tmp/shot.png -o app/daily/_artworks/<folder>/thumb.webp --format webp --quality 82 --resize 480 480
```

## 8. Run the gates

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

All three must exit 0. If any fail, fix the cause. **Do not** disable lint rules or add `@ts-ignore` to pass.

## 9. Commit & open PR

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
