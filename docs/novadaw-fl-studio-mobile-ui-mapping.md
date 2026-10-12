# NovaDAW Mobile UI — FL Studio Mobile Reference Mapping

This note records the official FL Studio Mobile behaviors used to guide the NovaDAW mobile UI. It is a workflow/interaction reference, not a claim that FL Studio code or assets are reused.

## Reference set

- Playlist / Timeline: https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_Playlist.htm
- Channel Rack: https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_Rack.htm
- Mixer: https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_Mixer.htm
- Editors: https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_Editors.htm
- Controllers: https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_Controllers.htm
- Home Panel: https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_HomePanel.htm
- Home Panel Settings: https://www.image-line.com/fl-studio-learning/fl-studio-mobile-online-manual/html/plugins/FL%20Studio%20Mobile_HomePanel_Settings.htm

## Behavior mapping

| Area | Reference behavior | NovaDAW UI/model coverage | Remaining boundary |
| --- | --- | --- | --- |
| Playlist / Timeline | Touch-first clip selection, clip context actions, move/resize, snap, split/copy/delete/mute, horizontal zoom and scrolling, selected clip opens the appropriate editor | Existing timeline supports clip selection/context actions, drag/resize, split/copy/delete/mute, snap and zoom; browser regression covers move/resize, split, copy/delete, double-tap editor, and label/clip scroll separation | Time-range operations such as insert/delete space, trim selection, combine, and audio time-stretch need dedicated model behaviors and tests before being marked complete |
| Channel Rack | Rack belongs to a selected playlist track; drum step sequencing; rack modules have an ordered signal path | A compact 16-step rack is embedded in the existing Devices workspace (not a duplicate dock tab); step arrays are per-track and retained when switching tracks | Current step toggles and device parameters are UI/model only; no sequencer-to-audio-engine connection. Full multi-module rack stack/routing and drag reordering remain follow-up UI/model work |
| Mixer | One channel per playlist track, ordered with tracks; gain fader, pan, mute/activate, solo | Mixer mirrors track order and exposes independent gain, pan, mute and solo controls; touch geometry is covered by browser tests | Controls currently update project model/UI only, not an audio signal path |
| Editors | Double-tap a clip opens its relevant editor; piano roll supports add, delete, move/resize notes, snap, selection, velocity/pan | Piano Roll supports tap-to-add, note move/resize, velocity lane, chromatic key labels and zoom; tests check note geometry and velocity alignment | Selection transforms, pan lane, scale locking, note repeat/slide, and full drum graph editing require additional implementation/tests |
| Controllers | Instrument tracks show keyboard; drum tracks show pads; external MIDI input and MIDI Learn | Track-aware compact keyboard/drum-pad surfaces and immediate touch feedback are present in the Devices editor | Keyboard/pad actions are explicitly UI-only. External USB/Bluetooth MIDI, MIDI Learn, real note-on/off, velocity response and recording are not connected |
| Home / Project / Files | Create/open/save projects, browse user files, import/export project and MIDI/audio formats where supported | Home menu includes new project, save/open, JSON import/export; project name, tempo and meter remain visible in the project bar | The prototype persists project JSON locally; it does not yet implement native audio rendering, a full media browser, FLM/FLP formats, or stems |
| Settings | UI theme/scaling plus audio, recording, latency, metronome and MIDI settings | UI scale, theme, density and timeline snap preference are adjustable and persisted | Audio/MIDI settings that require the native engine or OS device APIs must not be presented as operational until those integrations exist |

## Mobile layout acceptance rules

1. Keep the original OpenDAW workflow and model; do not create a second set of redundant workspace tabs.
2. The timeline is the primary work surface. Project metadata must not cover it.
3. Keep transport controls centered and reachable; do not hide them in a far corner.
4. Use one active workspace at a time. Devices, Mixer, Piano Roll, Timeline and Browser must not overlap or leave dead panels after route changes.
5. On compact landscape phones, use short headers, compact control spacing and side-by-side rack picker/editor. The editor must retain a usable height.
6. Touch controls need visible pressed/selected states and adequate hit targets; gestures must not accidentally open menus when the user is dragging.
7. Treat prototype/model interactions separately from real audio capability. Never claim sound, recording, external MIDI or effect routing works unless an engine/device integration and tests confirm it.

## Validation matrix

Browser layout and interaction regression is intended to cover 1280×720, 854×480 and 720×360 landscape viewports. A green static prototype check is not sufficient on its own: browser geometry and touch/gesture checks must also pass. APK packaging stays manual-only until the UI is explicitly approved.
