import {createElement} from "@opendaw/lib-jsx"
import {StudioService} from "@/service/StudioService"
import {PanelType} from "@/ui/workspace/PanelType"

type Construct = {service: StudioService}

export const TouchDock = ({service}: Construct) => {
    const openPanel = (screen: "default" | "mixer", type: PanelType, toggle: boolean = false) => {
        const current = service.layout.screen.getValue()
        if (current !== screen) {
            service.switchScreen(screen)
            // Let WorkspaceBuilder create the requested panel placeholder before touching its state.
            requestAnimationFrame(() => requestAnimationFrame(() => service.panelLayout.showIfAvailable(type)))
            return
        }
        const panel = service.panelLayout.getByType(type)
        if (toggle && panel.isVisible) {
            panel.toggleMinimize()
        } else {
            service.panelLayout.showIfAvailable(type)
        }
    }

    const button = (label: string, title: string, action: () => void, extra = "") => (
        <button type="button" className={extra} title={title} aria-label={title} onclick={action}>{label}</button>
    )

    return (
        <nav className="touch-dock" aria-label="OpenDAW touch shortcuts">
            {button("Timeline", "Buka Timeline / Arrangement", () =>
                openPanel("default", PanelType.Timeline, true))}
            {button("Piano Roll", "Buka atau minimalkan Piano Roll / Editor", () =>
                openPanel("default", PanelType.ContentEditor, true))}
            {button("Samples", "Buka atau minimalkan Browser sample", () =>
                openPanel("default", PanelType.BrowserPanel, true))}
            {button("Devices", "Buka atau minimalkan chain perangkat dan efek", () =>
                openPanel("default", PanelType.DevicePanel, true))}
            {button("Mixer", "Buka workspace Mixer", () => service.switchScreen("mixer"))}
            {button("Keys", "Buka keyboard piano layar sentuh", () => service.switchScreen("piano"))}
        </nav>
    )
}
