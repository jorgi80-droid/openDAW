# NovaDAW quality gates

Status values: Planned / UI prototype / Model wired / Engine wired / Browser tested / Android tested.

## First vertical slice acceptance
- [ ] Shell renders at portrait phone and landscape tablet/phone sizes.
- [ ] Only one Timeline/Mixer/Piano Roll/Devices/Browser view is active.
- [ ] Header and dock do not overlap workspace or Android insets.
- [ ] Timeline horizontally scrolls/zooms without changing track-header width.
- [ ] Clip select/drag/resize gestures do not conflict with pan/scroll.
- [ ] Play/stop updates actual engine state, not merely button appearance.
- [ ] Save -> reload -> restore clips/tempo/tracks correctly.
- [ ] Navigation preserves project state.
- [ ] No console/module errors or missing asset 404s.
- [ ] Dependency/build versions are pinned and reproducible.
- [ ] Code and asset license notices are documented.
- [ ] Debug APK installs and launches on Android; audio smoke test passes.

## Evidence per milestone
Record commit/PR, exact commands and exit codes, test report, screenshot/device log and remaining blockers. Never say APK is ready without a produced APK path and install/launch evidence.
