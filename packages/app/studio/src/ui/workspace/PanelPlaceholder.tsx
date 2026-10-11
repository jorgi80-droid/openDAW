import css from "./PanelPlaceholder.sass?inline"
import {DefaultObservableValue, isDefined, Lifecycle, Nullable, ObservableValue, Optional, Terminator} from "@opendaw/lib-std"
import {Icon} from "@/ui/components/Icon.tsx"
import {appendChildren, createElement, DomElement, Frag, Group, replaceChildren} from "@opendaw/lib-jsx"
import {PanelContents} from "@/ui/workspace/PanelContents.tsx"
import {Workspace} from "@/ui/workspace/Workspace.ts"
import {PanelState} from "@/ui/workspace/PanelState.ts"
import {PanelType} from "@/ui/workspace/PanelType.ts"
import {AxisProperty} from "@/ui/workspace/AxisProperty.ts"
import {ContextMenu, MenuItem} from "@opendaw/studio-core"
import {ContentGlue} from "@/ui/workspace/ContentGlue.ts"
import {IconSymbol} from "@opendaw/studio-enums"
import {Browser, Events, Html} from "@opendaw/lib-dom"
import {AwarenessUserState, RoomAwareness} from "@/service/RoomAwareness"
import FlexLayoutConstrains = Workspace.FlexLayoutConstrains

const className = Html.adoptStyleSheet(css, "PanelPlaceholder")

type Construct = {
    lifecycle: Lifecycle
    orientation: Workspace.Orientation
    siblings: ReadonlyArray<ContentGlue>
    panelContents: PanelContents
    panelState: PanelState
    roomAwareness: ObservableValue<Nullable<RoomAwareness>>
}

export const PanelPlaceholder =
    ({lifecycle, panelContents, orientation, siblings, panelState, roomAwareness}: Construct) => {
        const {icon, name, constrains, minimizable, popoutable} = panelState
        const HeaderSize = 18
        const container = <Group/>
        const element: DomElement = <div className={Html.buildClassList(className, orientation, "panel-placeholder")}
                                         data-panel-type={name}/>
        const panelContent = panelContents.getByType(panelState.panelType)

        // It works, but it feels misplaced here, because we are updating the siblings as well.
        // The panel system is a weak spot. FIXME Panel-System
        const updateLayout = () => {
            const style = element.style
            const property = AxisProperty[orientation]

            // Update element style and css-class
            if ((panelState.isMinimized || panelContent.isPopout) && minimizable) {
                style.flexGrow = "0"
                style[property.maxStyle] = style[property.minStyle] = `${HeaderSize}px`
                element.classList.add("closed")
            } else {
                element.classList.remove("closed")
                if (constrains.type === "fixed") {
                    style.flexGrow = "0"
                    style[property.minStyle] = style[property.maxStyle] = `${constrains.fixedSize + HeaderSize}px`
                } else if (constrains.type === "flex") {
                    style.flexGrow = constrains.flex.toString()
                    style[property.minStyle] = `${constrains.minSize}px`
                    style[property.maxStyle] = `${constrains.maxSize ?? Number.MAX_SAFE_INTEGER}px`
                }
            }

            // Update siblings flexGrow
            const flexible: Array<{ constrains: FlexLayoutConstrains, style: CSSStyleDeclaration }> = []
            siblings.forEach(({content, element: {style}}) => {
                if (!panelContents.isClosed(content) && content.constrains.type === "flex") {
                    flexible.push({constrains: content.constrains, style})
                }
            })
            if (flexible.length === 1) {
                flexible[0].style.flexGrow = "1" // stretch element to occupy remaining space
            } else {
                flexible.forEach(({style, constrains}) => style.flexGrow = constrains.flex.toString())
            }
        }

        const popupLabel: Element = (
            <div className="popup-label">
                <span>
                    {`${panelState.name} is currently in another window.`}
                </span>
            </div>
        )
        const popoutIcon = new DefaultObservableValue(IconSymbol.Embed)
        const minimizedIcon = new DefaultObservableValue(IconSymbol.Minimized)
        const handler = lifecycle.own(panelContent.bind(panelState, container, {
            onEmbed: () => {
                if (popupLabel.isConnected) {popupLabel.remove()}
                popoutIcon.setValue(IconSymbol.Embed)
                minimizedIcon.setValue(IconSymbol.Minimized)
                updateLayout()
            },
            onPopout: () => {
                if (!panelState.minimizable) {container.appendChild(popupLabel)}
                popoutIcon.setValue(IconSymbol.Popout)
                updateLayout()
            },
            onMinimized: () => {
                if (popupLabel.isConnected) {popupLabel.remove()}
                popoutIcon.setValue(IconSymbol.Embed)
                minimizedIcon.setValue(IconSymbol.Maximized)
                updateLayout()
            }
        }))
        const presenceDots: HTMLElement = <div className="presence-dots"/>
        const touchMaximizable = panelState.minimizable &&
            (panelState.panelType === PanelType.Mixer ||
                panelState.panelType === PanelType.ContentEditor ||
                panelState.panelType === PanelType.DevicePanel)
        const startsMaximized = document.documentElement.classList.contains("opendaw-panel-maximized")
        const maximizeButton: HTMLElement | null = touchMaximizable ? (
            <button type="button"
                    className="panel-maximize-button"
                    title={startsMaximized ? `Restore ${name}` : `Maximize ${name}`}
                    aria-label={startsMaximized ? `Restore ${name}` : `Maximize ${name}`}
                    aria-pressed={String(startsMaximized)}
                    onclick={event => {
                        event.stopPropagation()
                        const root = document.documentElement
                        const wasMaximized = root.classList.contains("opendaw-panel-maximized")
                        root.classList.remove("opendaw-panel-maximized", "opendaw-maximized-mixer", "opendaw-maximized-editor", "opendaw-maximized-devices")
                        const maximized = !wasMaximized
                        if (maximized) {
                            root.classList.add("opendaw-panel-maximized")
                            root.classList.add(panelState.panelType === PanelType.Mixer ? "opendaw-maximized-mixer"
                                : panelState.panelType === PanelType.ContentEditor ? "opendaw-maximized-editor"
                                    : "opendaw-maximized-devices")
                        }
                        const button = event.currentTarget as HTMLButtonElement
                        button.title = maximized ? `Restore ${name}` : `Maximize ${name}`
                        button.setAttribute("aria-label", maximized ? `Restore ${name}` : `Maximize ${name}`)
                        button.setAttribute("aria-pressed", String(maximized))
                        const icon = button.querySelector("svg")
                        if (icon !== null) {
                            icon.replaceWith(<Icon symbol={maximized ? IconSymbol.Minimized : IconSymbol.Maximized}/>)
                        }
                    }}>
                <Icon symbol={startsMaximized ? IconSymbol.Minimized : IconSymbol.Maximized}/>
            </button>
        ) : null
        const header: HTMLElement = (
            <header>
                <Icon symbol={icon}/> <span>{name}</span> {presenceDots} {maximizeButton}
            </header>
        )
        const roomLifecycle = lifecycle.own(new Terminator())
        lifecycle.own(roomAwareness.catchupAndSubscribe(owner => {
            roomLifecycle.terminate()
            const awareness: Nullable<RoomAwareness> = owner.getValue()
            if (isDefined(awareness)) {
                const render = () => {
                    const states = awareness.awareness.getStates()
                    const localId = awareness.clientID
                    const dots: Array<{ userName: string, color: string, self: boolean }> = []
                    states.forEach((state, clientId) => {
                        const user: Optional<AwarenessUserState> = state.user
                        if (isDefined(user) && user.panel === name) {
                            dots.push({userName: user.name, color: user.color, self: clientId === localId})
                        }
                    })
                    dots.sort((first, second) => first.self === second.self ? 0 : first.self ? -1 : 1)
                    replaceChildren(presenceDots, ...dots.map(dot => (
                        <span className="dot" style={{backgroundColor: dot.color}} title={dot.userName}/>
                    )))
                }
                const awarenessApi = awareness.awareness
                awarenessApi.on("change", render)
                roomLifecycle.own({terminate: () => awarenessApi.off("change", render)})
                render()
            } else {
                replaceChildren(presenceDots)
            }
        }))
        appendChildren(element, <Frag>{header}{container}</Frag>)
        // Touch taps collapse/expand an existing panel; a dragged header must not toggle it.
        // Pointer capture is used by interactive children, so only accept a short stationary tap.
        let touchStart: { x: number, y: number, time: number, pointerId: number } | null = null
        lifecycle.own(Events.subscribe(header, "pointerdown", event => {
            if (event.pointerType === "mouse" || event.button !== 0) {return}
            const target = event.target
            if (target instanceof Element && target.closest(".panel-maximize-button") !== null) {return}
            touchStart = {x: event.clientX, y: event.clientY, time: performance.now(), pointerId: event.pointerId}
        }, {capture: true}))
        lifecycle.own(Events.subscribe(header, "pointerup", event => {
            const start = touchStart
            touchStart = null
            if (start === null || event.pointerId !== start.pointerId || event.button !== 0) {return}
            if (performance.now() - start.time > 450) {return}
            if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) {return}
            const target = event.target
            if (target instanceof Element && target.closest(".panel-maximize-button") !== null) {return}
            if (panelState.panelType !== PanelType.Timeline) {handler.toggleMinimize()}
        }, {capture: true}))
        lifecycle.own(Events.subscribe(header, "pointercancel", () => {touchStart = null}, {capture: true}))
        lifecycle.own(Events.subscribeDblDwn(header, event => {
            if (event.pointerType === "mouse") {handler.toggleMinimize()}
        }))
        lifecycle.own(ContextMenu.subscribe(header, collector => collector.addItems(
            MenuItem.default({
                label: "Popout into new browser window",
                checked: handler.isPopout(),
                hidden: !Browser.isWeb(),
                selectable: popoutable
            }).setTriggerProcedure(handler.togglePopout)
        )))
        return element
    }