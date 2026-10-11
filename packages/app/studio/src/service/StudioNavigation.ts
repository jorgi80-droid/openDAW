import {DefaultObservableValue, EmptyExec, isDefined, Nullable, Option} from "@opendaw/lib-std"
import {RouteLocation} from "@opendaw/lib-jsx"
import {Workspace} from "@/ui/workspace/Workspace.ts"
import {ProjectProfileService} from "@/service/ProjectProfileService"
import {ProjectEnv} from "@opendaw/studio-core"

// Deep links that open a project are consumed: the back button must not land on them again and re-open it.
const ConsumedRoutes: ReadonlyArray<string> = ["/open-bundle", "/open-project", "/join"]

export class StudioNavigation {
    readonly #screen: DefaultObservableValue<Nullable<Workspace.ScreenKeys>>
    readonly #profiles: ProjectProfileService

    #confirming: boolean = false

    constructor(screen: DefaultObservableValue<Nullable<Workspace.ScreenKeys>>, profiles: ProjectProfileService, _env: ProjectEnv) {
        this.#screen = screen
        this.#profiles = profiles
        RouteLocation.get().catchupAndSubscribe(({path}) => {
            const hasProfile = this.#profiles.getValue().nonEmpty()
            // Preserve the original OpenDAW route contract: a fresh launch opens Dashboard.
            // A project is created only when the user explicitly chooses New Project or opens a file.
            if (path === "/" && hasProfile) {
                this.closeProject().then(EmptyExec)
            } else if (path === "/create" && !hasProfile) {
                RouteLocation.get().replaceWith("/")
            }
        })
    }

    switchScreen(key: Nullable<Workspace.ScreenKeys>): void {
        if (key === "dashboard" || (isDefined(key) && this.#profiles.getValue().isEmpty())) {
            this.closeProject().then(EmptyExec)
        } else {
            this.#screen.setValue(key)
            if (isDefined(key)) {RouteLocation.get().navigateTo("/create")}
        }
    }

    async closeProject(): Promise<void> {
        if (this.#profiles.getValue().isEmpty()) {
            this.#screen.setValue("dashboard")
            RouteLocation.get().navigateTo("/")
            return
        }
        if (this.#confirming) {return}
        this.#confirming = true
        const approved = await this.#profiles.approveLosingChanges()
        this.#confirming = false
        if (approved) {
            this.#profiles.setValue(Option.None)
        } else {
            RouteLocation.get().navigateTo("/create")
        }
    }

    onProjectOpened(): void {
        this.#screen.setValue("default")
        const route = RouteLocation.get()
        if (ConsumedRoutes.some(prefix => route.path.startsWith(prefix))) {
            route.replaceWith("/create")
        } else {
            route.navigateTo("/create")
        }
    }

    onProjectClosed(): void {
        this.#screen.setValue("dashboard")
        const route = RouteLocation.get()
        if (route.path === "/create") {route.replaceWith("/")}
    }
}
