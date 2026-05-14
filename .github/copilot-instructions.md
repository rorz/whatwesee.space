# whatwesee.space — repo-wide Copilot instructions

This repo is the codebase for **whatwesee.space**, a small computational art exhibition by Rory McMeekin. The site has two surfaces:

1. **The main exhibition** — `app/pieces/` — a curated, fixed set of nine pieces by fictitious "agentic artists". **You may read this code for reference. Do not modify it.** It is a finished work.
2. **The Guest Wing** — `app/daily/` — a permanent archive of single-day guest artworks. **You contribute here.** Each day a new "guest artist" assumes a persona and contributes one piece.

If you are working on a Guest Wing artwork, also load [`.github/instructions/daily-artwork.instructions.md`](./instructions/daily-artwork.instructions.md). It is the hard contract.

## Stack

- **Next.js 16.1.6** App Router, React 19.2.3
- **TypeScript** strict mode (`tsconfig.json`)
- **Tailwind 4** via `@tailwindcss/postcss`, plus custom utility classes prefixed `wws-` in `app/globals.css`
- **pnpm** package manager
- **Postgres** (`pg`) for the guestbook only — not for artworks
- Fonts: Geist Sans, Geist Mono, Geist Pixel Square (a custom pixel font, exposed as `font-pixel-square` Tailwind utility)

## Commands

- `pnpm dev` — dev server on **port 3047**
- `pnpm lint` — eslint
- `pnpm exec tsc --noEmit` — typecheck (there is no `typecheck` script; use this exact command)
- `pnpm build` — production build

Every change must pass `pnpm lint` and `pnpm exec tsc --noEmit`.

## Layout cheat-sheet

| Path | What it is |
|------|------------|
| `app/page.tsx` | the lobby (home). Animated grid, `WHAT WE SEE` lettermark, `enter exhibition` CTA. Do not restructure. |
| `app/pieces/` | the curated nine. Off-limits. |
| `app/pieces/_lib/` | constants + helpers for the nine (`PIECE_COUNT`, `PIECE_TITLES`, artist profiles). Read-only for you. |
| `app/daily/` | the Guest Wing. **Your domain.** |
| `app/daily/_lib/daily-types.ts` | the type contract. |
| `app/daily/_lib/daily-registry.ts` | the manifest. Newest first. |
| `app/daily/_artworks/YYYY-MM-DD-slug/` | one folder per artwork. |
| `app/daily/_components/` | shared frame, archive, and marquee components. |
| `app/globals.css` | global styles. Add new `wws-` classes here when you need them. |
| `public/profiles/` | profile images. The nine are `piece-1.jpg`..`piece-9.jpg`. Daily artists currently get a CSS-rendered placeholder unless you contribute artwork that warrants an image. |

## Code conventions

- **No comments** unless the code is genuinely non-obvious (complex algorithms, mathematical formulas, security/perf-sensitive, public-API docstrings).
- **TypeScript strict.** No `as any`, no `@ts-ignore`, no `@ts-expect-error` unless paired with a written justification.
- **Composition over imperative.** Reducers over side-effect chains. Pure helpers in `_lib/`.
- **Cleanup on unmount.** Every `requestAnimationFrame`, `ResizeObserver`, listener, timer, or `window` global you set up MUST be torn down in the effect cleanup.
- **File naming**: kebab-case for component files and folders. `daily-frame.tsx`, not `DailyFrame.tsx`.
- **Component naming**: PascalCase exports inside the kebab-case file.
- **Path alias** `@/*` resolves to repo root. Prefer `@/app/daily/_lib/...` over relative imports across feature boundaries.
- **Wireframe / interaction**: existing pieces expose `window.<piece>_render_to_text()` and similar testability hooks. The Guest Wing follows the same convention — see the contract.

## Tone

This site speaks in lowercase, pixel-arcade, brutalist UI vocabulary. The Guest Wing speaks in a deliberately gentler postmark/postcard vocabulary. The two should feel like adjacent rooms in the same gallery — connected but distinct. Don't make the Guest Wing look like the curated nine. Don't make the curated nine look like the Guest Wing.

## When in doubt

Read the seed daily at [`app/daily/_artworks/2026-05-14-single-stroke/`](../app/daily/_artworks/2026-05-14-single-stroke/) for a worked example. It is the reference implementation.
