import {StudioService} from "@/service/StudioService"
import {PanelType} from "@/ui/workspace/PanelType"
import {Workspace} from "@/ui/workspace/Workspace"
import {isTouchLayout} from "@/ui/workspace/TouchLayout"

const targetScreen = (type: PanelType): Workspace.ScreenKeys => {
    switch (type) {
        case PanelType.Mixer:
            return "mixer"
        case PanelType.ContentEditor:
            return "piano"
        case PanelType.DevicePanel:
            return "modulation"
        default:
            return "default"
    }
}

const openBrowserInDefault = (service: StudioService): void => {
    const browser = service.panelLayout.getByType(PanelType.BrowserPanel)
    if (browser.isVisible) {
        browser.toggleMinimize()
    } else {
        service.panelLayout.showIfAvailable(PanelType.BrowserPanel)
    }
}

/**
 * Mobile keeps the original Timeline as the default workspace and opens one
 * native tool in its own existing screen variant. Every tool screen contains
 * exactly [Timeline, selected panel], so the native PanelResizer always works
 * on the two visible panels instead of skipping over minimized sibling panels.
 */
export const toggleTouchPanel = (service: StudioService, type: PanelType): void => {
    if (!isTouchLayout()) {
        const panel = service.panelLayout.getByType(type)
        if (panel.isVisible) {panel.toggleMinimize()}
        else {service.panelLayout.showIfAvailable(type)}
        return
    }

    const current = service.layout.screen.getValue()

    if (type === PanelType.BrowserPanel) {
        if (current !== "default") {
            // A browser opened over a tool screen would cover the native panel.
            service.switchScreen("default")
            requestAnimationFrame(() => requestAnimationFrame(() => openBrowserInDefault(service)))
        } else {
            openBrowserInDefault(service)
        }
        return
    }

    const destination = targetScreen(type)
    if (current === destination) {
        const panel = service.panelLayout.getByType(type)
        if (panel.isVisible) {
            // Tapping the active tool shortcut collapses its screen back to the
            // arrangement without destroying the underlying project or editor state.
            const browser = service.panelLayout.getByType(PanelType.BrowserPanel)
            if (browser.isVisible) {browser.toggleMinimize()}
            service.switchScreen("default")
        } else {
            // The user may have minimized the panel using its own header. Restore
            // it in-place rather than changing screens or creating another panel.
            service.panelLayout.showIfAvailable(type)
        }
        return
    }

    // Do not leave the Browser overlay above a newly selected tool.
    const browser = service.panelLayout.getByType(PanelType.BrowserPanel)
    if (browser.isVisible) {browser.toggleMinimize()}
    service.switchScreen(destination)
    requestAnimationFrame(() => requestAnimationFrame(() => {
        const panel = service.panelLayout.getByType(type)
        if (!panel.isVisible) {service.panelLayout.showIfAvailable(type)}
    }))
}
