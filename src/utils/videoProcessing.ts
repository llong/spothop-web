import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

/**
 * Performs a pre-flight check of browser capabilities for multi-threaded FFmpeg.
 */
export const checkFFmpegCapabilities = () => {
    const isSharedArrayBufferAvailable = typeof window.SharedArrayBuffer !== 'undefined';
    const isCrossOriginIsolated = window.crossOriginIsolated;

    console.log('[FFmpeg Capabilities Check]:');
    console.log(' - SharedArrayBuffer:', isSharedArrayBufferAvailable ? '✅ Available' : '❌ NOT Available');
    console.log(' - Cross-Origin Isolated:', isCrossOriginIsolated ? '✅ Yes' : '❌ No (Check COOP/COEP headers)');

    return {
        multiThreadingSupported: isSharedArrayBufferAvailable && isCrossOriginIsolated,
        isSharedArrayBufferAvailable,
        isCrossOriginIsolated
    };
};

/**
 * Loads FFmpeg.wasm using robust CDN builds (UMD) to bypass SSL/worker issues.
 */
export const loadFFmpeg = async () => {
    console.log('[loadFFmpeg] Starting CDN load...');

    if (ffmpegInstance) return ffmpegInstance;

    const { multiThreadingSupported } = checkFFmpegCapabilities();

    ffmpegInstance = new FFmpeg();

    ffmpegInstance.on('log', ({ message }: { message: string }) => {
        console.log('[FFmpeg Log]', message);
    });

    try {
        // We use the UMD build from unpkg as it's more resilient to local HTTPS/Worker issues
        const baseURL = multiThreadingSupported
            ? 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd'
            : 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

        console.log(`[loadFFmpeg] Loading ${multiThreadingSupported ? 'MULTI-threaded' : 'SINGLE-threaded'} core from:`, baseURL);

        await ffmpegInstance.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: multiThreadingSupported
                ? await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
                : undefined,
        });

        console.log('[loadFFmpeg] LOAD SUCCESSFUL');
    } catch (error) {
        console.error('[loadFFmpeg] LOAD FAILED:', error);
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
    onProgress?: (progress: number) => void
): Promise<Uint8Array> => {
    console.log('[trimVideo] Transcoding start:', file.name);

    const instance = await loadFFmpeg();
    if (!instance) throw new Error("FFmpeg engine failed to start");

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    const progressHandler = ({ progress }: { progress: number }) => {
        if (onProgress) {
            const p = Math.round(progress * 100);
            console.log(`[trimVideo] Progress: ${p}%`);
            onProgress(p);
        }
    };

    instance.on('progress', progressHandler);

    try {
        console.log('[trimVideo] Writing file to memory...');
        await instance.writeFile(inputName, await fetchFile(file));

        console.log(`[trimVideo] Running FFmpeg: trim from ${startTime}s for ${duration}s...`);

        await instance.exec([
            '-ss', startTime.toString(),
            '-i', inputName,
            '-t', duration.toString(),
            '-vf', 'scale=-2:720',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '28',
            '-pix_fmt', 'yuv420p',
            '-y',
            outputName
        ]);

        console.log('[trimVideo] TRANSCODING COMPLETE. Reading output...');
        const data = await instance.readFile(outputName);
        return data as Uint8Array;

    } catch (error) {
        console.error("[trimVideo] TRANSCODING FAILED:", error);
        throw error;
    } finally {
        instance.off('progress', progressHandler);
        try {
            await instance.deleteFile(inputName);
            await instance.deleteFile(outputName);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
};
