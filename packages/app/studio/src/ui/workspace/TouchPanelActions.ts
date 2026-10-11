import {StudioService} from "@/service/StudioService"
import {PanelType} from "@/ui/workspace/PanelType"
import {isTouchLayout} from "@/ui/workspace/TouchLayout"


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
    if (!isTouchLayout()) {
        const panel = service.panelLayout.getByType(type)
        if (panel.isVisible) {panel.toggleMinimize()}
        else {service.panelLayout.showIfAvailable(type)}
        return
    }

    // All mobile tools live in the default touch workspace. A toolbar action
    // from Mixer/Piano/Modulation screens must first return to that workspace,
    // then operate on its currently bound native PanelState. Otherwise actions
    // can hit a non-minimizable desktop Mixer state or a stale placeholder.
    const toggleInDefaultWorkspace = () => {
        const panel = service.panelLayout.getByType(type)
        if (panel.isVisible) {
            panel.toggleMinimize()
            resetTouchFlex(service)
            return
        }

        const tools = [PanelType.BrowserPanel, PanelType.ContentEditor, PanelType.DevicePanel, PanelType.Mixer]
        tools.filter(other => other !== type).forEach(other => {
            const sibling = service.panelLayout.getByType(other)
            if (sibling.isVisible) {sibling.toggleMinimize()}
        })

        resetTouchFlex(service)
        service.panelLayout.showIfAvailable(type)
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (!service.panelLayout.getByType(type).isVisible) {return}
            if (type !== PanelType.BrowserPanel) {
                setFlex(service, PanelType.Timeline, 0.25)
                setFlex(service, type, 4)
            }
        }))
    }

    if (service.layout.screen.getValue() !== "default") {
        service.switchScreen("default")
        requestAnimationFrame(() => requestAnimationFrame(toggleInDefaultWorkspace))
    } else {
        toggleInDefaultWorkspace()
    }
}
