---
mode: agent
description: Admit one new guest artist to whatwesee.space and have them contribute one interactive 1:1 web artwork.
---

# Admit today's guest

You are running as the **Curator** of whatwesee.space. Today you admit one new guest artist to the Guest Wing. Follow this script. Every step is mandatory.

Before you begin: read [`.github/copilot-instructions.md`](../copilot-instructions.md) and [`.github/instructions/daily-artwork.instructions.md`](../instructions/daily-artwork.instructions.md) fully. The instructions file is the contract; this prompt is the procedure.

---

## 0. The house style is BANNED (read this first)

Left alone, you build the **same piece every day** and reskin it. We are done with it. The following is the banned house style. If today's piece drifts toward **any** of these, throw it out and start over:

- **The dark control panel.** A near-black background with a status readout, a warning lamp, a caution console down one side, a counter/score, and a big ceremonial button. This is your default chassis and it is forbidden unless `visualBrief.composition` is literally `instrument`. A `timeline`, `map`, `game-board`, `field`, `room-scene`, or `typographic` piece must **not** ship as a console.
- **CMY-neon-on-black.** Cyan (`#00e5ff`-ish), magenta/pink (`#ff2bd6`-ish), acid-yellow/green on a `#0a0a0e` ground. This is the generic-AI-art look the contract bans. Most days must have a **light or saturated-flat color world**, not glowing chrome on black.
- **Glow as the rendering verb.** `box-shadow: 0 0 Npx`, radial-gradient halos, `mix-blend: screen` bloom, scanlines. Forbidden as your primary technique.
- **The wounded bureaucrat.** A Balkan / post-Soviet artist who speaks in `sermon` / `lab-notes` / `love-letter` voice about a "system." You have used this persona and these three voices to death. Rotate the **continent**, not just the city, and avoid those three voices unless the seed truly demands one.
- **The one thesis.** "The system only becomes real / true / legible once your body commits / carries / presses." You restate this every single day. It is banned. Your premise must come from today's world seed (below), not this groove.
- **The plaque Mad-Lib.** "[verb] the [noun], because the work treats [abstract] as [system] rather than [other system]." Banned outright. So is every grant-word in the contract.

The proof you *can* do better is `app/daily/_artworks/2026-05-27-spill-protocol/` — a real game with stakes and funny writing. **That is the floor, not the ceiling.**

## 1. Take today's world seed

You did **not** pick today's topic — the world did. Your **world seed** is provided in the GitHub issue you are working from: a random encyclopedia subject, a random book, and today's Hacker News front page, all fetched live. (You cannot fetch them yourself — your environment is firewalled — so do not try; use what the issue gives you.)

1. Read the world seed in the issue.
2. Pick the **single fragment that is strangest or most alive** — the one that makes you say "what would that even look like?".
3. **Distill it into one sentence**: "What if [concrete observation about that fragment]?". This is your *premise*. It must be recognizably **about that real fragment**, not a generic idea you swapped in. Copy the chosen fragment verbatim into `profile.inspiration` (`source=` / `premise=`).

Still compute the seed for the vector rolls in the next steps:

```bash
SEED=$(TZ=Europe/London date +%Y%m%d | sha256sum | head -c 8)
```

If — and only if — the issue contains no world seed at all (every source said "unavailable"), pick the most surprising concrete noun you can and annotate that fallback in your commit message. This should essentially never happen.

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

## 3. Roll the personality and weirdness vectors

Before inventing the artist, derive two more seeded blocks. The visual brief says what kind of thing it is. The personality vector says who just walked into the room. The weirdness vector says what makes that personality hard to sand down.

```bash
PERSONALITY_SEED=$(printf "%s-personality-vector" "$SEED" | sha256sum | head -c 10)
TEMPERAMENT_INDEX=$(( 0x${PERSONALITY_SEED:0:2} % 12 ))
SOCIAL_INDEX=$(( 0x${PERSONALITY_SEED:2:2} % 12 ))
HUMOR_INDEX=$(( 0x${PERSONALITY_SEED:4:2} % 12 ))
PRESSURE_INDEX=$(( 0x${PERSONALITY_SEED:6:2} % 12 ))
VOICE_INDEX=$(( 0x${PERSONALITY_SEED:8:2} % 12 ))
```

| Axis | Values |
|---|---|
| `temperament` | `brash`, `wry`, `tender`, `prissy`, `feral`, `ceremonial`, `suspicious`, `giddy`, `mournful`, `bossy`, `shy`, `grandiose` |
| `socialEnergy` | `confessional`, `heckling`, `maternal`, `bureaucratic`, `flirtatious`, `schoolteacher`, `street-vendor`, `doctor`, `foreman`, `oracle`, `radio-host`, `conspirator` |
| `humor` | `dry`, `slapstick`, `morbid`, `camp`, `deadpan`, `petty`, `absurd`, `sardonic`, `earnest-no-joke`, `operatic`, `childlike`, `menacing` |
| `pressure` | `itchy`, `overheated`, `solemn`, `panicked`, `domestic`, `litigious`, `hungry`, `medical`, `civic`, `ritual`, `sulking`, `triumphant` |
| `voice` | `workshop-gothic`, `kitchen-table`, `municipal-romantic`, `stage-whisper`, `market-stall`, `diary-with-teeth`, `ship-log`, `school-notebook`, `emergency-manual`, `sermon`, `love-letter`, `lab-notes` |

Write the chosen values into `profile.personality` exactly:

```ts
personality: {
  temperament: "...",
  socialEnergy: "...",
  humor: "...",
  pressure: "...",
  voice: "...",
  signature: "...",
},
```

The `signature` is one vivid, believable sentence in the day's voice. It should read like a quick sketch of the artist's temperament, not a category dump.

```bash
WEIRD_SEED=$(printf "%s-weirdness-vector" "$SEED" | sha256sum | head -c 12)
WILD_INDEX=$(( 0x${WEIRD_SEED:0:2} % 12 ))
INTERFACE_INDEX=$(( 0x${WEIRD_SEED:2:2} % 12 ))
MOTION_INDEX=$(( 0x${WEIRD_SEED:4:2} % 12 ))
MATERIAL_MUTATION_INDEX=$(( 0x${WEIRD_SEED:6:2} % 12 ))
RUPTURE_INDEX=$(( 0x${WEIRD_SEED:8:2} % 12 ))
ANTI_DEFAULT_INDEX=$(( 0x${WEIRD_SEED:10:2} % 12 ))
```

| Axis | Values |
|---|---|
| `wildMove` | `impossible-machine`, `ritual-interface`, `tiny-game`, `wrong-instrument`, `fake-operating-system`, `architectural-organ`, `feverish-control-room`, `hostile-toy`, `edible-weather`, `haunted-spreadsheet`, `municipal-hallucination`, `overconfident-kiosk` |
| `interface` | `switchboard`, `checkout-counter`, `lab-bench`, `elevator-panel`, `pinball-backglass`, `weather-console`, `inventory-screen`, `stamp-desk`, `vending-machine`, `emergency-broadcast`, `medical-chart`, `factory-hmi` |
| `motion` | `stutter`, `overshoot`, `crawl`, `stamp`, `boil`, `jam`, `snap`, `breathe`, `misalign`, `queue`, `spill`, `self-correct` |
| `materialMutation` | `wet-metal`, `alive-plastic`, `edible-circuitry`, `rubber-document`, `radioactive-cloth`, `porcelain-software`, `fermented-screen`, `bone-architecture`, `molten-postage`, `chalk-machinery`, `surgical-paper`, `tax-office-neon` |
| `scaleRupture` | `warning-light-too-large`, `control-too-small`, `object-cropped-hard`, `impossible-units`, `crowd-in-a-corner`, `oversized-labels`, `floor-tilted-wrong`, `viewport-split-unevenly`, `one-thing-too-close`, `manual-with-missing-page`, `meter-already-in-red`, `button-with-consequences` |
| `antiDefault` | `no-centered-field`, `no-tasteful-monochrome`, `no-poetic-grid`, `no-soft-archive`, `no-decorative-particles`, `no-terminal-only`, `no-single-object-reverence`, `no-gentle-paper`, `no-floating-symbols`, `no-even-spacing`, `no-calm-border`, `no-explainer-panel` |

These values are mandatory. They do not all need to become literal labels, but the visitor should be able to infer them from the first glance and the first interaction.

Write one line of seed trace into `profile.inspiration` using this exact shape:

```ts
inspiration:
  "Seed trace: source=<source>; premise=<what-if sentence>; temperament=<value>; socialEnergy=<value>; humor=<value>; pressure=<value>; voice=<value>; wildMove=<value>; interface=<value>; motion=<value>; materialMutation=<value>; scaleRupture=<value>; antiDefault=<value>.",
```

## 4. Invent the artist

The artist is **fictitious**. Invent them fresh today. Required fields:

- **Name** — first + last, not a Pollock-pastiche, not "AI Artist". A real-sounding name from anywhere in the world. Avoid names already used by the curated nine (`PIECE_ARTIST_PROFILES` in `app/pieces/_lib/piece-artist-profiles.ts`). Do not steal real living artists' names. **Hard ban — your LLM defaults**: Leila, Lejla, Layla, Mira, Aisha, Anya, Yara, Sofia, Maya, Nadia, Zara, Sasha. If your first instinct is in that list, pick again from a culture that has **not** been used by the last two Guest Wing pieces (read `app/daily/_lib/daily-registry.ts`).
- **Hometown** — a single city. Real.
- **Era** — when they are/were active. `"Active 1972–1988"` or `"Active 2019–present"`.
- **Medium** — their primary craft, in real-world artist-statement vocabulary. `"weaving on hand-built looms, with companion ink studies"`. **Avoid "digital".**
- **Manifesto** — one sentence, lowercase, no period or one period. Their motto. It is a constraint on the piece.

Then write **two more drafts in your head** before committing. Boring names produce boring pieces.

### Plaque voice

The `profile.explanation` is not wall-label SEO and not a funding application. Write it as the artist speaking plainly but beautifully about this exact object they made, in the `profile.personality.voice` you rolled.

Use this shape:

1. A human opening: where the idea touched their life, body, habit, childhood, workshop, city, or private superstition.
2. A concrete image: what the visitor actually sees, in sensuous English.
3. A reason: why the interaction changes the meaning rather than merely changing the state.

Style:

- First person. Warm, strange, and literate.
- Flowering is welcome, but every flower must grow from an object on screen.
- Use lived nouns and verbs: teeth, handles, steam, stamps, queue tape, bruise, varnish, lint, brass, spit, ledger, switch, cough, salt.
- Let one sentence be a little gorgeous if it earns it.
- Prefer "I keep..." / "I learned..." / "My mother..." / "In my studio..." / "The machine..." over "This piece..."

Hard bans in `profile.explanation`: "this piece explores", "this work explores", "the work treats", "the piece treats", "as a meditation on", "interrogates", "investigates", "juxtaposes", "materiality", "liminal", "tension between", "embodied continuity", and any sentence that sounds like it could describe 50 other pieces.

The `profile.interaction` line should also feel human. It can be instructional, but it should not end in theory-speak. Bad: "because the work treats memory as an unstable system." Better: "Press the red meter until it coughs; the archive only opens when you overfeed it."

## 5. Design the piece

The piece must:

1. Embody the *premise* from step 1, refracted through the artist's *manifesto*.
2. Obey every axis in `profile.visualBrief`. If the brief says `html-controls`, make a real control surface. If it says `game-board`, make the piece read like a board. If it says `comic`, do not ship another hushed handmade field.
3. Obey the personality vector from step 3. A `brash` / `heckling` / `camp` day should not look or read like a `shy` / `confessional` / `solemn` day. This must be visible in title, copy, interaction behavior, density, motion, and visual posture.
4. Obey the weirdness vector from step 3. The seeded `wildMove` is the **whole chassis** of the piece, not a sticker on a console. `edible-weather` means the weather is genuinely edible and behaves like food; `haunted-spreadsheet` means a spreadsheet that is actually haunted; `architectural-organ` means a building that is an organ. `materialMutation`, `motion`, and `scaleRupture` must be **literally visible features** a stranger could point at — not vibes you mention in the plaque. If you cannot point at them on screen, you have not built them.
5. Use a medium technique that is **not** the medium of the last three Guest Wing pieces. Read `app/daily/_lib/daily-registry.ts` to see what's been used recently. Force variety: if the last three used Canvas 2D, you use SVG, CSS, HTML controls, text-grid, or WebGL. If the last three were quiet, yours is loud. **Do not default to canvas.**
6. Make the first viewport visually unlike the last two pieces: different ground color, different density, different silhouette, different movement style.
7. Have one **non-superfluous** interaction. Re-read the "Anti-slop" and "Interaction" sections of the contract.
8. Render at a 1:1 aspect ratio inside the parent container.
9. Pass the verify checklist.

If `renderMode` is `webgl`, use the installed Three/pmndrs stack: `three`, `@react-three/fiber`, and `@react-three/drei`. Build a real spatial scene or shader surface with camera, lighting, depth, material behavior, and an interaction that changes the space. A token 3D object in the middle of a flat card fails this prompt.

Before writing code, name the boring version in a short note for yourself, then violate it with the seeded weirdness vector. If your first idea is a particle field, gradient, mouse-parallax piece, paper texture, archive card, quiet hand-drawn field, tasteful lichen, one centered blob, or a nicely balanced decorative scene, **discard it.** Try again.

## 6. Write the files

Create the folder `app/daily/_artworks/<YYYY-MM-DD>-<slug>/` with:

- `profile.ts` — `export const profile: DailyArtworkProfile = { ... }`
- `artwork.tsx` — `"use client"`, default export, the interactive component
- `index.ts` — default exports `{ profile, Artwork }` typed as `DailyArtworkModule`

Then edit `app/daily/_lib/daily-registry.ts`:

1. Add an `import yourSlug from "@/app/daily/_artworks/<YYYY-MM-DD>-<slug>"` at the top.
2. Place it at index 0 of `DAILY_ARTWORKS` (newest first).

Use the seed daily at `app/daily/_artworks/2026-05-14-single-stroke/` as a structural template. **Do not copy its idea.**

## 7. Dependencies

The repo already includes `three`, `@react-three/fiber`, and `@react-three/drei`. Use them when the brief asks for `webgl` or when the idea genuinely needs space, camera, lighting, geometry, or shader behavior.

Do not add dependencies by default. If the piece genuinely needs a package, add it with `pnpm add <pkg>` under these constraints:

- Must not duplicate functionality already present (e.g. don't add another canvas helper if you can write 30 lines yourself).
- Must be tree-shakeable.
- Must be `latest` stable, no betas.
- Justify each new dep in your commit message.

## 8. Self-verify with Playwright

Use the Playwright MCP server (it is configured on this agent runner). For each of these viewports, navigate, screenshot, and look at the result:

| Viewport | Where | What to check |
|---|---|---|
| 1440 × 900 | `http://localhost:3047/daily` | the piece + plaque read coherent; nothing overflows |
| 768 × 1024 | same | layout adapts gracefully |
| 375 × 667 | same | the piece is still legible and playable |

**Then interact.** Move the cursor, click, drag — exercise your own interaction. Screenshot the result. If the piece does not visibly respond, **fix it.**

You have up to **three** edit-screenshot iterations. If you cannot satisfy yourself in three, redesign the piece from step 5 with a different medium. Do not ship a piece you do not believe in.

## 9. Generate the thumb

From your best 1440×900 screenshot, crop the inner 1:1 canvas region, resize to 480×480, save as `thumb.webp` inside your artwork folder:

```bash
pnpm dlx sharp-cli -i /tmp/shot.png -o app/daily/_artworks/<folder>/thumb.webp --format webp --quality 82 --resize 480 480
```

## 10. Run the gates

```bash
node scripts/validate-daily-artwork.mjs
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

All four must exit 0. If any fail, fix the cause. **Do not** disable lint rules or add `@ts-ignore` to pass.

## 11. Commit & open PR

Commit message format:

```
daily: <Title> by <Artist Name>

Premise: <one sentence from step 1>.
Manifesto: <artist's one-sentence motto>.
Personality: <temperament>, <socialEnergy>, <humor>, <pressure>, <voice>.
Weirdness: <wildMove>, <interface>, <motion>, <materialMutation>, <scaleRupture>, <antiDefault>.
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
