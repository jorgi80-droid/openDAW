# OpenDAW asset reuse notes for NovaDAW

NovaDAW's shell is intentionally separate from OpenDAW's existing UI, but its visual resources should reuse upstream assets instead of inventing similar-looking replacements.

Verified upstream paths:
- `packages/studio/icons/src/IconLibrary.tsx`: native OpenDAW SVG symbol definitions and `IconSymbol` mappings.
- `packages/studio/enums/src/IconSymbol.ts`: icon IDs/names (Play, Record, Undo, Redo, Timeline, Mixing, Piano, Browse, Effects, Automation, etc.).
- `packages/app/studio/public/favicon.svg`, `favicon-live.svg`, `grid16.svg`, `empty.svg`.
- `packages/app/studio/public/logo.png`.
- `packages/app/studio/public/fonts/rubik-300.woff2`, `rubik-400.woff2`, and `OpenSans-Regular.ttf`.

The current generated APK uses the shell's inline text glyphs and CSS waveform placeholders; it does not yet bundle upstream SVG symbol definitions/fonts/sample files. Next asset slice should package the small SVG/fon​t assets locally and add a compact subset/adapter for IconSymbol, then add real samples only after selecting licensing-safe fixtures and giving attribution. Do not fetch giant model assets just to decorate the UI.

Landscape work completed:
- Android activity requests sensor landscape.
- Manifest has `screenOrientation="landscape"`.
- Web shell uses a landscape-first compact layout, with workspace switching preserved.
- Portrait CSS shows an orientation hint rather than clipping the DAW into portrait.

Current build remains a UI prototype, not an integrated OpenDAW engine or production-ready DAW.
