# NovaDAW Mobile Android wrapper

Independent Android application wrapper. Application ID: `com.novadaw.mobile`.

## Build
From this directory:
```sh
gradle assembleDebug
```
The HTML UI must be copied to `app/src/main/assets/novadaw/index.html` before build. The GitHub source stores it at `../app-shell/index.html`; copy that file into the asset path before packaging.

## Current limitation
This wrapper only hosts the UI prototype. It does not integrate the OpenDAW WASM engine, plugins, recording input, or real transport. Play/record indicators remain prototype-only. The wrapper source has not yet been compiled or installed in this repository environment.
