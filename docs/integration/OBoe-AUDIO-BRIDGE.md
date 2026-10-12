# StudioWave Oboe audio bridge — current scope

The Android shell now packages Google Oboe 1.11.0, opens a low-latency float stereo output stream, and exposes a narrowly-scoped JavaScript bridge for native synthesized-note audition. The WebAudio engine inside Melvox remains responsible for its own full song graph until a sample/block audio transport is implemented; Oboe does not automatically replace WebAudio in WebView.

## Implemented
- Oboe native output stream with data callback and simple polyphonic sine-voice test.
- JNI lifecycle and a JavaScript interface, pause/destroy cleanup.
- Test button to verify a native output stream on supported Android devices.
- Melvox bundling is moved to the build workflow's local source checkout (see workflow step).

## Not yet implemented / required next
- Route Melvox's multi-track PCM output into Oboe. That needs a deliberate audio-render/PCM ring-buffer bridge and must replace—not double-play—the WebAudio output.
- Per-note gate/note-off/envelopes, sample playback in native renderer, mixer automation and recording through Oboe.
- Physical-device latency/route testing.
