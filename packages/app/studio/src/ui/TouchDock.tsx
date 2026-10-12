import {createElement} from "@opendaw/lib-jsx"
import {StudioService} from "@/service/StudioService"
import {PanelType} from "@/ui/workspace/PanelType"

type Construct = {service: StudioService}

export const TouchDock = ({service}: Construct) => {
    const nextFrame = (procedure: () => void) => {
        requestAnimationFrame(() => requestAnimationFrame(procedure))
    }

    const openPanel = (type: PanelType) => {
        if (service.layout.screen.getValue() !== "default") {
            service.switchScreen("default")
            nextFrame(() => service.panelLayout.showIfAvailable(type))
        } else {
            service.panelLayout.showIfAvailable(type)
        }
    }

    const togglePanel = (type: PanelType) => {
        const panel = service.panelLayout.getByType(type)
        if (panel.isVisible) {panel.toggleMinimize()}
        else {openPanel(type)}
    }

    const button = (label: string, title: string, action: () => void, extra = "") => (
        <button type="button" className={extra} title={title} aria-label={title} onclick={action}>{label}</button>
    )

    return (
        <nav className="touch-dock" aria-label="Editor navigation">
            {button("TL", "Timeline / Arrangement", () => {
                document.documentElement.classList.remove("opendaw-editor-maximized")
                if (service.layout.screen.getValue() !== "default") {service.switchScreen("default")}
                nextFrame(() => service.panelLayout.showIfAvailable(PanelType.Timeline))
            }, "active")}
            {button("MX", "Mixer", () => togglePanel(PanelType.Mixer))}
            {button("PR", "Piano Roll / Editor", () => togglePanel(PanelType.ContentEditor))}
            {button("DV", "Devices and effects", () => togglePanel(PanelType.DevicePanel))}
            {button("BR", "Browser / Samples", () => togglePanel(PanelType.BrowserPanel))}
        </nav>
    )
}
