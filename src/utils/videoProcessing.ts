import {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Conversion,
    Input,
    Mp4OutputFormat,
    Output,
    QUALITY_MEDIUM,
} from "mediabunny";

/** Trimmed videos are downscaled to this height (never upscaled). */
const MAX_HEIGHT = 720;

/** Trimming uses the browser's WebCodecs (hardware video decoder/encoder). */
export const isVideoTrimSupported = () =>
    typeof VideoEncoder !== "undefined" && typeof VideoDecoder !== "undefined";

const openFile = (file: File) => new Input({ source: new BlobSource(file), formats: ALL_FORMATS });

/**
 * Cuts `file` to [start, end] seconds and re-encodes it as a ≤720p H.264 MP4.
 * Aborting `signal` rejects with a `ConversionCanceledError`.
 */
export const trimVideo = async (
    file: File,
    start: number,
    end: number,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal
): Promise<Blob> => {
    const input = openFile(file);
    try {
        const target = new BufferTarget();
        const conversion = await Conversion.init({
            input,
            output: new Output({ format: new Mp4OutputFormat(), target }),
            trim: { start, end },
            video: (track) => ({
                codec: "avc",
                quality: QUALITY_MEDIUM,
                height: Math.min(track.displayHeight, MAX_HEIGHT),
            }),
        });
        if (!conversion.isValid) {
            throw new Error("This video can't be processed on this device.");
        }

        conversion.onProgress = (progress) => onProgress?.(Math.round(progress * 100));
        signal?.addEventListener("abort", () => void conversion.cancel(), { once: true });

        await conversion.execute();
        return new Blob([target.buffer!], { type: "video/mp4" });
    } finally {
        input.dispose();
    }
};

const once = (target: EventTarget, event: string) =>
    new Promise<void>((resolve) => target.addEventListener(event, () => resolve(), { once: true }));

/** Grabs the frame at the middle of the video as a JPEG file, using the browser's own video playback. */
export const captureVideoThumbnail = async (file: File): Promise<File> => {
    const url = URL.createObjectURL(file);
    try {
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.src = url;

        await Promise.race([
            once(video, "loadedmetadata"),
            once(video, "error").then(() => Promise.reject(new Error("Failed to load video for thumbnail"))),
        ]);
        video.currentTime = video.duration / 2;
        await once(video, "seeked");

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
        if (!blob) throw new Error("Failed to generate thumbnail");
        return new File([blob], `thumb_${file.name.split(".")[0]}.jpg`, { type: "image/jpeg" });
    } finally {
        URL.revokeObjectURL(url);
    }
};
