# Melvox Feature Integration Audit

Source supplied by the user: `Melvox.zip`. The source archive includes the full Vite + TypeScript project and its `src/styles.css`, but no project-level LICENSE file was included. The bundled piano samples include a separate CC BY 3.0 notice. Until the Melvox project license is confirmed, this integration should not wholesale copy its implementation or images/branding. This branch documents the feature surface and implements only original/compatible UI wiring and styling; source code is to be migrated feature-by-feature with license compatibility checked first.

Feature modules identified:
- Audio import/decode, waveform rendering, audio clip edit operations, time-stretching and BPM detection.
- Pattern/note editor with draw/select/erase/pan, note slide, snapping, velocity, octave keyboard and audition.
- Drum engine, 11-row drum sequencer, custom drum sample assignment.
- Synth engine, DERIZ audio resynthesis/pitch tools, MPCS vocal tuning and MGCHORD chord progression generation.
- FX rack with reverb, delay, EQ, filter, de-esser and automation targets/curves.
- Automation clip editor with split/clone and value interpolation.
- Track reorder, meters, recording controls, metronome, master pitch, project persistence/import/export, WAV/MP3 export, keyboard controller, tutorials and PWA/offline behavior.
- Track focus/drop-state animation and touch gestures.

Some features are explicitly experimental or incomplete in the archive README; they must be tested after integration rather than advertised as finished.
