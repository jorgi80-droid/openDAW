#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
WRAPPER="$ROOT/android-wrapper-novadaw"
ASSETS="$WRAPPER/app/src/main/assets/novadaw"
mkdir -p "$ASSETS"
cp "$ROOT/app-shell/index.html" "$ASSETS/index.html"
cd "$WRAPPER"
gradle assembleDebug
printf '\nAPK path: %s\n' "$WRAPPER/app/build/outputs/apk/debug/app-debug.apk"
