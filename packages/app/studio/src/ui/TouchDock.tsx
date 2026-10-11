import {createElement} from "@opendaw/lib-jsx"
import {StudioService} from "@/service/StudioService"
import {PanelType} from "@/ui/workspace/PanelType"

type Construct = {service: StudioService}

export const TouchDock = ({service}: Construct) => {
    const nextFrame = (procedure: () => void) => {
        requestAnimationFrame(() => requestAnimationFrame(procedure))
    }

    const openPanel = (screen: "default" | "mixer", type: PanelType) => {
        if (service.layout.screen.getValue() !== screen) {
            service.switchScreen(screen)
            nextFrame(() => service.panelLayout.showIfAvailable(type))
        } else {
            service.panelLayout.showIfAvailable(type)
        }
    }

    const togglePanel = (type: PanelType) => {
        const panel = service.panelLayout.getByType(type)
        if (panel.isVisible) {panel.toggleMinimize()}
        else {service.panelLayout.showIfAvailable(type)}
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
                nextFrame(() => service.panelLayout.showIfAvailable(PanelType.Timeline))
            })}
            {button("Piano Roll", "Buka atau pulihkan Editor pada workspace Timeline", () => {
                openPanel("default", PanelType.ContentEditor)
            }, "piano-roll-action")}
            {button("Samples", "Buka Browser sample", () => openPanel("default", PanelType.BrowserPanel))}
            {button("Devices", "Buka perangkat dan efek", () => openPanel("default", PanelType.DevicePanel))}
            {button("Mixer", "Buka Mixer di workspace Timeline", () => {
                if (service.layout.screen.getValue() !== "default") {
                    service.switchScreen("default")
                    nextFrame(() => service.panelLayout.showIfAvailable(PanelType.Mixer))
                } else {togglePanel(PanelType.Mixer)}
            })}
            {button("FX", "Buka atau tutup panel Devices / efek", () => togglePanel(PanelType.DevicePanel))}
        </nav>
    )
}
