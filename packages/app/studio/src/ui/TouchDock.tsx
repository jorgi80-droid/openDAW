import {createElement} from "@opendaw/lib-jsx"
import {StudioService} from "@/service/StudioService"
import {PanelType} from "@/ui/workspace/PanelType"
import {Html} from "@opendaw/lib-dom"
import {IconSymbol} from "@opendaw/studio-enums"
import {Icon} from "@/ui/components/Icon"

type Construct = {service: StudioService}

export const TouchDock = ({service}: Construct) => {
    const isTouchLayout = () => window.matchMedia("(max-width: 900px), (pointer: coarse)").matches
    const nextFrame = (procedure: () => void) => requestAnimationFrame(() => requestAnimationFrame(procedure))
    const showPanel = (type: PanelType) => {
        const panel = service.panelLayout.getByType(type)
        if (panel.isVisible) {
            panel.toggleMinimize()
            return
        }
        // Mobile uses a single contextual tool surface. Close the current
        // tool only after opening the requested one so native PanelContent
        // never has two active gesture surfaces fighting for the same viewport.
        if (isTouchLayout()) {
            const exclusive: PanelType[] = [PanelType.ContentEditor, PanelType.DevicePanel, PanelType.BrowserPanel]
            exclusive.filter(other => other !== type).forEach(other => {
                const sibling = service.panelLayout.getByType(other)
                if (sibling.isVisible) {sibling.toggleMinimize()}
            })
        }
        service.panelLayout.showIfAvailable(type)
    }
    const button = (label: string, title: string, symbol: IconSymbol, type: PanelType) => (
        <button type="button" className="touch-dock-button" title={title} aria-label={title}
                onclick={() => {
                    if (service.layout.screen.getValue() !== "default") {
                        service.switchScreen("default")
                        nextFrame(() => showPanel(type))
                    } else {
                        showPanel(type)
                    }
                }}>
            <Icon symbol={symbol}/><span>{label}</span>
        </button>
    )
    return (
        <nav className={Html.buildClassList("touch-dock", isTouchLayout() && "touch-dock-mobile")}
             aria-label="OpenDAW panels">
            {button("Browser", "Open or close sample browser", IconSymbol.Panel, PanelType.BrowserPanel)}
            {button("Editor", "Open or close Piano Roll editor", IconSymbol.Pencil, PanelType.ContentEditor)}
            {button("Devices", "Open or close instruments and effects", IconSymbol.Flask, PanelType.DevicePanel)}
        </nav>
    )
}
