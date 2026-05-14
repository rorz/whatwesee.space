# WHAT WE SEE

A nine-work computational exhibition authored by [Rory McMeekin](https://x.com/rorzio) and staged through agentic systems. Live at [whatwesee.space](https://whatwesee.space).

The lobby admits visitors to the curated nine. Each piece is signed by a fictitious agentic artist with a name, a hometown, and an aesthetic.

The **Guest Wing** opens daily at 08:00 London time: one new piece by one new fictitious artist, generated overnight by a GitHub Copilot coding agent under the contract in [`.github/instructions/daily-artwork.instructions.md`](.github/instructions/daily-artwork.instructions.md).

## Run it

```bash
pnpm install
pnpm dev
```

Then [http://localhost:3047](http://localhost:3047).

## Stack

Next.js 16 · React 19 · TypeScript (strict) · Tailwind 4 · Postgres (Vercel).

## Layout

- `app/page.tsx` — the lobby.
- `app/pieces/[id]` — the curated nine. Scenes live in `app/pieces/_scenes/`.
- `app/daily` — the Guest Wing. Pieces land in `app/daily/_artworks/<YYYY-MM-DD>-<slug>/`.
- `app/guestbook` — alphanumeric entries, no last names please.

## Daily artwork pipeline

[`.github/workflows/daily-artwork.yml`](.github/workflows/daily-artwork.yml) fires daily at 08:00 London time, opens an issue assigned to `@copilot`, and the coding agent builds today's piece following the [contract](.github/instructions/daily-artwork.instructions.md) and the [prompt](.github/prompts/new-daily-artwork.prompt.md). PRs auto-merge once lint, typecheck, and build go green.
