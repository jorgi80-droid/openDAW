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
const clearMaximized = (): void => {
    document.documentElement.classList.remove("opendaw-panel-maximized")
}

export const toggleTouchPanel = (service: StudioService, type: PanelType): void => {
    if (!isTouchLayout()) {
        const panel = service.panelLayout.getByType(type)
        if (panel.isVisible) {panel.toggleMinimize()}
        else {service.panelLayout.showIfAvailable(type)}
        return
    }

    const current = service.layout.screen.getValue()

    if (type === PanelType.BrowserPanel) {
        clearMaximized()
        if (current !== "default") {
            service.switchScreen("default")
            requestAnimationFrame(() => requestAnimationFrame(() => openBrowserInDefault(service)))
        } else {
            openBrowserInDefault(service)
        }
        return
    }

    const destination = targetScreen(type)

    // Toggle closed if the selected tool is already active. Test the actual screen
    // first rather than PanelContent.isVisible: the latter can point at a stale
    // placeholder while a workspace screen is being swapped.
    if (current === destination) {
        clearMaximized()
        const browser = service.panelLayout.getByType(PanelType.BrowserPanel)
        if (browser.isVisible) {browser.toggleMinimize()}
        service.switchScreen("default")
        return
    }

    clearMaximized()
    const selectDestination = () => {
        // Browser and the tool use the same PanelContent instance, so close the
        // overlay before rebuilding another workspace which binds that panel.
        const browser = service.panelLayout.getByType(PanelType.BrowserPanel)
        if (browser.isVisible) {browser.toggleMinimize()}
        service.switchScreen(destination)
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const panel = service.panelLayout.getByType(type)
            if (!panel.isVisible) {service.panelLayout.showIfAvailable(type)}
        }))
    }

    if (current !== "default") {
        service.switchScreen("default")
        requestAnimationFrame(() => requestAnimationFrame(selectDestination))
    } else {
        selectDestination()
    }
}
