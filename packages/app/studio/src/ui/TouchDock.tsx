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
                openPanel("default", PanelType.Timeline))}
            {button("Piano Roll", "Maksimalkan atau minimalkan Piano Roll / Editor", () => {
                const root = document.documentElement
                const maximized = root.classList.contains("opendaw-editor-maximized")
                if (service.layout.screen.getValue() !== "default") {
                    service.switchScreen("default")
                    requestAnimationFrame(() => requestAnimationFrame(() => {
                        service.panelLayout.showIfAvailable(PanelType.ContentEditor)
                        root.classList.add("opendaw-editor-maximized")
                    }))
                    return
                }
                const editor = service.panelLayout.getByType(PanelType.ContentEditor)
                if (!editor.isVisible) {
                    service.panelLayout.showIfAvailable(PanelType.ContentEditor)
                    root.classList.add("opendaw-editor-maximized")
                } else if (maximized) {
                    root.classList.remove("opendaw-editor-maximized")
                    editor.toggleMinimize()
                } else {
                    root.classList.add("opendaw-editor-maximized")
                }
            }, "piano-roll-action")}
            {button("Samples", "Buka Browser sample lokal", () =>
                openPanel("default", PanelType.BrowserPanel))}
            {button("Devices", "Buka chain perangkat dan efek", () =>
                openPanel("default", PanelType.DevicePanel))}
            {button("Mixer", "Buka workspace Mixer", () => service.switchScreen("mixer"))}
            {button("Keys", "Buka keyboard piano layar sentuh", () => service.switchScreen("piano"))}
        </nav>
    )
}
