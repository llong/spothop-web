import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util"; // Import toBlobURL

let ffmpegInstance: FFmpeg | null = null;

/**
 * Performs a pre-flight check of browser capabilities for multi-threaded FFmpeg.
 */
export const checkFFmpegCapabilities = () => {
    const isSharedArrayBufferAvailable =
        typeof window.SharedArrayBuffer !== "undefined";
    const isCrossOriginIsolated = window.crossOriginIsolated;

    console.log("[FFmpeg Capabilities Check]:");
    console.log(
        " - SharedArrayBuffer:",
        isSharedArrayBufferAvailable ? "✅ Available" : "❌ NOT Available"
    );
    console.log(
        " - Cross-Origin Isolated:",
        isCrossOriginIsolated ? "✅ Yes" : "❌ No (Check COOP/COEP headers)"
    );

    return {
        multiThreadingSupported: isSharedArrayBufferAvailable && isCrossOriginIsolated,
        isSharedArrayBufferAvailable,
        isCrossOriginIsolated,
    };
};

/**
 * Loads FFmpeg.wasm using local files from the public/ffmpeg directory
 * and initializes FFmpeg with corePath.
 */
export const loadFFmpeg = async () => {
    if (ffmpegInstance) return ffmpegInstance;

    ffmpegInstance = new FFmpeg();

    ffmpegInstance.on("log", ({ message }) => {
        console.log("[FFmpeg Log]", message);
    });

    try {
        // 1. Define the base path where your files live in /public
        const baseURL = `${window.location.origin}/ffmpeg`;

        console.log(`[loadFFmpeg] Loading core from: ${baseURL}`);

        // 2. Use toBlobURL to fetch files as blobs rather than JS imports
        await ffmpegInstance.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
            // If you are using the multi-threaded version (ffmpeg-core-mt):
            // workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
        });

        console.log("[loadFFmpeg] LOAD SUCCESSFUL");
    } catch (error) {
        console.error("[loadFFmpeg] LOAD FAILED:", error);
        ffmpegInstance = null;
        throw error;
    }

    return ffmpegInstance;
};

/**
 * Trims and optimizes a video file using FFmpeg.wasm.
 */
export const trimVideo = async (
    file: File,
    startTime: number,
    duration: number,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal // Add AbortSignal parameter
): Promise<Uint8Array> => {
    console.log("[trimVideo] Transcoding start:", file.name);

    const instance = await loadFFmpeg();
    if (!instance) throw new Error("FFmpeg engine failed to start");

    const inputName = "input.mp4";
    const outputName = "output.mp4";

    const progressHandler = ({ progress }: { progress: number }) => {
        if (onProgress) {
            const p = Math.round(progress * 100);
            onProgress(p);
        }
    };

    instance.on("progress", progressHandler);

    if (signal) {
        signal.addEventListener("abort", () => {
            console.log(
                "[trimVideo] Abort signal received. Terminating FFmpeg instance."
            );
            instance.terminate(); // Terminate the FFmpeg worker
            ffmpegInstance = null; // Ensure new instance is loaded next time
        });
    }

    try {
        if (signal?.aborted) {
            console.log("[trimVideo] Operation aborted before starting FFmpeg exec.");
            throw new DOMException("Aborted", "AbortError");
        }

        console.log("[trimVideo] Writing file to memory...");
        await instance.writeFile(inputName, await fetchFile(file));

        console.log(
            `[trimVideo] Running FFmpeg: trim from ${startTime}s for ${duration}s...`
        );

        await instance.exec([
            "-ss",
            startTime.toString(),
            "-i",
            inputName,
            "-t",
            duration.toString(),
            "-vf",
            "scale=-2:720",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-crf",
            "28",
            "-pix_fmt",
            "yuv420p",
            "-y",
            outputName,
        ]);

        console.log("[trimVideo] TRANSCODING COMPLETE. Reading output...");
        const data = await instance.readFile(outputName);
        return data as Uint8Array;
    } catch (error) {
        console.error("[trimVideo] TRANSCODING FAILED:", error);
        if (
            signal &&
            error instanceof Error &&
            error.message.includes("ffmpeg.terminate()")
        ) {
            // If FFmpeg was terminated due to abort signal, throw an AbortError
            throw new DOMException("Aborted", "AbortError");
        }
        throw error;
    } finally {
        instance.off("progress", progressHandler);
        try {
            await instance.deleteFile(inputName);
            await instance.deleteFile(outputName);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
};
