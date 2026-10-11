import {createElement} from "@opendaw/lib-jsx"
import {Html} from "@opendaw/lib-dom"

/**
 * Legacy export retained for import compatibility.
 * The app uses the original Footer shortcuts as its only mobile control row.
 */
export const TouchDock = () => (
    <nav className="touch-dock" aria-hidden="true"/>
)
