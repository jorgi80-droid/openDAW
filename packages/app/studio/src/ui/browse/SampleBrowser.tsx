import css from "./SampleBrowser.sass?inline"
import {Arrays, DefaultObservableValue, Lifecycle} from "@opendaw/lib-std"
import {createElement} from "@opendaw/lib-jsx"
import {Html} from "@opendaw/lib-dom"
import {FactoryCatalog, SampleStorage} from "@opendaw/studio-core"
import {OpenSampleAPI} from "@/opendaw-api"
import {StudioService} from "@/service/StudioService.ts"
import {SampleView} from "@/ui/browse/SampleView"
import {AssetLocation} from "@/ui/browse/AssetLocation"
import {HTMLSelection} from "@/ui/HTMLSelection"
import {SampleSelection} from "@/ui/browse/SampleSelection"
import {NumberInput} from "@/ui/components/NumberInput"
import {ResourceBrowser} from "@/ui/browse/ResourceBrowser"
import {Sample} from "@opendaw/studio-adapters"
import {SampleIndex, SampleIndexFolder} from "@/opendaw-api/SampleIndex"
import {ResourceBrowserConfig} from "@/ui/browse/ResourceBrowserConfig"
import {ResourceFolder} from "@/ui/browse/ResourceFolder"
import {LocalTree} from "@/ui/browse/LocalTree"
import {UUID} from "@opendaw/lib-std"
import {isAndroidFolderSample} from "@/ui/browse/AndroidSampleBridge"

const className = Html.adoptStyleSheet(css, "Samples")

const toResourceFolder = (folder: SampleIndexFolder): ResourceFolder<Sample> => ({
    name: folder.name,
    folders: folder.folders?.map(toResourceFolder) ?? [],
    items: folder.samples?.map(SampleIndex.asSample) ?? []
})

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
    background?: boolean
    fontSize?: string // em
}

const location = new DefaultObservableValue((window as Window & {OpenDAWNative?: unknown}).OpenDAWNative
    ? AssetLocation.Local : AssetLocation.OpenDAW)
const expandedKeys = new Set<string>()

export const SampleBrowser = ({lifecycle, service, background, fontSize}: Construct) => {
    const linearVolume = service.samplePlayback.linearVolume
    const config: ResourceBrowserConfig<Sample> = {
        name: "samples",
        headers: [
            {label: "Name"},
            {label: "Bpm", align: "right"},
            {label: "Sec", align: "right"}
        ],
        // Structure comes from the published index and nowhere else.
        fetchOnline: async () => {
            if ((window as Window & {OpenDAWNative?: unknown}).OpenDAWNative) {
                return {name: "", folders: [], items: []}
            }
            return {
                name: "",
                folders: (await OpenSampleAPI.get().tree()).folders.map(toResourceFolder),
                items: []
            }
        },
        fetchLocal: async () => {
            const native = (window as Window & {
                OpenDAWNative?: {listAudioFiles(): string}
            }).OpenDAWNative
            // Never request the cloud catalog in the Android build. The local OPFS sample
            // database and public OpenDAW folder are two separate stores.
            const catalog = await FactoryCatalog.get().samples().catch(() => [])
            const stored = await SampleStorage.get().list()
            const virtual: Sample[] = []
            if (native) {
                try {
                    const files = JSON.parse(native.listAudioFiles()) as Array<{name: string, bytes?: number}>
                    for (const file of files) {
                        const lower = file.name.toLowerCase()
                        if (!/\.(wav|wave|mp3|ogg|oga|opus|flac|m4a|aac|aiff|aif|aifc|webm|weba)$/.test(lower)) continue
                        // UUID is a temporary selection identity. Import replaces it with the
                        // actual storage UUID before preview or track creation.
                        virtual.push({
                            uuid: UUID.toString(UUID.generate()),
                            name: file.name,
                            bpm: 0,
                            duration: 0,
                            sample_rate: 0,
                            origin: "import",
                            custom: `android-folder:${encodeURIComponent(file.name)}`
                        })
                    }
                } catch (error) {
                    console.warn("Could not index audio files in the OpenDAW folder", error)
                }
            }
            const saved = Arrays.subtract(stored, catalog, ({uuid: a}, {uuid: b}) => a === b)
            // Bundle samples are part of the local offline library. Avoid network access and
            // combine them with stored imports and virtual files from the Android folder.
            const visible = [...catalog, ...saved]
            const storedNames = new Set(visible.map(sample => sample.name.toLowerCase()))
            return [...visible, ...virtual.filter(sample => !storedNames.has(sample.name.toLowerCase()))]
        },
        fetchLocalTree: () => LocalTree.load(SampleStorage.get().structure, (sample: Sample) => sample.uuid),
        expandedKeys,
        dragType: "sample",
        renderEntry: ({
                          lifecycle: entryLifecycle, service: entryService, selection, item, location: loc, tree,
                          refresh
                      }) => (
            <SampleView
                lifecycle={entryLifecycle}
                service={entryService}
                sampleSelection={selection as SampleSelection}
                playback={entryService.samplePlayback}
                sample={item}
                location={loc}
                tree={tree}
                refresh={refresh}
            />
        ),
        resolveEntryName: (sample: Sample) => sample.name,
        resolveEntryUuid: (sample: Sample) => sample.uuid,
        createSelection: (svc: StudioService, htmlSelection: HTMLSelection) => new SampleSelection(svc, htmlSelection),
        importSignal: "import-sample",
        importFiles: files => service.sampleService.importFiles(files),
        footer: ({lifecycle: footerLifecycle}) => (
            <div className="footer">
                <label>Volume:</label>
                <NumberInput lifecycle={footerLifecycle} maxChars={3} step={1} model={linearVolume}/>
                <label>dB</label>
            </div>
        ),
        onReload: () => service.samplePlayback.eject(),
        onTerminate: () => service.samplePlayback.eject()
    }
    return (
        <ResourceBrowser
            lifecycle={lifecycle}
            service={service}
            config={config}
            className={className}
            background={background}
            fontSize={fontSize}
            location={location}
        />
    )
}