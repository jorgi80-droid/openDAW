import {clamp} from "@opendaw/lib-std"
import {Events} from "@opendaw/lib-dom"
import {StudioPreferences, TimelineRange} from "@opendaw/studio-core"

export namespace WheelScaling {
    const DeltaModeToPixels: ReadonlyArray<number> = [1.0, 33.0, 400.0]
    const QuantumFloor = 2.0
    const QuantumDecayMs = 300.0
    const StepPerTick = 0.1

    // Devices report wildly different deltas per notch, so we track the largest recent
    // magnitude (decaying between gestures) and express any event as a fraction of it.
    const calibration = {quantum: 0.0, time: 0.0}

    export const pixelsOf = (event: WheelEvent): number =>
        event.deltaY * (DeltaModeToPixels.at(event.deltaMode) ?? 1.0)

    export const scaleOf = (event: WheelEvent): number => {
        const delta = pixelsOf(event)
        if (delta === 0.0) {return 0.0}
        const time = performance.now()
        const decayed = calibration.quantum * Math.exp((calibration.time - time) / QuantumDecayMs)
        calibration.quantum = Math.max(Math.abs(delta), decayed, QuantumFloor)
        calibration.time = time
        const speed = StudioPreferences.settings.pointer["wheel-zoom-speed"] / 100.0
        return delta / calibration.quantum * StepPerTick * speed
    }

    export const apply = (element: Element, range: TimelineRange, event: WheelEvent): void => {
        const rect = element.getBoundingClientRect()
        // Before the first layout pass the range has no width yet, which maps any x far outside
        // the visible interval and makes scaleBy jump away from the pointer.
        const anchor = clamp(range.xToValue(event.clientX - rect.left), range.min, range.max)
        range.scaleBy(scaleOf(event), anchor)
    }

    /** Installs browser wheel zoom and native two-finger pinch zoom on the same timeline surface. */
    export const install = (element: Element, range: TimelineRange) => {
        const subscriptions = [
            Events.subscribe(element, "wheel", (event: WheelEvent) => {
                event.preventDefault()
                apply(element, range, event)
            }, {passive: false})
        ]
        const active = new Map<number, {x: number, y: number}>()
        let pinch: {distance: number, anchor: number, width: number} | null = null
        const distance = (points: Iterable<{x: number, y: number}>): number => {
            const [a, b] = Array.from(points)
            return Math.hypot(b.x - a.x, b.y - a.y)
        }
        const midpoint = (points: Iterable<{x: number, y: number}>): number => {
            const [a, b] = Array.from(points)
            return (a.x + b.x) / 2
        }
        const onPointerDown = (event: PointerEvent) => {
            if (event.pointerType === "mouse" || event.pointerType === "pen") {return}
            const rect = element.getBoundingClientRect()
            active.set(event.pointerId, {x: event.clientX - rect.left, y: event.clientY - rect.top})
            if (active.size === 2) {
                const points = Array.from(active.values())
                const d = distance(points)
                if (d > 0 && range.width > 0) {
                    const center = midpoint(points)
                    pinch = {
                        distance: d,
                        anchor: clamp(range.xToValue(center), range.min, range.max),
                        width: range.width
                    }
                }
                event.preventDefault()
            }
        }
        const onPointerMove = (event: PointerEvent) => {
            if (!active.has(event.pointerId)) {return}
            const rect = element.getBoundingClientRect()
            active.set(event.pointerId, {x: event.clientX - rect.left, y: event.clientY - rect.top})
            if (active.size < 2 || pinch === null) {return}
            const points = Array.from(active.values())
            const d = distance(points)
            if (d <= 0 || pinch.distance <= 0) {return}
            // Use incremental pinch distance so scaling remains smooth and does not depend
            // on the device's absolute pixel ratio. Keep the time under the fingers anchored.
            const scale = Math.log(d / pinch.distance)
            if (Math.abs(scale) > 0.0005) {
                range.scaleBy(-scale, pinch.anchor)
                pinch = {distance: d, anchor: pinch.anchor, width: range.width}
            }
            event.preventDefault()
        }
        const clearPointer = (event: PointerEvent) => {
            active.delete(event.pointerId)
            pinch = null
            if (active.size === 2) {
                const points = Array.from(active.values())
                const d = distance(points)
                const center = midpoint(points)
                pinch = d > 0 ? {distance: d, anchor: clamp(range.xToValue(center), range.min, range.max), width: range.width} : null
            }
        }
        element.addEventListener("pointerdown", onPointerDown, {passive: false})
        element.addEventListener("pointermove", onPointerMove, {passive: false})
        element.addEventListener("pointerup", clearPointer)
        element.addEventListener("pointercancel", clearPointer)
        element.addEventListener("lostpointercapture", clearPointer)
        return {
            terminate: () => {
                subscriptions.forEach(subscription => subscription.terminate())
                element.removeEventListener("pointerdown", onPointerDown)
                element.removeEventListener("pointermove", onPointerMove)
                element.removeEventListener("pointerup", clearPointer)
                element.removeEventListener("pointercancel", clearPointer)
                element.removeEventListener("lostpointercapture", clearPointer)
                active.clear()
                pinch = null
            }
        }
    }
        Events.subscribe(element, "wheel", (event: WheelEvent) => {
            event.preventDefault()
            apply(element, range, event)
        }, {passive: false})
}
