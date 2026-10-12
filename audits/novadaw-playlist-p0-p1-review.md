# NovaDAW Playlist Layout P0/P1 Fix

Target branch: `novadaw-from-zero`. The provided APK packages the NovaDAW HTML prototype, not the native openDAW mobile shell.

## Root cause found
`app-shell/index.html` contains many late CSS override blocks. They repeatedly override the same Playlist ruler, track rows, bar viewport, clip area and clip geometry. Conflicting `min-width`, `grid-template-columns`, and overflow rules can separate ruler scrolling from clip-lane scrolling and squeeze the visible track labels on short landscape displays.

## Proposed repair
- Establish one documented geometry contract at the end of the stylesheet: fixed track-label rail + flexible scrollable time surface.
- Keep row heights compact and consistent; preserve sufficiently large clip resize hit targets for touch.
- Do not replace screen routing, project data, or unrelated panels.

## QA gate
- Run the NovaDAW UI prototype workflow.
- Check 16:9 and short landscape viewports; horizontal scroll/zoom; ruler-to-clip alignment; tap/context menu; double-tap edit; clip move and right-edge resize; range selection; duplicate/delete/insert-space/trim at timeline bounds; undo/redo; save/reopen.
- Static HTML validation is not proof that pointer interactions or audio playback work.
- Package APK from the exact validated commit and report SHA/workflow run.