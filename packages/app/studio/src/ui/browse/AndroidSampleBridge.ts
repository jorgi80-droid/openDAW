import {Sample} from "@opendaw/studio-adapters"
import {StudioService} from "@/service/StudioService"

/**
 * Samples placed in /storage/emulated/0/OpenDAW show as lightweight virtual rows first.
 * Only decode and persist audio when the user previews or inserts one into a project.
 */
export const isAndroidFolderSample = (sample: Sample): boolean =>
    sample.custom?.startsWith("android-folder:") === true

export const androidFolderName = (sample: Sample): string | undefined => {
    if (!isAndroidFolderSample(sample)) return undefined
    try {
        return decodeURIComponent(sample.custom!.slice("android-folder:".length))
    } catch {
        return sample.custom!.slice("android-folder:".length)
    }
}

type NativeAudioBridge = {
    listAudioFiles(): string
    readAudioChunkBase64(name: string, offset: number, maxBytes: number): string
}

const bridge = (): NativeAudioBridge => {
    const native = (window as Window & {OpenDAWNative?: NativeAudioBridge}).OpenDAWNative
    if (native === undefined) throw new Error("OpenDAW Android folder bridge is unavailable")
    return native
}

export const importAndroidFolderSample = async (service: StudioService, sample: Sample): Promise<Sample> => {
    if (!isAndroidFolderSample(sample)) return sample
    const name = androidFolderName(sample)
    if (name === undefined) throw new Error("Invalid Android sample file name")

    const native = bridge()
    const files = JSON.parse(native.listAudioFiles()) as Array<{name: string, bytes: number}>
    const file = files.find(entry => entry.name === name)
    if (file === undefined) throw new Error(`File no longer exists in OpenDAW folder: ${name}`)
    // WebAudio decodes the full asset, so reject very large files with a helpful message on weak phones.
    const maximumBytes = 64 * 1024 * 1024
    if (file.bytes > maximumBytes) {
        throw new Error(`'${name}' is larger than 64 MiB. Convert or trim it before importing on this device.`)
    }

    const bytes = new Uint8Array(file.bytes)
    const chunkSize = 72 * 1024
    for (let offset = 0; offset < file.bytes; offset += chunkSize) {
        const encoded = native.readAudioChunkBase64(name, offset, chunkSize)
        if (encoded.length === 0) throw new Error(`Could not read '${name}' from the OpenDAW folder`)
        const binary = atob(encoded)
        const chunk = new Uint8Array(binary.length)
        for (let index = 0; index < binary.length; index++) chunk[index] = binary.charCodeAt(index)
        bytes.set(chunk, offset)
    }

    return service.sampleService.importFile({
        name,
        bpm: 0,
        origin: "import",
        arrayBuffer: bytes.buffer
    })
}
