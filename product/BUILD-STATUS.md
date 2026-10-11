# NovaDAW build status

## Completed in branch `novadaw-from-zero`
- [x] Dedicated branch created from `main`, leaving `main` unchanged.
- [x] Requirements, architecture, screen contract, Android packaging plan, licensing notes, and quality gates documented.
- [x] Standalone `app-shell/index.html` created with a dark mobile-first UI inspired by the user concept: transport, Timeline, Mixer, Piano Roll, Devices, Browser, bottom workspace dock.
- [x] UI-only interactions: route navigation, demo tracks/clips, note-cell insertion, mixer control values, add track, browser tabs, project JSON import/export and local browser save/open.
- [x] CI static check workflow added for required screens and UI contracts.
- [x] Static metadata check confirmed all five screen IDs and primary controls exist; HTML file fetch from branch succeeds.

## Not completed / not to overstate
- [ ] OpenDAW Project/ProjectApi connected.
- [ ] OpenDAW audio engine, WASM, worklets, stock devices/plugins connected.
- [ ] Browser interaction/screenshot test run (only static contract checks completed).
- [x] GitHub Actions UI static check workflow completed successfully (run 38175947001).
- [x] Independent Android wrapper source scaffolded under `android-wrapper-novadaw/` with package id `com.novadaw.mobile`.
- [x] APK build script added at `scripts/build-novadaw-apk.sh`.
- [ ] APK installed and audio-tested on device.
- [x] Debug APK build succeeded in GitHub Actions run 38176245383; artifact `novadaw-mobile-debug-apk` (17 KB APK inside ZIP) downloaded and file type verified as Android package.
- [ ] Visual/device smoke test pending. This artifact is a UI prototype wrapper only; OpenDAW WASM engine/plugins/audio I/O are not integrated.

The current shell is an interactive UI prototype. Playback and record buttons are deliberately labelled as UI demo and do not yet produce/record sound. Timeline clips and samples are demo data. The wrapper APK built successfully, but it contains only the UI prototype, not the OpenDAW engine.

## Upstream notes
OpenDAW's README declares AGPL-3.0-or-later and describes an independent commercial license path. Its architecture docs describe a TypeScript workspace and Rust/WASM engine. The existing root Android wrapper uses a MidiAble/OpenDAW identity, so NovaDAW must have a separate application id and wrapper.
