import css from "./TimelineRangeSlider.sass?inline"
import {int, Lifecycle, Option, Terminator, unitValue} from "@opendaw/lib-std"
import {createElement, Frag} from "@opendaw/lib-jsx"
import {ValueDragging} from "@/ui/hooks/dragging.ts"
import {TimelineRange} from "@opendaw/studio-core"
import {Events, Html} from "@opendaw/lib-dom"

const className = Html.adoptStyleSheet(css, "TimelineRangeSlider")

type Construct = {
    lifecycle: Lifecycle
    range: TimelineRange
    style?: Partial<CSSStyleDeclaration>
    className?: string
}

const COLOR_HANDLER = "rgba(255,255,255,0.25)"
const COLOR_BACKGROUND = "rgba(255,255,255,0.125)"

export const TimelineRangeSlider = ({lifecycle, range, style, className: extraClassName}: Construct) => {
    const radius = 5
    const padding = radius * 2
    const markerParts: [SVGElement, SVGElement, SVGRectElement] = (
        <Frag>
            <path
                d={`M ${radius} 0h ${radius}v ${radius * 2}h -${radius}a ${radius} ${radius} 0 0 1 -${radius} -${radius}a ${radius} ${radius} 0 0 1 ${radius} -${radius}`}
                fill={COLOR_HANDLER}/>
            <path
                d={`M ${radius * 2} 0h ${radius}a ${radius} ${radius} 0 0 1 0 ${radius * 2}h ${-radius}v ${-radius * 2}`}
                fill={COLOR_HANDLER}/>
            <rect width="0" height={radius * 2} fill={COLOR_BACKGROUND}/>
        </Frag>
    )
    const slider: SVGSVGElement = (
        <svg classList="slider" viewBox="0 0 0 0" shape-rendering="geometricPrecision">{markerParts}</svg>
    )
    const dragLifeTime = lifecycle.own(new Terminator())
    const computeSize = () => {
        const {clientWidth, clientHeight} = slider
        return ({clientWidth, clientHeight, trackLength: clientWidth - padding * 2})
    }
    const onUpdate = () => {
        if (!slider.isConnected) {return}
        const {trackLength} = computeSize()
        const x0 = Math.floor(range.min * trackLength)
        const x1 = Math.floor(range.max * trackLength)
        markerParts[0].setAttribute("transform", `translate(${x0}, 0)`)
        markerParts[1].setAttribute("transform", `translate(${x1}, 0)`)
        markerParts[2].x.baseVal.value = x0 + padding
        markerParts[2].width.baseVal.value = x1 - x0
    }
    const onResize = () => {
        const {clientWidth, clientHeight, trackLength} = computeSize()
        if (clientWidth === 0 || clientHeight === 0) return
        slider.viewBox.baseVal.width = clientWidth
        slider.viewBox.baseVal.height = clientHeight
        dragLifeTime.terminate()
        dragLifeTime.own(ValueDragging.installUnitValueRelativeDragging((event: PointerEvent) =>
            Option.wrap(new class implements ValueDragging.Process {
                #partIndex: int = markerParts.indexOf(event.target as any)
                start(): unitValue {
                    switch (this.#partIndex) {
                        case 0:
                            return range.min
                        case 1:
                            return range.max
                        case 2:
                            return range.center
                        default:
                            const rect = slider.getBoundingClientRect()
                            return range.center = (event.clientX - rect.left - padding) / trackLength
                    }
                }
                modify(value: unitValue): void {
                    switch (this.#partIndex) {
                        case 0:
                            range.min = value
                            return
                        case 1:
                            range.max = value
                            return
                        default:
                            range.center = value
                            return
                    }
                }
                cancel(_prevValue: unitValue): void {}
                finalise(_prevValue: unitValue, _newValue: unitValue): void {}
                finally(): void {}
            }), slider, {horizontal: true, trackLength, ratio: 1.0}))
        onUpdate()
    }

    lifecycle.own(Html.watchResize(slider, onResize))
    lifecycle.own(range.subscribe(onUpdate))
    lifecycle.ownAll(
        Events.subscribeDblDwn(slider, () => range.showAll()),
        (() => {
            const pointers = new Map<number, number>()
            let begin: {distance: number, min: number, max: number} | null = null
            const onDown = (event: PointerEvent) => {
                if (event.pointerType === "mouse") {return}
                pointers.set(event.pointerId, event.clientX)
                if (pointers.size === 2) {
                    const xs = Array.from(pointers.values())
                    begin = {distance: Math.abs(xs[1] - xs[0]), min: range.min, max: range.max}
                    event.preventDefault()
                }
            }
            const onMove = (event: PointerEvent) => {
                if (!pointers.has(event.pointerId)) {return}
                pointers.set(event.pointerId, event.clientX)
                if (pointers.size !== 2 || begin === null || begin.distance < 1) {return}
                const xs = Array.from(pointers.values())
                const center = (xs[0] + xs[1]) / 2
                const distance = Math.max(1, Math.abs(xs[1] - xs[0]))
                const width = Math.min(1, Math.max(0.002, (begin.max - begin.min) * begin.distance / distance))
                const rect = slider.getBoundingClientRect()
                const anchor = Math.min(1, Math.max(0, (center - rect.left - padding) / Math.max(1, rect.width - padding * 2)))
                const fraction = (anchor - begin.min) / Math.max(0.0001, begin.max - begin.min)
                range.min = Math.min(1 - width, Math.max(0, anchor - fraction * width))
                range.max = range.min + width
                event.preventDefault()
            }
            const onUp = (event: PointerEvent) => {
                pointers.delete(event.pointerId)
                begin = null
                if (pointers.size === 2) {
                    const xs = Array.from(pointers.values())
                    begin = {distance: Math.abs(xs[1] - xs[0]), min: range.min, max: range.max}
                }
            }
            slider.addEventListener("pointerdown", onDown, {passive: false})
            slider.addEventListener("pointermove", onMove, {passive: false})
            slider.addEventListener("pointerup", onUp)
            slider.addEventListener("pointercancel", onUp)
            return {terminate: () => {
                slider.removeEventListener("pointerdown", onDown)
                slider.removeEventListener("pointermove", onMove)
                slider.removeEventListener("pointerup", onUp)
                slider.removeEventListener("pointercancel", onUp)
                pointers.clear()
                begin = null
            }}
        })()
    )
    return <div className={Html.buildClassList(className, extraClassName)} style={style}>{slider}</div>
}