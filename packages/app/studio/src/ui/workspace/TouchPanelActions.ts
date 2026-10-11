import {StudioService} from "@/service/StudioService"
import {PanelType} from "@/ui/workspace/PanelType"

const isTouchLayout = (): boolean =>
    (document.documentElement.classList.contains("midiable-mobile") || window.matchMedia("(max-width: 900px), (pointer: coarse)").matches)

const setFlex = (service: StudioService, type: PanelType, flex: number): void => {
    service.panelLayout.getByType(type).panelState.ifSome(state => {
        if (state.constrains.type === "flex") {state.constrains.flex = flex}
    })
}

const resetTouchFlex = (service: StudioService): void => {
    setFlex(service, PanelType.Timeline, 2)
    setFlex(service, PanelType.Mixer, 3)
    setFlex(service, PanelType.ContentEditor, 1)
    setFlex(service, PanelType.DevicePanel, 1)
    setFlex(service, PanelType.BrowserPanel, 0.25)
}

/**
 * Shared entry point for mobile workspace tools. Only one tool is expanded at
 * once; the original native panel content stays mounted in its regular panel
 * slot, so instrument/effect/editor state is not replaced by a fake mobile UI.
 */
export const toggleTouchPanel = (service: StudioService, type: PanelType): void => {
    const panel = service.panelLayout.getByType(type)
    if (!isTouchLayout()) {
        if (panel.isVisible) {panel.toggleMinimize()}
        else {service.panelLayout.showIfAvailable(type)}
        return
    }

    if (panel.isVisible) {
        resetTouchFlex(service)
        panel.toggleMinimize()
        return
    }

    const tools = [PanelType.BrowserPanel, PanelType.ContentEditor, PanelType.DevicePanel, PanelType.Mixer]
    tools.filter(other => other !== type).forEach(other => {
        const sibling = service.panelLayout.getByType(other)
        if (sibling.isVisible) {sibling.toggleMinimize()}
    })

    resetTouchFlex(service)
    service.panelLayout.showIfAvailable(type)
    // Set flex on the live panel state after it is mounted in the default layout.
    // Browser is a temporary overlay; editing tools expand to a usable work area
    // while preserving a small Timeline strip.
    if (type !== PanelType.BrowserPanel) {
        setFlex(service, PanelType.Timeline, 0.25)
        setFlex(service, type, 4)
    }
}
