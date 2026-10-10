import "./main.sass"
import "./midiable-mobile.sass"
import workersUrl from "@opendaw/studio-core/workers-main.js?worker&url"
import workletsUrl from "@opendaw/studio-core/processors.js?url"
import wasmProcessorUrl from "@opendaw/studio-core-wasm/wasm-processor.js?url"
import wasmOfflineWorkerUrl from "@opendaw/studio-core-wasm/wasm-offline-worker.js?worker&url"
import {boot} from "@/boot"
import {initializeColors} from "@opendaw/studio-enums"
import {DisplayPaint} from "@/ui/devices/DisplayPaint"

document.documentElement.classList.add("midiable-mobile")
initializeColors(document.documentElement)
DisplayPaint.initialize(document.documentElement)

// Android WebView may support isolated contexts via the explicit AndroidX profile allowlist,
// even when COOP/COEP headers alone are not sufficient. Keep a clear diagnostic if it does not.
if (window.crossOriginIsolated) {
    const now = Date.now()
    boot({
        workersUrl,
        workletsUrl,
        wasmProcessorUrl,
        wasmOfflineWorkerUrl
    }).then(() => console.debug(`OpenDAW studio booted in ${Math.ceil(Date.now() - now)}ms`))
        .catch(error => {
            console.error("OpenDAW studio boot failed", error)
            document.body.innerHTML = `<main style="padding:24px;font-family:system-ui;color:#f5f5f5;background:#171a1d">
                <h1>OpenDAW belum dapat dimulai</h1>
                <p>Mesin audio gagal dijalankan. Periksa dukungan WebView untuk WebAssembly, worker, AudioWorklet, dan cross-origin isolation.</p>
                <pre style="white-space:pre-wrap;color:#ffb4ab">${String(error)}</pre>
            </main>`
        })
} else {
    document.body.innerHTML = `<main style="padding:24px;font-family:system-ui;color:#f5f5f5;background:#171a1d">
        <h1>OpenDAW membutuhkan isolasi lintas-origin</h1>
        <p>WebView tidak mengaktifkan crossOriginIsolated. OpenDAW perlu origin localhost tepercaya dan header COOP/COEP agar mesin audio/WASM dapat berjalan offline.</p><pre style="white-space:pre-wrap;color:#c5cbd1">URL: ${location.href}
Secure context: ${String(window.isSecureContext)}
crossOriginIsolated: ${String(window.crossOriginIsolated)}
SharedArrayBuffer: ${String(typeof SharedArrayBuffer !== "undefined")}
WebAssembly: ${String(typeof WebAssembly !== "undefined")}
AudioWorklet: ${String(typeof AudioWorkletNode !== "undefined")}</pre>
    </main>`
}
