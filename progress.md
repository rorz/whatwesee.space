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
- Updated lobby flow to use sequential piece order (1 -> 2 -> ... -> 10 -> 1) persisted in session storage.
- Replaced delayed timer navigation with immediate Next route push wrapped in View Transition API when available.
- Added `app/pieces/[id]/loading.tsx` to provide true App Router loading transition continuity.
- Fixed homepage hydration mismatch by normalizing dynamic background inline style values to deterministic string precision and canonical RGB format across SSR/CSR.
- Implemented Piece 2 (`Latent Bloom`) with interactive node activation, branching bloom structures, and collapsing geometric memory traces.
- Added clear piece navigation controls next to `back to lobby` (prev/next + direct 1..10 links) across piece views.
- Simplified lobby sequence behavior: removed session-persisted next-piece memory so page reload always restarts sequencing from Piece 1.

### TODO
- Add unique full experiences for pieces 2-10.
- Add audio-reactive layer to Token Ceiling (optional).
