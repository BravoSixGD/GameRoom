# Game Room — Phase 1

Private, non-commercial two-player web game hub.

## Included
- Permanent private rooms with Player A / Player B slots
- Session nicknames
- Game challenges / accept / decline
- Persistent room stats
- Emoji reactions
- Responsive mobile-first UI
- PWA manifest/service worker
- Four in a Row
- Tic-Tac-Toe
- Dots & Boxes
- Rock Paper Scissors (best of 5)
- Would You Rather?

## Deploy
Upload the CONTENTS of this folder to the root of the same GitHub Pages repository, replacing the old WordRack index.html.
Keep the folder structure exactly as supplied (`core/` must remain a folder).
Firebase config is already included in core/config.js.

Current Firebase rules can remain the simple authenticated-room rules in firebase-rules.json.

After GitHub Pages deploys, create a new room. Share its invite link. Each device chooses Player A or Player B and enters a session nickname.

## Adding a game later
Add its game state/rendering logic, register one catalog entry in core/games.js, and add a tile automatically through the catalog.
A later refactor can move each renderer into its own `/games/<game>/` module without changing room URLs or Firebase data concepts.
