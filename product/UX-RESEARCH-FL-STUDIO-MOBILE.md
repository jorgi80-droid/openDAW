# NovaDAW Mobile UX research and redesign brief

Date: 2026-10-12

## Product decision
Do not build another APK until the landscape UI has passed the screen/interaction QA matrix and has been visually reviewed. Work only on `novadaw-from-zero`; do not alter the existing OpenDAW UI entry point or main branch.

## Source-based reference findings
Official FL Studio Mobile product page describes built-in sounds, composing directly in Piano Roll with pitch/length/velocity control, effects, advanced mixer, audio recording and pitch correction, and an instrument/effects library. Official FL Studio Mobile Editor manual describes Playlist tracks for Note, Audio and Automation material; touch interaction uses short tap and tap-and-hold; long-tapping a track icon opens a context menu; clip selection opens relevant editor; Piano Roll allows tap-empty-grid to add notes and long-tap notes for note controls. Official FL Studio Mobile Mixer manual describes one mixer strip per Playlist track with touch faders, stereo pan, mute/activate and solo. These are workflow references, not license permission to copy proprietary visuals/assets.

Sources:
- https://www.image-line.com/fl-studio-mobile
- https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual
- https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_Editors.htm
- https://www.image-line.com/fl-studio-learning-content/fl-studio-online-manual/html/plugins/FL%20Studio%20Mobile_Playlist.htm
- https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/plugins/FL%20Studio%20Mobile_Mixer.htm

## Current observed UI regressions
The screenshots attached on 2026-10-12 show:
- Browser content panel is blank for Instrument/Effect/Preset tabs because `renderSamples` filters sample labels against the selected category names and produces an empty list. Category filters remain selected from Samples, making the blank screen look like a routing issue.
- Timeline has stable clip rendering but previous build had only a small part of tracks visible because height distribution and viewport sizing were inconsistent.
- Piano Roll has velocity bars and note blocks outside the note grid. These are separate grid children with incorrect CSS grid placement because note elements are appended alongside velocity container rather than notes being absolutely positioned in their own grid layer.
- Mixer controls overlap: channel layout compresses its pan range input into the same row/column as the meter; need a clearly separated compact channel layout.
- The Instruments/Devices screen uses invented static “knobs” and devices; not engine-backed. Keep visible “Prototype” status labels to avoid implying working audio engine.
- Screen routing must remain exclusive. Hidden screens must be `display:none!important` no matter if active-screen CSS specifies flex/grid/block.
- Immersive Android fullscreen must be verified in screenshots; never confuse successful APK compilation with UI acceptance.

## Layout target (reference image supplied by user)
- Single dark DAW shell, landscape. Persistent compact top transport; project controls/tempo/meter in a single compact secondary toolbar.
- Central workspace occupies most remaining height. Exactly one active view.
- Bottom dock with five reachable targets: Timeline, Mixer, Piano Roll, Devices, Browser.
- Timeline: stable track header column, ruler, horizontal timeline scroll; vertical track list scroll; clip content within each row, compact and visible. Add Track stays below track list but inside the view, never pushes rows offscreen.
- Mixer: each channel strip is an independent clear column: name, meter, gain value/fader, pan and M/S. No slider overlap, horizontal scroll if screen too narrow.
- Piano Roll: piano keys at left, note grid as one independent plane, velocity editor as a separate bottom lane. Notes belong inside note grid only.
- Devices: instrument/effect/preset subtabs and actual list of available demo device cards; explicitly demo until engine adapter is wired.
- Browser: categories on left and list on right with independent scrolling; Samples, Instruments, Effects, Presets each render their own data source. Empty state includes a helpful message and import action rather than a blank panel.
- safe system UI: app may use immersive sticky mode, but check layout with gesture bar visible/hidden. Don't rely on one screenshot only.

## Interaction contract inspired by FL Studio Mobile
- Short tap selects a clip/track; selected state visible.
- Double tap (or explicit Edit button) opens the correct editor for clip type.
- Long press opens context menu for copy/delete/snap/rename; destructive operations have undo.
- Touch scroll should pan the timeline and not accidentally drag the clip. Distinguish move/resize from scroll.
- Piano Roll taps in empty grid create note; tap existing note selects it; long press opens note actions; velocity bars remain anchored to velocity lane.
- Mixer gain/pan controls stay within each channel strip; Mute/Solo actions update project model.
- Browser sample preview should be disabled with “audio asset unavailable” until real audio exists; add-to-track should use actual selected category/item metadata, not sample names as playable assets.
- Navigation preserves selected project, current clip and editor state.
- Every control must be functional, explicitly disabled, or labelled demo.

## Mandatory pre-build validation
1. Static code checks and JS syntax check.
2. DOM/logic tests for switching screens and Browser categories with non-empty results.
3. Layout checks for 1920x1080, 1280x720, 854x480 landscape viewports; workspace/dock do not overlap and timeline has >=3 visible rows at 720p-equivalent.
4. Test no note element is outside piano note grid and note click calculations use bounding rect (not mixed offsets).
5. Screenshot review of each of the five screens at at least two aspect ratios.
6. Only after all gates pass, package APK; attach both screenshots and APK. Build green alone does not mean UX accepted.

