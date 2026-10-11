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
    constrains: {type: "flex", minSize: 20, flex: 1}
})
const MobileMixerPanel = PanelState.create({
    type: "panel",
    name: "Mixer",
    icon: IconSymbol.Mixing,
    panelType: PanelType.Mixer,
    notMinimizable: true,
    constrains: {type: "flex", minSize: 0, flex: 3}
})
const MobileAnalysisPanel = PanelState.create({
    type: "panel",
    name: "Analysis",
    icon: IconSymbol.Charts,
    panelType: PanelType.Analysis,
    constrains: {type: "flex", minSize: 0, maxSize: 200, flex: 0.5},
    minimized: true
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
        // Touch layout keeps the original Timeline as the main work surface.
        // The Mixer opens through its existing toolbar screen, rather than
        // permanently taking width from the arrangement on narrow devices.
        touchContent: {
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
                }
            ],
            constrains: {type: "flex", minSize: 0, flex: 1}
        }
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
        // Mobile mixer is a full-width vertical workspace. Mixer, Editor,
        // Devices, and Analysis remain the same native panel implementations,
        // with drag-resizers placed between each panel by WorkspaceBuilder.
        touchContent: {
            type: "layout",
            orientation: "horizontal",
            contents: [
                BrowserPanel,
                {
                    type: "layout",
                    orientation: "vertical",
                    contents: [
                        MobileMixerPanel,
                        EditorPanel,
                        DevicesPanel,
                        MobileAnalysisPanel
                    ],
                    constrains: {type: "flex", minSize: 0, flex: 1}
                }
            ],
            constrains: {type: "flex", minSize: 0, flex: 1}
        }
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
        }
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
        })
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

