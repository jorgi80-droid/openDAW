# NovaDAW Mobile architecture

## Principle
Build a new product shell while treating OpenDAW as the engine/domain codebase, not the UI to ship unchanged.

## Upstream architecture (from repository docs)
OpenDAW is a TypeScript workspace plus Rust/Cargo workspace.
- `packages/lib`: reusable DOM/runtime/DSP/box/MIDI libraries.
- `packages/studio/core`: Project, ProjectApi, storage/recovery, recording, import/export, mixer/effect factories and engine abstraction.
- `packages/studio/core-processors` and `core-workers`: AudioWorklet processors and workers.
- `packages/studio/core-wasm` and `crates`: Rust/WASM audio engine and stock devices/plugins.
- `packages/app/studio`: current web DAW UI; NovaDAW will use a separately built shell and route model.

The upstream documentation says generated box classes, adapter exports, and WASM bundles must be built before full type-check/app build.

## Proposed new shell
- Persistent header/transport.
- One active workspace route.
- Floating bottom dock.
- Timeline split into stable track labels and scrollable clip grid.
- Dedicated Mixer, Piano Roll, Devices, Browser screens.
- Central app state for route, project, selected track/clip and transport.
- Keep demo data separate from an engine adapter; mock clips must never be reported as real saved/playable engine clips.

## Integration boundary
A future adapter owns project create/open/save, engine lifecycle/play-stop, track/clip mutations, device catalog/parameters and export/import. Inspect actual TypeScript signatures before wiring. Do not invent imports/API names. Start with a documented demo implementation only if necessary; replace it once integration smoke tests pass.

## Android
Do not silently reuse an existing Android app identity. Build an independent wrapper and package id after browser shell and engine bootstrap are stable. All worker/WASM/plugin assets must resolve locally. APK requires Android SDK/Gradle build plus physical-device validation.
