import {PanelState} from "@/ui/workspace/PanelState.ts"
import {PanelType} from "@/ui/workspace/PanelType.ts"
import {Workspace} from "./Workspace.ts"
import {IconSymbol} from "@opendaw/studio-enums"

const BrowserPanel = PanelState.create({
    type: "panel",
    name: "Browser",
    icon: IconSymbol.Panel,
    panelType: PanelType.BrowserPanel,
    constrains: {type: "flex", minSize: 44, maxSize: 360, flex: 0.25},
    minimized: true
})
const MobileBrowserPanel = PanelState.create({
    type: "panel",
    name: "Browser",
    icon: IconSymbol.Panel,
    panelType: PanelType.BrowserPanel,
    constrains: {type: "flex", minSize: 0, flex: 1}
})
const DevicesPanel = PanelState.create({
    type: "panel",
    name: "Devices",
    icon: IconSymbol.Flask,
    panelType: PanelType.DevicePanel,
    notPopoutable: true,
    constrains: {type: "flex", minSize: 72, maxSize: 420, flex: 1},
    minimized: true
})
const AnalysisPanel: PanelState = PanelState.create({
    type: "panel",
    name: "Analysis",
    icon: IconSymbol.Charts,
    panelType: PanelType.Analysis,
    constrains: {type: "flex", minSize: 448, maxSize: 448, flex: 1.0}
})

const TimelinePanel = PanelState.create({
    type: "panel",
    name: "Timeline",
    icon: IconSymbol.Timeline,
    panelType: PanelType.Timeline,
    constrains: {type: "flex", minSize: 120, flex: 2}
})
const MobileTimelinePanel = PanelState.create({
    type: "panel",
    name: "Timeline",
    icon: IconSymbol.Timeline,
    panelType: PanelType.Timeline,
    constrains: {type: "flex", minSize: 100, flex: 1}
})
const EditorPanel = PanelState.create({
    type: "panel",
    name: "Editor",
    icon: IconSymbol.Pencil,
    panelType: PanelType.ContentEditor,
    constrains: {type: "flex", minSize: 80, maxSize: 420, flex: 1},
    minimized: true
})
const DefaultMixerPanel = PanelState.create({
    type: "panel",
    name: "Mixer",
    icon: IconSymbol.Mixing,
    panelType: PanelType.Mixer,
    constrains: {type: "flex", minSize: 20, maxSize: 320, flex: 0.16},
    minimized: true
})
const DesktopMixerPanel = PanelState.create({
    type: "panel",
    name: "Mixer",
    icon: IconSymbol.Mixing,
    panelType: PanelType.Mixer,
    notMinimizable: true,
    constrains: {type: "flex", minSize: 0, flex: 1}
})
const MobileMixerPanel = PanelState.create({
    type: "panel",
    name: "Mixer",
    icon: IconSymbol.Mixing,
    panelType: PanelType.Mixer,
    constrains: {type: "flex", minSize: 0, flex: 3},
})
const MobileEditorPanel = PanelState.create({
    type: "panel",
    name: "Editor",
    icon: IconSymbol.Pencil,
    panelType: PanelType.ContentEditor,
    constrains: {type: "flex", minSize: 0, flex: 3},
})
const MobileDevicesPanel = PanelState.create({
    type: "panel",
    name: "Devices",
    icon: IconSymbol.Flask,
    panelType: PanelType.DevicePanel,
    notPopoutable: true,
    constrains: {type: "flex", minSize: 0, flex: 3},
})

/*const ModularSystem = PanelState.create({
    type: "panel",
    name: "Modular System",
    icon: IconSymbol.Box,
    panelType: PanelType.ModularSystem,
    notMinimizable: true,
    constrains: {type: "flex", minSize: 20, flex: 1}
})*/
export const DefaultWorkspace = Object.freeze({
    "dashboard": {
        name: "Dashboard",
        icon: IconSymbol.OpenDAW,
        hidden: true,
        content: PanelState.create({
            type: "panel",
            name: "Dashboard",
            icon: IconSymbol.OpenDAW,
            panelType: PanelType.Dashboard,
            notPopoutable: true,
            notMinimizable: true,
            constrains: {type: "flex", minSize: 0, flex: 1}
        })
    },
    // Hidden desktop route reused by the mobile dock to render Browser as a focused tool.
    "browser": {
        name: "Browser",
        icon: IconSymbol.Panel,
        hidden: true,
        content: BrowserPanel,
        // Open immediately on mobile instead of rendering a collapsed 22px header
        // and waiting for a delayed showIfAvailable call.
        touchContent: MobileBrowserPanel
    },
    "default": {
        name: "Default",
        icon: IconSymbol.Timeline,
        content: {
            type: "layout",
            orientation: "horizontal",
            contents: [
                BrowserPanel,
                {
                    type: "layout",
                    orientation: "vertical",
                    contents: [
                        TimelinePanel,
                        EditorPanel,
                        DevicesPanel
                    ],
                    constrains: {type: "flex", minSize: 0, flex: 1}
                },
                DefaultMixerPanel
            ],
            constrains: {type: "flex", minSize: 0, flex: 1}
        },
        // Mobile Timeline occupies the full work area. Browser is its own hidden
        // screen so it never steals width from the timeline or creates a split panel.
        touchContent: MobileTimelinePanel
    },
    "mixer": {
        name: "Mixer",
        icon: IconSymbol.Mixing,
        content: {
            type: "layout",
            orientation: "horizontal",
            contents: [
                BrowserPanel,
                {
                    type: "layout",
                    orientation: "vertical",
                    contents: [
                        DesktopMixerPanel,
                        DevicesPanel
                    ],
                    constrains: {type: "flex", minSize: 0, flex: 1}
                },
                AnalysisPanel
            ],
            constrains: {type: "flex", minSize: 20, flex: 1}
        },
        // Mobile presents the selected tool as a full-viewport workspace. The original
        // Timeline remains intact on the default screen; the same PanelContent/engine
        // instance is reused when switching tools.
        touchContent: MobileMixerPanel
    },
    /*"modular": {
        name: "Modular",
        icon: IconSymbol.Box,
        hidden: true,
        content: {
            type: "layout",
            orientation: "horizontal",
            contents: [
                BrowserPanel,
                {
                    type: "layout",
                    orientation: "vertical",
                    contents: [
                        ModularSystem,
                        DevicesPanel
                    ],
                    constrains: {type: "flex", minSize: 0, flex: 1}
                }
            ],
            constrains: {type: "flex", minSize: 20, flex: 1}
        }
    },*/
    "modulation": {
        name: "Modulation",
        icon: IconSymbol.Modulation,
        content: {
            type: "layout",
            orientation: "horizontal",
            contents: [
                BrowserPanel,
                {
                    type: "layout",
                    orientation: "vertical",
                    contents: [
                        PanelState.create({
                            type: "panel",
                            name: "Modulation",
                            icon: IconSymbol.Modulation,
                            panelType: PanelType.Modulation,
                            notMinimizable: true,
                            constrains: {type: "flex", minSize: 0, flex: 1}
                        }),
                        DevicesPanel
                    ],
                    constrains: {type: "flex", minSize: 0, flex: 1}
                }
            ],
            constrains: {type: "flex", minSize: 20, flex: 1}
        },
        // Mobile Devices/FX is a focused full-screen workspace, not a stacked
        // desktop split. DevicePanel remains the real OpenDAW panel.
        touchContent: MobileDevicesPanel
    },
    "piano": {
        name: "Piano Tutorial Mode",
        icon: IconSymbol.Piano,
        content: PanelState.create({
            type: "panel",
            name: "Piano Tutorial Mode",
            icon: IconSymbol.Piano,
            panelType: PanelType.MidiFall,
            constrains: {type: "flex", minSize: 0, flex: 1}
        }),
        // Mobile opens the real existing ContentEditor/Piano Roll in the full
        // viewport. Desktop continues to use the Piano Tutorial Mode.
        touchContent: MobileEditorPanel
    },
    "code": {
        name: "Code",
        icon: IconSymbol.Code,
        hidden: true,
        content: {
            type: "layout",
            orientation: "horizontal",
            contents: [
                BrowserPanel,
                {
                    type: "layout",
                    orientation: "vertical",
                    contents: [
                        PanelState.create({
                            type: "panel",
                            name: "Code Editor",
                            icon: IconSymbol.Code,
                            panelType: PanelType.CodeEditor,
                            notMinimizable: true,
                            constrains: {type: "flex", minSize: 0, flex: 1}
                        }),
                        DevicesPanel
                    ],
                    constrains: {type: "flex", minSize: 0, flex: 1}
                }
            ],
            constrains: {type: "flex", minSize: 20, flex: 1}
        }
    },
    "tap": {
        name: "Match Tempo",
        icon: IconSymbol.Time,
        content: PanelState.create({
            type: "panel",
            name: "Match Tempo",
            icon: IconSymbol.Time,
            panelType: PanelType.TapTempo,
            notMinimizable: true,
            notPopoutable: true,
            constrains: {type: "flex", minSize: 0, flex: 1}
        })
    }
} satisfies Record<string, Workspace.Screen>)

