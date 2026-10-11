import css from "./Footer.sass?inline"
import {createElement, Frag, LocalLink, replaceChildren} from "@opendaw/lib-jsx"
import {isDefined, isNotNull, Lifecycle, Nullable, Terminator, TimeSpan} from "@opendaw/lib-std"
import {StudioService} from "@/service/StudioService"
import {Surface} from "@/ui/surface/Surface"
import {AnimationFrame, Events, Html} from "@opendaw/lib-dom"
import {Runtime} from "@opendaw/lib-runtime"
import {FooterLabel} from "@/service/FooterLabel"
import {ProjectMeta, StudioPreferences} from "@opendaw/studio-core"
import {Colors} from "@opendaw/studio-enums"
import {AudioData} from "@opendaw/lib-dsp"
import {FooterItem} from "@/ui/FooterItem"
import {EngineAddresses} from "@opendaw/studio-adapters"
import {LatencyWarning} from "@/ui/LatencyWarning"
import {Icon} from "@/ui/components/Icon"
import {IconSymbol} from "@opendaw/studio-enums"
import {createMobileStudioPort} from "@/service/MobileStudioPort"

const className = Html.adoptStyleSheet(css, "footer")

type Construct = { lifecycle: Lifecycle, service: StudioService }

export const Footer = ({lifecycle, service}: Construct) => {
    const {audioContext, buildInfo, engine, projectProfileService} = service
    const mobileStudio = createMobileStudioPort(service)
    return (
        <footer className={className} onInit={element => {
            const sync = () => {
                const activeScreen = mobileStudio.activeScreen.getValue()
                const mapping: Record<string, string> = {
                    "timeline-shortcut": "default",
                    "browser-shortcut": "browser",
                    "mixer-shortcut": "mixer",
                    "editor-shortcut": "piano",
                    "devices-shortcut": "modulation"
                }
                element.querySelectorAll<HTMLElement>(".mobile-panel-shortcut").forEach(button => {
                    const screen = Object.entries(mapping).find(([key]) => button.classList.contains(key))?.[1]
                    button.toggleAttribute("data-pressed", screen === activeScreen)
                })
            }
            lifecycle.own(mobileStudio.activeScreen.subscribe(sync))
            requestAnimationFrame(sync)
        }}>
            <FooterItem title="Mode" onInit={({value}) => {
                const offlineApp = location.hostname.endsWith("androidplatform.net")
                const updateMode = () => value.textContent = offlineApp ? "Offline" : (navigator.onLine ? "Online" : "Offline")
                lifecycle.ownAll(
                    Events.subscribe(window, "online", updateMode),
                    Events.subscribe(window, "offline", updateMode))
                updateMode()
            }}/>
            <FooterItem className="name" title="Project"
                        onInit={({component, value}) => {
                            const profileLifecycle = lifecycle.own(new Terminator())
                            lifecycle.ownAll(
                                Events.subscribeDblDwn(component, event => {
                                    const optProfile = projectProfileService.getValue()
                                    if (optProfile.isEmpty()) {return}
                                    const profile = optProfile.unwrap()
                                    const name = profile.meta.name
                                    if (isDefined(name)) {
                                        Surface.get(component).requestFloatingTextInput(event, name)
                                            .then(name => profile.updateMetaData("name", name))
                                    }
                                }),
                                projectProfileService.catchupAndSubscribe(optProfile => {
                                    profileLifecycle.terminate()
                                    if (optProfile.nonEmpty()) {
                                        const profile = optProfile.unwrap()
                                        const observer = (meta: ProjectMeta) => value.textContent = meta.name
                                        profileLifecycle.own(profile.subscribeMetaData(observer))
                                        observer(profile.meta)
                                    } else {
                                        value.textContent = "⏏︎"
                                    }
                                }))
                        }}/>
                        <FooterItem className="mobile-panel-shortcut timeline-shortcut" title="Timeline"
                        onInit={({component}) => {
                            component.setAttribute("role", "button")
                            component.setAttribute("tabindex", "0")
                            component.setAttribute("aria-label", "Open Timeline")
                            const open = () => mobileStudio.navigate("timeline")
                            lifecycle.ownAll(
                                Events.subscribe(component, "click", open),
                                Events.subscribe(component, "keydown", event => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault()
                                        open()
                                    }
                                })
                            )
                        }}><Icon symbol={IconSymbol.Timeline}/></FooterItem>
            <FooterItem className="mobile-panel-shortcut browser-shortcut" title="Browser"
                        onInit={({component}) => {
                            component.setAttribute("role", "button")
                            component.setAttribute("tabindex", "0")
                            component.setAttribute("aria-label", "Toggle Sample Browser")
                            const toggle = () => mobileStudio.navigate("browser")
                            lifecycle.ownAll(
                                Events.subscribe(component, "click", toggle),
                                Events.subscribe(component, "keydown", event => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault()
                                        toggle()
                                    }
                                })
                            )
                        }}><Icon symbol={IconSymbol.Panel}/></FooterItem>
            <FooterItem className="mobile-panel-shortcut mixer-shortcut" title="Mixer"
                        onInit={({component}) => {
                            component.setAttribute("role", "button")
                            component.setAttribute("tabindex", "0")
                            component.setAttribute("aria-label", "Toggle Mixer")
                            const toggle = () => mobileStudio.navigate("mixer")
                            lifecycle.ownAll(
                                Events.subscribe(component, "click", toggle),
                                Events.subscribe(component, "keydown", event => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault()
                                        toggle()
                                    }
                                })
                            )
                        }}><Icon symbol={IconSymbol.Mixing}/></FooterItem>
            <FooterItem className="mobile-panel-shortcut editor-shortcut" title="Editor"
                        onInit={({component}) => {
                            component.setAttribute("role", "button")
                            component.setAttribute("tabindex", "0")
                            component.setAttribute("aria-label", "Toggle Editor / Piano Roll")
                            const toggle = () => mobileStudio.navigate("editor")
                            lifecycle.ownAll(
                                Events.subscribe(component, "click", toggle),
                                Events.subscribe(component, "keydown", event => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault()
                                        toggle()
                                    }
                                })
                            )
                        }}><Icon symbol={IconSymbol.Pencil}/></FooterItem>
            <FooterItem className="mobile-panel-shortcut devices-shortcut" title="Devices"
                        onInit={({component}) => {
                            component.setAttribute("role", "button")
                            component.setAttribute("tabindex", "0")
                            component.setAttribute("aria-label", "Toggle Devices / Effects")
                            const toggle = () => mobileStudio.navigate("devices")
                            lifecycle.ownAll(
                                Events.subscribe(component, "click", toggle),
                                Events.subscribe(component, "keydown", event => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault()
                                        toggle()
                                    }
                                })
                            )
                        }}><Icon symbol={IconSymbol.Flask}/></FooterItem>
            <FooterItem title="SampleRate">{audioContext.sampleRate}</FooterItem>
            <FooterItem title="Latency" minWidth="6ch"
                        onInit={({component, value}) => {
                            const threshold = () =>
                                StudioPreferences.settings.engine["latency-warning-threshold"] / 1000.0
                            const state: { warning: Nullable<HTMLElement>, dismissed: boolean } =
                                {warning: null, dismissed: false}
                            const hide = () => {
                                state.warning?.remove()
                                state.warning = null
                            }
                            const show = () => {
                                if (isNotNull(state.warning) || state.dismissed) {return}
                                // Native Android is a touch DAW even when WebView reports a fine pointer.
                                // Never place a floating latency warning over the Timeline or clip controls.
                                if (location.hostname.endsWith("androidplatform.net") ||
                                    window.matchMedia("(pointer: coarse)").matches) {return}
                                const warning: HTMLElement = (
                                    <LatencyWarning anchor={component} dismiss={() => {
                                        state.dismissed = true
                                        hide()
                                    }}/>
                                )
                                state.warning = warning
                                component.appendChild(warning)
                            }
                            lifecycle.ownAll(
                                Runtime.scheduleInterval(() => {
                                    const outputLatency = audioContext.outputLatency
                                    if (outputLatency > 0.0) {
                                        value.textContent = `${(outputLatency * 1000.0).toFixed(1)}ms`
                                        value.style.color = outputLatency > threshold()
                                            ? Colors.orange.toString() : ""
                                    }
                                    if (outputLatency > threshold()) {show()} else {hide()}
                                }, 1000),
                                {terminate: hide}
                            )
                        }}>N/A</FooterItem>

<FooterItem title="CPU Load" minWidth="4ch"
                        onInit={({component, value}) => {
                            lifecycle.own(engine.preferences.catchupAndSubscribe(enabled => {
                                component.classList.toggle("hidden", !enabled)
                            }, "debug", "dspLoadMeasurement"))
                            lifecycle.own(engine.cpuLoad.catchupAndSubscribe(owner => {
                                const percent = Math.min(owner.getValue(), 100)
                                value.textContent = `${percent}%`
                                value.style.color = percent >= 100 ? Colors.red.toString()
                                    : percent > 75 ? Colors.orange.toString() : ""
                            }))
                        }}>0%</FooterItem>
            <FooterItem title="Memory" minWidth="7ch"
                        onInit={({value}) => {
                            const runtime = lifecycle.own(new Terminator())
                            const megabytes = (bytes: number) => (bytes / (1024 * 1024)).toFixed(0)
                            lifecycle.own(projectProfileService.catchupAndSubscribe(optProfile => {
                                runtime.terminate()
                                if (optProfile.isEmpty()) {
                                    value.textContent = "N/A"
                                    return
                                }
                                const {project} = optProfile.unwrap()
                                runtime.own(project.liveStreamReceiver
                                    .subscribeFloats(EngineAddresses.HEAP, values =>
                                        value.textContent =
                                            `${megabytes(values[0])}/${megabytes(values[2])}M`))
                            }))
                        }}>N/A</FooterItem>
            <FooterItem title="FPS"
                        onInit={({component, value}) => {
                            const lifeSpan = lifecycle.own(new Terminator())
                            lifecycle.own(StudioPreferences.catchupAndSubscribe(show => {
                                component.classList.toggle("hidden", !show)
                                if (show) {
                                    let frame = 0 | 0
                                    let lastTime = Date.now()
                                    lifeSpan.own(AnimationFrame.add(() => {
                                        if (Date.now() - lastTime >= 1000) {
                                            value.textContent = String(frame)
                                            lastTime = Date.now()
                                            frame = 0
                                        } else {frame++}
                                    }))
                                } else {
                                    lifeSpan.terminate()
                                }
                            }, "debug", "footer-show-fps-meter"))
                        }}>0</FooterItem>
            <FooterItem title="Samples (GC)"
                        onInit={({component, value}) => {
                            const lifeSpan = lifecycle.own(new Terminator())
                            lifecycle.own(StudioPreferences.catchupAndSubscribe(show => {
                                component.classList.toggle("hidden", !show)
                                if (show) {
                                    lifeSpan.own(Runtime.scheduleInterval(() => {
                                        value.textContent = AudioData.count().toString()
                                    }, 1000))
                                } else {
                                    lifeSpan.terminate()
                                }
                            }, "debug", "footer-show-samples-memory"))
                        }}>0</FooterItem>
            <div style={{display: "contents"}}
                 onInit={element => {
                     const lifeSpan = lifecycle.own(new Terminator())
                     lifecycle.own(StudioPreferences.catchupAndSubscribe(show => {
                         element.classList.toggle("hidden", !show)
                         if (show) {
                             replaceChildren(element, (
                                 <Frag>
                                     <FooterItem title="Build Version">{buildInfo.uuid}</FooterItem>
                                     <FooterItem title="Build Time"
                                                 onInit={({value}) => {
                                                     const buildDateMillis = new Date(buildInfo.date).getTime()
                                                     const update = () => value.textContent =
                                                         TimeSpan.millis(buildDateMillis - new Date().getTime()).toUnitString()
                                                     lifeSpan.own(Runtime.scheduleInterval(update, 1000))
                                                     update()
                                                 }}/>
                                 </Frag>
                             ))
                         } else {
                             replaceChildren(element)
                             lifeSpan.terminate()
                         }
                     }, "debug", "footer-show-build-infos"))
                 }}/>
            <div style={{display: "contents"}}
                 onInit={element => service.registerFooter((): FooterLabel => {
                     let titleRef!: HTMLElement
                     let valueRef!: HTMLElement
                     const item: HTMLElement = <FooterItem title="" onInit={({title, value}) => {
                         titleRef = title
                         valueRef = value
                     }}/>
                     element.appendChild(item)
                     return {
                         setTitle: (text: string) => titleRef.textContent = text,
                         setValue: (text: string) => valueRef.textContent = text,
                         terminate: () => {if (item.isConnected) {item.remove()}}
                     } satisfies FooterLabel
                 })}/>
            <div style={{flex: "1"}}/>
            <div style={{color: Colors.cream.toString()}}>
                <LocalLink href="/privacy">Privacy</LocalLink> · <LocalLink href="/imprint">Imprint</LocalLink>
            </div>
            <div className="mobile-edge-dock" onInit={element => {
                const currentKey = (): string => {
                    const active = mobileStudio.activeScreen.getValue()
                    return active === "default" ? "default"
                        : active === "mixer" ? "mixer"
                            : active === "modulation" ? "modulation"
                                : active === "piano" ? "piano" : ""
                }
                const sync = () => {
                    const active = currentKey()
                    element.querySelectorAll<HTMLButtonElement>("[data-mobile-screen]").forEach(button => {
                        button.setAttribute("aria-pressed", String(button.dataset.mobileScreen === active))
                    })
                }
                lifecycle.own(mobileStudio.activeScreen.catchupAndSubscribe(sync))
            }}>
                <button type="button" className="mobile-edge-handle" aria-label="Open workspace tabs"
                        aria-expanded="false"
                        onclick={event => {
                            const handle = event.currentTarget as HTMLButtonElement
                            const dock = handle.closest(".mobile-edge-dock") as HTMLElement | null
                            if (dock === null) {return}
                            const open = !dock.classList.contains("open")
                            dock.classList.toggle("open", open)
                            handle.setAttribute("aria-expanded", String(open))
                        }}>
                    <Icon symbol={IconSymbol.Panel}/>
                </button>
                <div className="mobile-edge-panel">
                    <button type="button" data-mobile-screen="default" aria-pressed="false"
                            onclick={() => {mobileStudio.navigate("timeline"); (() => { const dock = document.querySelector<HTMLElement>(".mobile-edge-dock"); dock?.classList.remove("open"); dock?.querySelector(".mobile-edge-handle")?.setAttribute("aria-expanded", "false") })()}}>
                        <Icon symbol={IconSymbol.Timeline}/><span>Timeline</span>
                    </button>
                    <button type="button" data-mobile-screen="mixer" aria-pressed="false"
                            onclick={() => {mobileStudio.navigate("mixer"); (() => { const dock = document.querySelector<HTMLElement>(".mobile-edge-dock"); dock?.classList.remove("open"); dock?.querySelector(".mobile-edge-handle")?.setAttribute("aria-expanded", "false") })()}}>
                        <Icon symbol={IconSymbol.Mixing}/><span>Mixer</span>
                    </button>
                    <button type="button" data-mobile-screen="modulation" aria-pressed="false"
                            onclick={() => {mobileStudio.navigate("devices"); (() => { const dock = document.querySelector<HTMLElement>(".mobile-edge-dock"); dock?.classList.remove("open"); dock?.querySelector(".mobile-edge-handle")?.setAttribute("aria-expanded", "false") })()}}>
                        <Icon symbol={IconSymbol.Flask}/><span>Devices</span>
                    </button>
                    <button type="button" data-mobile-screen="piano" aria-pressed="false"
                            onclick={() => {mobileStudio.navigate("editor"); (() => { const dock = document.querySelector<HTMLElement>(".mobile-edge-dock"); dock?.classList.remove("open"); dock?.querySelector(".mobile-edge-handle")?.setAttribute("aria-expanded", "false") })()}}>
                        <Icon symbol={IconSymbol.Pencil}/><span>Editor / Piano Roll</span>
                    </button>
                </div>
            </div>
        </footer>
    )
}