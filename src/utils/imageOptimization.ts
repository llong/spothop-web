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

/**
 * Downscales an image, keeping its aspect ratio: landscape images are limited by maxWidth,
 * portrait images by maxHeight. Never upscales.
 */
async function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<Blob> {
    const img = new Image();
    const url = URL.createObjectURL(file);
    try {
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Could not read the image'));
            img.src = url;
        });
    } finally {
        URL.revokeObjectURL(url);
    }

    const scale = Math.min(1, img.width > img.height ? maxWidth / img.width : maxHeight / img.height);
    const canvas = document.createElement('canvas');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvasToImageBlob(canvas, 0.85);
}

/**
 * Optimizes a photo for upload, generating original, large, and small thumbnails.
 */
export async function optimizePhoto(file: File): Promise<{
    original: Blob;
    thumbnailLarge: Blob;
    thumbnailSmall: Blob;
}> {
    const [original, thumbnailLarge, thumbnailSmall] = await Promise.all([
        resizeImage(file, 1920, 1080), // Full HD max
        resizeImage(file, 800, 800),   // Large thumbnail
        resizeImage(file, 300, 300)    // Small thumbnail
    ]);

    return { original, thumbnailLarge, thumbnailSmall };
}
