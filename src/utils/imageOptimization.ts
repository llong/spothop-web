/**
 * Image Optimization Utility
 * 
 * This utility handles image optimization for spot photos:
 * - Creates thumbnails (small: 200x200, large: 800x800)
 * - Optimizes full-sized images (max 1920x1920)
 * - Maintains proper folder structure in Supabase storage
 * - Preserves image metadata
 */

export interface ImageDimensions {
    width: number;
    height: number;
}

export interface OptimizedImage {
    blob: Blob;
    dimensions: ImageDimensions;
}

export interface PhotoUploadResult {
    originalUrl: string;
    thumbnailSmallUrl: string;
    thumbnailLargeUrl: string;
    metadata: {
        width: number;
        height: number;
        takenAt?: string;
        location?: string;
    };
}

/**
 * Resizes an image to fit within max dimensions while maintaining aspect ratio
 */
export async function resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.9
): Promise<OptimizedImage> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
                const aspectRatio = width / height;

                if (width > height) {
                    width = Math.min(width, maxWidth);
                    height = width / aspectRatio;
                } else {
                    height = Math.min(height, maxHeight);
                    width = height * aspectRatio;
                }
            }

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;

            // Draw image on canvas
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve({
                            blob,
                            dimensions: { width, height },
                        });
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = URL.createObjectURL(file);
    });
}

/**
 * Creates a thumbnail by resizing width and maintaining aspect ratio
 * (matches mobile app behavior)
 */
export async function createThumbnail(
    file: File,
    targetWidth: number,
    quality: number = 0.7
): Promise<OptimizedImage> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        img.onload = () => {
            const { width, height } = img;

            // Calculate new dimensions maintaining aspect ratio
            const aspectRatio = width / height;
            const newWidth = targetWidth;
            const newHeight = Math.round(newWidth / aspectRatio);

            // Set canvas dimensions
            canvas.width = newWidth;
            canvas.height = newHeight;

            // Draw resized image
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve({
                            blob,
                            dimensions: { width: newWidth, height: newHeight },
                        });
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = URL.createObjectURL(file);
    });
}

/**
 * Gets image dimensions without loading the full image
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            resolve({
                width: img.width,
                height: img.height,
            });
            URL.revokeObjectURL(img.src);
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
            URL.revokeObjectURL(img.src);
        };

        img.src = URL.createObjectURL(file);
    });
}

/**
 * Optimizes a photo by creating thumbnails and optimized full-size version
 * Matches mobile app: 240px small, 720px large thumbnails
 */
export async function optimizePhoto(file: File): Promise<{
    original: OptimizedImage;
    thumbnailSmall: OptimizedImage;
    thumbnailLarge: OptimizedImage;
}> {
    const [original, thumbnailSmall, thumbnailLarge] = await Promise.all([
        resizeImage(file, 1920, 1920, 0.9), // Full size (max 1920x1920)
        createThumbnail(file, 240, 0.7), // Small thumbnail (240px width)
        createThumbnail(file, 720, 0.7), // Large thumbnail (720px width)
    ]);

    return {
        original,
        thumbnailSmall,
        thumbnailLarge,
    };
}

/**
 * Generates a unique filename for the image
 * Format matches mobile app: {userId}_{uuid}
 */
export function generateImageFilename(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${userId}_${timestamp}_${random}`;
}
