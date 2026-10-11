import {Nullable, ObservableValue} from "@opendaw/lib-std"
import {EngineFacade} from "@opendaw/studio-core"
import {StudioService} from "@/service/StudioService"
import {PanelType} from "@/ui/workspace/PanelType"
import {Workspace} from "@/ui/workspace/Workspace"
import {toggleTouchPanel} from "@/ui/workspace/TouchPanelActions"

/**
 * Presentation-facing contract for the mobile studio shell.
 *
 * The mobile dock should select destinations and observe transport state
 * through this port, not manipulate workspace panel instances directly.
 * Existing studio panels still use StudioService while they are migrated
 * incrementally; this port is the first stable seam for the replacement shell.
 */
export type MobileStudioDestination = "timeline" | "browser" | "mixer" | "editor" | "devices"

export interface MobileStudioPort {
    readonly activeScreen: ObservableValue<Nullable<Workspace.ScreenKeys>>
    readonly transport: Pick<EngineFacade, "play" | "stop" | "isPlaying" | "isRecording" | "position" | "bpm">
    navigate(destination: MobileStudioDestination): void
}

export const createMobileStudioPort = (service: StudioService): MobileStudioPort => ({
    get activeScreen() { return service.layout.screen },
    transport: service.engine,
    navigate: (destination: MobileStudioDestination) => {
        switch (destination) {
            case "timeline":
                service.switchScreen("default")
                return
            case "browser":
                toggleTouchPanel(service, PanelType.BrowserPanel)
                return
            case "mixer":
                toggleTouchPanel(service, PanelType.Mixer)
                return
            case "editor":
                toggleTouchPanel(service, PanelType.ContentEditor)
                return
            case "devices":
                toggleTouchPanel(service, PanelType.DevicePanel)
                return
        }
    }
})
