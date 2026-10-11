# NovaDAW Mobile — independent app plan

This branch is the starting point for a new mobile-first DAW product. It does NOT replace the existing OpenDAW studio UI or reuse its current screen shell as the product UI.

## Product intent
- Name: NovaDAW Mobile (working name)
- Primary target: Android phones/tablets, touch-first.
- Visual target: user-provided concept image: dark charcoal surfaces, cyan/blue selected controls, colorful audio/MIDI clips, compact transport header, bottom floating navigation.
- Main workspace screens: Timeline, Mixer, Piano Roll, Devices, Browser.
- Architecture: new app shell and interaction model; reuse OpenDAW engine/core/plugin code only through its packages/interfaces where practical. Do not copy built binaries or claim a native engine until integrated and tested.

## Source and license guardrails
The upstream OpenDAW repository declares AGPL-3.0-or-later and describes a separate commercial licensing route. Any distribution or network use of integrated/modified OpenDAW code must be reviewed against the selected license before release. Preserve notices and source availability obligations if using AGPL. Exclude separately licensed or commercial-excluded components unless licensing is confirmed.

## Proposed implementation layout
- `product/requirements.md`: scope, interactions, feature matrix.
- `product/architecture.md`: new UI shell vs OpenDAW studio-core/engine/WASM dependencies.
- `product/quality-gates.md`: feature/test acceptance before APK claims.
- `app-shell/README.md`: route/screen contract and touch layout.
- `android/README.md`: packaging strategy.
- `assets/README.md`: reference image and attribution notes.

## MVP
1. Independent app shell with persistent transport/header and mutually exclusive workspace route.
2. Timeline viewport: track headers and colored audio/MIDI clips; actions must be wired to project model when supported.
3. Bottom floating dock for Timeline / Mixer / Piano Roll / Devices / Browser.
4. Project model: tempo, meter, tracks, clips and selected track; serialize/deserialize versioned JSON.
5. Connect shell to OpenDAW Project/ProjectApi and Engine only after checking real signatures and passing smoke tests.
6. Clearly label mock data as demo until connected to actual project state.

## Next steps
Inspect upstream package contracts; create a separate Vite app shell and later an independent Android wrapper. Keep changes incremental, with tests and honest status reporting.

## References
- Upstream project: https://github.com/andremichelle/openDAW
- Source map: `introduction.md`
- Visual reference: NovaDAW Mobile concept image in the conversation.
