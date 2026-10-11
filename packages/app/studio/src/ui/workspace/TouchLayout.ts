/**
 * One source of truth for OpenDAW's Android/touch layout decision.
 *
 * The offline Android entry explicitly marks the document with midiable-mobile.
 * Chromium WebView may still report a fine pointer or a desktop-sized CSS viewport,
 * so relying on matchMedia alone routes toolbar actions to the desktop split layout.
 */
export const isTouchLayout = (): boolean =>
    document.documentElement.classList.contains("midiable-mobile") ||
    window.matchMedia("(max-width: 900px), (max-height: 520px), (pointer: coarse)").matches
