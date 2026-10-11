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

    export const install = (element: Element, range: TimelineRange) => {
        const subscription = Events.subscribe(element, "wheel", (event: WheelEvent) => {
            event.preventDefault()
            apply(element, range, event)
        }, {passive: false})
        const active = new Map<number, {x: number, y: number}>()
        let pinch: {distance: number, anchor: number, center: number} | null = null
        const readPoints = () => Array.from(active.values())
        const distance = (points: ReadonlyArray<{x: number, y: number}>): number => {
            const [a, b] = points
            return Math.hypot(b.x - a.x, b.y - a.y)
        }
        const centerX = (points: ReadonlyArray<{x: number, y: number}>): number =>
            (points[0].x + points[1].x) / 2
        const beginPinch = () => {
            const points = readPoints()
            if (points.length !== 2) {pinch = null; return}
            const d = distance(points)
            const center = centerX(points)
            pinch = d > 0 && range.width > 0
                ? {distance: d, anchor: clamp(range.xToValue(center), range.min, range.max), center}
                : null
        }
        const onPointerDown = (event: PointerEvent) => {
            if (event.pointerType === "mouse" || event.pointerType === "pen") {return}
            const rect = element.getBoundingClientRect()
            active.set(event.pointerId, {x: event.clientX - rect.left, y: event.clientY - rect.top})
            if (active.size === 2) {
                beginPinch()
                event.preventDefault()
            }
        }
        const onPointerMove = (event: PointerEvent) => {
            if (!active.has(event.pointerId)) {return}
            const rect = element.getBoundingClientRect()
            active.set(event.pointerId, {x: event.clientX - rect.left, y: event.clientY - rect.top})
            if (active.size !== 2 || pinch === null) {return}
            const points = readPoints()
            const d = distance(points)
            if (d <= 0 || pinch.distance <= 0) {return}
            const center = centerX(points)
            const deltaX = center - pinch.center
            // Translate the visible range with the midpoint so two-finger drags
            // pan naturally when the finger spacing stays constant.
            if (Math.abs(deltaX) > 0.25 && range.width > 0) {
                range.moveUnitBy(-deltaX / range.width * range.unitRange)
            }
            const scale = Math.log(d / pinch.distance)
            if (Math.abs(scale) > 0.0005) {
                range.scaleBy(-scale, pinch.anchor)
            }
            pinch = {distance: d, anchor: pinch.anchor, center}
            event.preventDefault()
        }
        const clearPointer = (event: PointerEvent) => {
            active.delete(event.pointerId)
            beginPinch()
        }
        const pointerTarget = element as HTMLElement
        const pointerSubscriptions = [
            Events.subscribe(pointerTarget, "pointerdown", onPointerDown, {passive: false}),
            Events.subscribe(pointerTarget, "pointermove", onPointerMove, {passive: false}),
            Events.subscribe(pointerTarget, "pointerup", clearPointer),
            Events.subscribe(pointerTarget, "pointercancel", clearPointer),
            Events.subscribe(pointerTarget, "lostpointercapture", clearPointer)
        ]
        return {
            terminate: () => {
                subscription.terminate()
                pointerSubscriptions.forEach(item => item.terminate())
                active.clear()
                pinch = null
            }
        }
    }
}
