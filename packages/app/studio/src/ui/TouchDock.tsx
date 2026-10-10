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
            {button("Timeline", "Kembali ke workspace Timeline / Arrangement", () => {
                document.documentElement.classList.remove("opendaw-editor-maximized")
                if (service.layout.screen.getValue() !== "default") {
                    service.switchScreen("default")
                }
                requestAnimationFrame(() => requestAnimationFrame(() =>
                    service.panelLayout.showIfAvailable(PanelType.Timeline)))
            })}
            {button("Piano Roll", "Perbesar atau kembalikan Editor tanpa meninggalkan Timeline", () => {
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
                } else {
                    root.classList.add("opendaw-editor-maximized")
                }
            }, "piano-roll-action")}
            {button("Samples", "Buka Browser sample lokal", () =>
                openPanel("default", PanelType.BrowserPanel))}
            {button("Devices", "Buka chain perangkat dan efek", () =>
                openPanel("default", PanelType.DevicePanel))}
            {button("Mixer", "Tampilkan atau sembunyikan panel Mixer di workspace Timeline", () => {
                const mixer = service.panelLayout.getByType(PanelType.Mixer)
                if (mixer.isVisible) {mixer.toggleMinimize()}
                else {service.panelLayout.showIfAvailable(PanelType.Mixer)}
            })}
            {button("FX", "Tampilkan atau sembunyikan panel Devices / efek", () => {
                const devices = service.panelLayout.getByType(PanelType.DevicePanel)
                if (devices.isVisible) {devices.toggleMinimize()}
                else {service.panelLayout.showIfAvailable(PanelType.DevicePanel)}
            })}
        </nav>
    )
}
