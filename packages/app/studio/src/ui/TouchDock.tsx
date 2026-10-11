// The former bottom touch dock is intentionally kept as a small compatibility
// component, but it no longer renders a second row of controls. Mobile panel
// toggles are exposed in the native status footer so the workspace retains height.
import {createElement} from "@opendaw/lib-jsx"
import {StudioService} from "@/service/StudioService"

type Construct = {service: StudioService}

export const TouchDock = (_: Construct) => (
    <nav className="touch-dock-removed" aria-label="OpenDAW touch shortcuts" aria-hidden="true"/>
)
