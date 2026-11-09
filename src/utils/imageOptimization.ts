/**
 * Returns the image URL.
 * (Supabase Image Transformation removed as it is a paid feature)
 * 
 * @param url The image URL
 * @returns The image URL
 */
export function getOptimizedImageUrl(url: string | null | undefined): string {
    if (!url) return '';

    return url;
}

/**
 * Generates a unique filename for an image based on user ID and timestamp.
 */
export function generateImageFilename(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${userId}_${timestamp}_${random}.jpg`;
}

/**
 * Encodes a canvas as WebP, or as JPEG where the browser can't: Safari's toBlob silently returns a PNG
 * when asked for WebP, which is large and not accepted by the storage buckets.
 */
export async function canvasToImageBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    for (const type of ['image/webp', 'image/jpeg']) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
        if (blob?.type === type) return blob;
    }
    throw new Error('Canvas to Blob failed');
}

/** File extension for an image made by canvasToImageBlob. */
export const imageExtension = (blob: Blob) => (blob.type === 'image/webp' ? 'webp' : 'jpg');

async function loadImage(source: Blob): Promise<HTMLImageElement> {
    const img = new Image();
    const url = URL.createObjectURL(source);
    try {
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Could not read the image'));
            img.src = url;
        });
    } finally {
        URL.revokeObjectURL(url);
    }
    return img;
}

/**
 * Downscales an image, keeping its aspect ratio: landscape images are limited by maxWidth,
 * portrait images by maxHeight. Never upscales.
 */
async function resizeImage(file: Blob, maxWidth: number, maxHeight: number): Promise<Blob> {
    const img = await loadImage(file);
    const scale = Math.min(1, img.width > img.height ? maxWidth / img.width : maxHeight / img.height);
    const canvas = document.createElement('canvas');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvasToImageBlob(canvas, 0.85);
}

/** Size of the square map-pin thumbnail (about 2x the pin's on-screen size). */
const PIN_SIZE = 96;

/** Center-crops an image to a small square, for the photo pins on the map. */
export async function pinThumbnail(source: Blob): Promise<Blob> {
    const img = await loadImage(source);
    const side = Math.min(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = PIN_SIZE;
    canvas
        .getContext('2d')
        ?.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, PIN_SIZE, PIN_SIZE);
    return canvasToImageBlob(canvas, 0.8);
}

/**
 * Optimizes a photo for upload, generating the original plus large, small and map-pin thumbnails.
 */
export async function optimizePhoto(file: File): Promise<{
    original: Blob;
    thumbnailLarge: Blob;
    thumbnailSmall: Blob;
    thumbnailPin: Blob;
}> {
    const [original, thumbnailLarge, thumbnailSmall, thumbnailPin] = await Promise.all([
        resizeImage(file, 1920, 1080), // Full HD max
        resizeImage(file, 800, 800),   // Large thumbnail
        resizeImage(file, 300, 300),   // Small thumbnail
        pinThumbnail(file),
    ]);

    return { original, thumbnailLarge, thumbnailSmall, thumbnailPin };
}
