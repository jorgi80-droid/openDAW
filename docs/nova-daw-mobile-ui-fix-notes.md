# NovaDAW Mobile UI Fix — Review Notes

## Scope and provenance

The supplied `app-debug.apk` contains an embedded prototype at `assets/novadaw/index.html`. It is not the same application bundle as the repository's original openDAW studio distribution. The APK prototype is therefore kept separate from the native openDAW sources in this patch branch.

A patched standalone HTML was generated for review from that exact embedded prototype. No APK build is claimed by this change.

## Confirmed UI issues in the supplied prototype

- Multiple late CSS override blocks redefine the same toolbar and workspace rules. The active arrangement splits the transport and project controls into three stacked rows, unlike the expected design where transport, tempo/meter, and project controls occupy one compact header band.
- The timeline has a hard zoom clamp of 50%–400%.
- The timeline handles pinch zoom and Ctrl/Cmd+wheel, but clip scroll, ruler scroll, and zoom rerender behavior are spread across several handlers.
- Keyboard shortcuts are only partially implemented; existing Escape listeners are fragmented and common playback, zoom, snap, split, and delete shortcuts are missing.

## Review artifacts

- `novadaw-index-fixed.html` is the patched standalone HTML produced from the provided APK's embedded prototype.
- `novadaw-ui-fix.patch` is the unified diff for reviewing the changes.
- Inline JavaScript passes `node --check`.

## Intended behavior in the review artifact

- One compact toolbar at the top with branding/project controls, transport, tempo/meter/audio status and save/open/export actions aligned without overlap.
- Timeline occupies the remainder of the viewport, with track/clip area, compact timeline tool rail, and the workspace switcher dock kept outside the clip hit area.
- Timeline zoom range widened to 25%–1600%, anchor-preserving zoom, and less cumulative pinch drift.
- Keyboard shortcuts: Space playback, Home rewind, +/- zoom, V select, C split, G snap, Delete/Backspace delete selected clip, Ctrl/Cmd+Z undo and Ctrl/Cmd+Y redo. Shortcuts are ignored while typing in input/select/textarea/contenteditable controls.
- Existing touch clip move/resize/context actions remain in place.

## Reference

FL Studio Mobile Playlist manual:
https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_Playlist.htm

The manual documents touch-first channel and clip interactions, clip resize/stretch, snap, clip editor via double tap, and time-selection actions. The implementation should preserve these interaction patterns while retaining NovaDAW's own visual identity.

## Verification limitations

The local Chromium process could not be launched successfully in the sandbox, so screenshot-level behavior and real Android touch interaction were not verified here. Do not mark this UI as bug-free until it passes a device/browser visual review and the Android build workflow.
