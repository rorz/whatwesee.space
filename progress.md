Original prompt: i want enter exhibition button to be a next transition effect that is insane. it should segue into 1 of 10 pieces... the first piece i want you to ultrathink and produce a work of esteemed clarity called "token ceiling"... it should be a ream of technicolour token blocks being cannoned ibsanely against a y-min barrier

## 2026-02-17
- Added an exhibition transition from the lobby button with a high-energy orange tile burst and piece routing to `/pieces/[id]`.
- Added dynamic route `/pieces/[id]` with 10-piece indexing.
- Implemented Piece 1 (`Token Ceiling`) as a full-screen canvas simulation:
  - Multi-cannon token launch system from bottom.
  - Hard `y-min` ceiling barrier with impact bursts.
  - Technicolor rotating token blocks with glyph labels.
- Added placeholder scenes for pieces 2-10 and navigation back to lobby.
- Verified code quality checks: `pnpm lint` and `pnpm exec tsc --noEmit` both pass.

### TODO
- Add unique full experiences for pieces 2-10.
- Add audio-reactive layer to Token Ceiling (optional).
