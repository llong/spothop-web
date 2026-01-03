/**
 * Generates a Supabase transformation URL for an image.
 * Uses Supabase's built-in image optimization.
 * https://supabase.com/docs/guides/storage/image-transformations
 * 
 * @param url The original image URL from Supabase storage
 * @param options Transformation options (width, height, quality, format)
 * @returns The optimized image URL
 */
export function getOptimizedImageUrl(
    url: string,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'origin' | 'webp' | 'avif';
        resize?: 'cover' | 'contain' | 'fill';
    } = {}
): string {
    if (!url) return url;

    // Check if it's a Supabase URL
    if (!url.includes('.supabase.co/storage/v1/object/public/')) {
        return url;
    }

    const {
        width,
        height,
        quality = 80,
        format = 'webp',
        resize = 'cover'
    } = options;

    // Supabase transformation URL format:
    // https://[PROJECT_ID].supabase.co/storage/v1/render/image/public/[BUCKET]/[PATH]?width=500&height=500&quality=80&format=webp&resize=cover

    // Convert object/public to render/image/public
    const transformedBaseUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');

    const separator = transformedBaseUrl.includes('?') ? '&' : '?';

    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    params.append('quality', quality.toString());
    params.append('format', format);
    params.append('resize', resize);

    return `${transformedBaseUrl}${separator}${params.toString()}`;
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
            }, 'image/jpeg', 0.85);
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
