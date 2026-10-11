# Android packaging plan

Do not modify the existing OpenDAW/MidiAble app identity. NovaDAW must have a separate Android application id, app name, icon and build configuration.

Suggested sequence:
1. Produce the browser shell and test it in a local server.
2. Integrate engine boot and confirm worker/WASM/plugin assets resolve from the app origin.
3. Add an independent Android WebView wrapper with local assets and correct audio/input permissions.
4. Run Gradle debug build in an SDK-enabled CI or local environment.
5. Install and smoke-test on an Android device, recording API level, audio output/input, lifecycle and background behavior.
