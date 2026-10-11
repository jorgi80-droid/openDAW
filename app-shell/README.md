# NovaDAW app shell boundary

This folder is reserved for a new UI entry point separate from the OpenDAW studio app.

## Screen contract
- `TimelineScreen`: track list + clip canvas
- `MixerScreen`: channels and routing
- `PianoRollScreen`: note grid and velocity
- `DevicesScreen`: instrument/effect editor
- `BrowserScreen`: sample/instrument/effect/preset search
- `TransportBar`: tempo, meter, transport and position
- `WorkspaceDock`: one active route, bottom floating navigation

No screen may render a second copy of the dock or transport. Use project selectors and engine-backed commands; avoid embedding transport logic inside each screen.
