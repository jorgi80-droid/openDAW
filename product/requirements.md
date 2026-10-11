# NovaDAW Mobile requirements

## Screen behavior
- One active work area at a time: Timeline, Mixer, Piano Roll, Devices, or Browser.
- Persistent top transport: project name, tempo, time signature, rewind, play/pause, record, position, undo/redo.
- Persistent bottom dock; selected page uses blue/cyan; never render duplicate navigation bars.
- Timeline has a stable track-header column and horizontally pannable/zoomable clip area.
- Browser is a dedicated screen or controlled panel and must not cover the timeline unintentionally.
- Top transport and bottom dock must not overlap system bars, keyboard, track content, or each other.
- Respect Android safe areas/gesture insets.
- Touch targets should be approximately 44 dp or larger where practical; dense controls use contextual sheets.
- Distinguish selection from edit gestures; provide undo for destructive actions.
- No dead controls: make functional, disabled with a reason, or explicitly demo.

## MVP
- Transport state connected to engine.
- Create/select/rename/delete tracks.
- Add empty audio/MIDI clip; select, move, duplicate, resize with grid snapping.
- Tempo and meter setting.
- Save/open project JSON with schema version.
- Select track and add/remove supported devices.
- Piano-roll note add/move/resize and velocity.
- Mixer gain/pan/mute/solo.
- Touch and mouse test coverage.

## Later
- Live audio recording and input routing.
- Audio decoding, waveform rendering and trimming.
- MIDI import/export, DAWproject import/export.
- Plugin automation lanes.
- WAV/MP3 export using integrated, licensed encoders.
- Sample browser/indexer, presets and offline asset storage.

## Truthfulness
The concept image is a design target, not implementation status. Track each feature as Planned, UI prototype, Model wired, Engine wired, Browser tested, Android tested.
