# NovaDAW build status

## Current status
- [x] Dedicated branch created: `novadaw-from-zero` from the repository `main` HEAD.
- [x] Product, architecture, screen contract, Android packaging plan, quality gates, and asset/license notes added.
- [ ] App code/UI source added.
- [ ] OpenDAW engine/core package connected to independent UI.
- [ ] Vite build tested.
- [ ] Android wrapper and APK built.
- [ ] APK installed and audio-tested on device.

## Important distinction
The documentation-only bootstrap is not an app build and does not produce an APK. No feature is yet reported as implemented. The next change must add a separate UI entry point and testable screen components on this branch, then proceed to engine integration.

## Upstream/license notes
OpenDAW source README declares AGPL-3.0-or-later and points out a separate commercial license path. Review license implications before redistribution. Its build currently requires Node >=23 and a Rust nightly/WASM toolchain per repository docs; the Android wrapper currently in the base repository is associated with a different app identity and must not be silently repurposed.
