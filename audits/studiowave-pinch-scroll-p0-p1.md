# StudioWave P0/P1 Timeline: pinch and horizontal-scroll repair

Branch: `novadaw-from-zero`

## Verified base
The fixes were applied after reviewing the branch at `22ea306f524eec9a64b2547fde87ddeaa2dd66a1`. The submitted Android APK identifies the same commit in its filename; the actual UI source is `app-shell/index.html`.

## Root causes found
1. Timeline horizontal sync derived peers' logical scroll limits from `scrollWidth` and `getBoundingClientRect().width`. During pinch preview the canvases are transformed, so visual bounds can diverge from logical layout width. That makes the ruler and clip rows clamp to different offsets.
2. Pointer-end handling clears the pinch, but if another pointer remains down the gesture becomes `pinch-ended`. That surviving pointer intentionally cannot pan; without lifting all fingers, the surface can appear unresponsive until all pointers are released. This is a touch-state transition issue, not a CSS-only issue.
3. The timeline already uses a rasterized ruler and clip canvases, so preview scaling is appropriate; the final state must commit scale and scroll offsets using one logical pixels-per-bar model.

## Changes
- Horizontal peers now clamp against the shared logical `timelineContentWidth()`, not transformed visual bounds, keeping ruler and clip-lane scroll offsets in the same coordinate space.
- Pointer termination explicitly records the pinch-ended state, clears the preview, and schedules one final geometry/scroll synchronization after contacts end. Extra contacts cannot silently resume a stale pan anchor.
- Added this audit note to preserve the coordinate/gesture contract and the remaining QA checklist.

## QA still required
Run `StudioWave UI regression tests` on the updated commit and manually test the supplied Android APK on device:
- zoom around bar 1, middle bars, and far-right bars both before and after horizontal scrolling;
- pinch with two fingers, lift either finger first, then retry one-finger pan;
- compare ruler labels, major/minor grid lines and clip boundaries across every track at zoom 25%, 100%, 400%;
- drag clips horizontally and between compatible/incompatible tracks;
- confirm row scrolling and clip resize still work.
A passing static check or browser test does not establish zero lag or parity with FL Studio Mobile.
