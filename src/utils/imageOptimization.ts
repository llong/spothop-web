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
 * Resizes and optimizes an image using the browser's Canvas API.
 */
async function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<{ blob: Blob; url: string }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve({
                        blob,
                        url: URL.createObjectURL(blob)
                    });
                } else {
                    reject(new Error('Canvas to Blob failed'));
                }
            }, 'image/webp', 0.85);
        };
        img.onerror = reject;
    });
}

/**
 * Optimizes a photo for upload, generating original, large, and small thumbnails.
 */
export async function optimizePhoto(file: File): Promise<{
    original: { blob: Blob; url: string };
    thumbnailLarge: { blob: Blob; url: string };
    thumbnailSmall: { blob: Blob; url: string };
}> {
    const [original, thumbnailLarge, thumbnailSmall] = await Promise.all([
        resizeImage(file, 1920, 1080), // Full HD max
        resizeImage(file, 800, 800),   // Large thumbnail
        resizeImage(file, 300, 300)    // Small thumbnail
    ]);

    return {
        original,
        thumbnailLarge,
        thumbnailSmall
    };
}
