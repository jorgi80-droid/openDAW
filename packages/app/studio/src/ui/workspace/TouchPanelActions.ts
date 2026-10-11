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

const transitionTokens = new WeakMap<StudioService, number>()

const beginTransition = (service: StudioService): number => {
    const token = (transitionTokens.get(service) ?? 0) + 1
    transitionTokens.set(service, token)
    return token
}

const isCurrentTransition = (service: StudioService, token: number): boolean =>
    transitionTokens.get(service) === token

const afterWorkspaceRebuild = (service: StudioService, token: number, callback: () => void): void => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
        if (isCurrentTransition(service, token)) {callback()}
    }))
}

const clearMaximized = (): void => {
    document.documentElement.classList.remove("opendaw-panel-maximized")
}

/**
 * Select Timeline and invalidate any delayed tool transition before rebuilding.
 * This prevents a stale Browser/Mixer callback from stealing focus after a rapid tap.
 */
export const showTouchTimeline = (service: StudioService): void => {
    beginTransition(service)
    clearMaximized()
    service.switchScreen("default")
}

/**
 * Keep one state machine for the original toolbar and footer controls. The native
 * workspace must unbind the shared Browser/tool panel before it is rebound on a
 * different screen. Transition tokens cancel stale frame callbacks on rapid taps.
 * Mobile tool screens render one original panel full-screen rather than forcing
 * Timeline and the selected tool into a narrow split view.
 */
export const toggleTouchPanel = (service: StudioService, type: PanelType): void => {
    if (!isTouchLayout()) {
        const panel = service.panelLayout.getByType(type)
        if (panel.isVisible) {panel.toggleMinimize()}
        else {service.panelLayout.showIfAvailable(type)}
        return
    }

    const token = beginTransition(service)
    const current = service.layout.screen.getValue()

    if (type === PanelType.BrowserPanel) {
        // Mobile Browser is a full-screen destination. Timeline remains available
        // as a separate dock item, and stale frame callbacks are cancelled by token.
        clearMaximized()
        if (current === "browser") {
            service.switchScreen("default")
            return
        }
        const selectBrowser = (): void => {
            if (!isCurrentTransition(service, token)) {return}
            service.switchScreen("browser")
            afterWorkspaceRebuild(service, token, () =>
                service.panelLayout.showIfAvailable(PanelType.BrowserPanel))
        }
        if (current !== "default") {
            service.switchScreen("default")
            afterWorkspaceRebuild(service, token, selectBrowser)
        } else {
            selectBrowser()
        }
        return
    }

    const destination = targetScreen(type)

    if (current === destination) {
        clearMaximized()
        service.switchScreen("default")
        return
    }

    clearMaximized()
    const selectDestination = (): void => {
        if (!isCurrentTransition(service, token)) {return}
        const browser = service.panelLayout.getByType(PanelType.BrowserPanel)
        if (browser.isVisible) {browser.toggleMinimize()}
        service.switchScreen(destination)
        afterWorkspaceRebuild(service, token, () => {
            const panel = service.panelLayout.getByType(type)
            if (!panel.isVisible) {service.panelLayout.showIfAvailable(type)}
        })
    }

    if (current !== "default") {
        service.switchScreen("default")
        afterWorkspaceRebuild(service, token, selectDestination)
    } else {
        selectDestination()
    }
}
