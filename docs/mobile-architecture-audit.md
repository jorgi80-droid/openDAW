# OpenDAW Mobile Architecture Audit
Date: 2026-10-11
Repository: jorgi80-droid/openDAW
Audited ref: mobile-touch-native-gestures (compare with open draft PR #1 for current workspace changes)
Decision: preserve studio-core and Rust/WASM audio engine; replace mobile presentation in stages behind a stable UI-facing adapter. Do not rewrite DSP/engine or delete desktop UI before functional parity.

## Evidence inspected
- packages/studio/core/src/EngineFacade.ts
- packages/app/studio/src/service/StudioService.ts
- packages/app/studio/src/ui/workspace/Workspace.ts
- packages/app/studio/src/ui/workspace/PanelContents.tsx
- packages/app/studio/src/ui/workspace/TouchLayout.ts

## Findings
1. EngineFacade is a credible seam. It implements Engine and exposes observable transport state (position, BPM, playing/recording/count-in, playback timestamp, CPU load), transport commands (play/stop/setPosition/recording), worklet lifecycle, and access to the live Project. Its methods delegate to EngineWorklet; avoid changing this contract during UI work.
2. StudioService is the principal coupling hotspot. Its imports combine core concerns (EngineFacade, Project, Recovery, ProjectStorage, audio services) with view/navigation concerns (Snapping, PanelContents, PanelFactory, Workspace, BrowseScope, dialogs, UI panel/service state, Shadertoy/code editor, Surface). It constructs panelLayout from PanelContents(createPanelFactory(this)). This is a bootstrap/service locator rather than a clean domain-only service.
3. Workspace supports both content and optional touchContent. TouchLayout.ts centralizes the mobile decision and accommodates WebView viewport/pointer misreporting via the midiable-mobile class. This is a useful transitional mechanism, not yet a fully independent mobile UI.
4. PanelContents owns a Map<PanelType, PanelContent>, computes closed state from minimized/popout state, and can restore/focus panels. A replacement must preserve lifecycle semantics or replace them with one mobile panel-state controller; duplicate state sources risk stacking and race issues.
5. UI should use the same Project/Engine model. Keep one project graph and adapter/model mutation path; do not create a separate mobile-only clip/MIDI/mixer data model.

## Proposed seam
Mobile shell / Timeline, MIDI editor, Mixer, Devices & Browser
  -> new StudioUiPort (proposed, not existing)
  -> Project/adapter API + EngineFacade observables/commands + recovery/storage services
  -> EngineWorklet -> Rust/WASM -> AudioWorklet/Web Audio output
Suggested port capabilities: project/track/region/note queries and mutations through existing adapters; transport state/commands; mixer/device parameter operations; async open/save/recovery; lifecycle and error reporting. Map domain objects into view models; do not expose DOM/workspace types to this port.

## Risk rating (qualitative, not measured benchmark)
- UI rework only, stable EngineFacade/project graph: LOW–MEDIUM engine regression risk.
- StudioService extraction: MEDIUM–HIGH integration risk due to extensive orchestration/lifecycle responsibilities.
- Timeline gestures/editing: HIGH due to coordinate transforms, snapping, selection vs scroll, zoom and drag/drop.
- Mixer/device graph and parameter edits: HIGH due to routing/order/state synchronization and plugin lifecycle.
- project persistence/recovery and imported sample paths: MEDIUM–HIGH; test real save/reopen/offline assets.
- Android/WebView runtime (AudioWorklet/WASM/workers/storage/autoplay unlock): HIGH until verified on the target APK/device; successful CI packaging is not device QA.
- one-shot full UI replacement: VERY HIGH; implement incremental vertical slices instead.

## Implementation gates
G0: record known-good baseline: WASM/studio build, Android package, playback, MIDI, audio clip, effects, save/reopen.
G1: add StudioUiPort with no functional UI change; compile and test parity.
G2: refactor StudioService to separate engine/project lifecycle from UI construction; retain old UI and compare behavior.
G3: mobile-first shell with Timeline + transport + one actual clip mutation; verify playback and project graph.
G4: add MIDI editor; then Mixer/Devices/FX; then Browser/project flows.
G5: target-device Android/WebView tests for rapid panel switching, gesture conflict, audio continuity, sleep/resume, offline reopen, sample persistence, and memory/performance.
Keep PR #1 draft and do not merge based only on green CI. PR #1 notes Android/WebView manual QA is still required.

## Acceptance criteria
- Same project graph and audio engine used by desktop and mobile.
- No duplicated engine, clip, MIDI, or mixer model.
- UI state cannot trigger multiple panel instances or hide a still-live audio lifecycle.
- Open/save/recovery works offline after force-close/relaunch.
- Timeline, MIDI, mixer, and devices operate on real project state, not mock state.
- Build and APK CI green, plus target-device manual tests green.

## License
Preserve AGPL-3.0-or-later notices and comply with the project license for distributed derivatives.


## Mobile shell implementation status (2026-10-11)
- The five-destination mobile dock routes through `MobileStudioPort`.
- Mobile Timeline, Browser, Mixer, Editor/Piano Roll, and Devices/FX use focused full-screen workspaces while reusing the existing OpenDAW panel content.
- The latest UI branch is validated by the workflow attached to its current head before promotion; Android/WebView device tests remain mandatory.
