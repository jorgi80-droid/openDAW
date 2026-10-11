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
        case PanelType.BrowserPanel:
            return "browser"
        default:
            return "default"
    }
}

/**
 * Mobile keeps the original Timeline as the default workspace and opens each
 * tool in its own full-screen workspace. Each workspace reuses the existing
 * PanelContent instance so editing state and the engine/project graph are not cloned.
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
        // The browser is a full-screen destination on mobile; Timeline remains
        // available as a separate dock item. Desktop keeps the panel-toggle path.
        if (current === "browser") {
            service.switchScreen("default")
        } else {
            service.switchScreen("browser")
            requestAnimationFrame(() => requestAnimationFrame(() =>
                service.panelLayout.showIfAvailable(PanelType.BrowserPanel)))
        }
        return
    }

    const destination = targetScreen(type)

    // Toggle closed if the selected tool is already active. Test the actual screen
    // first rather than PanelContent.isVisible: the latter can point at a stale
    // placeholder while a workspace screen is being swapped.
    if (current === destination) {
        const browser = service.panelLayout.getByType(PanelType.BrowserPanel)
        if (browser.isVisible) {browser.toggleMinimize()}
        service.switchScreen("default")
        return
    }

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
