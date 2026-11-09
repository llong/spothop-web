import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOptimizedImageUrl, generateImageFilename, optimizePhoto, pinThumbnail, canvasToImageBlob, imageExtension } from '@/utils/imageOptimization';

describe('imageOptimization', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock URL methods
        window.URL.createObjectURL = vi.fn(() => 'blob:url');
        window.URL.revokeObjectURL = vi.fn();

        // Mock Canvas and Image
        const mockCanvas = {
            getContext: vi.fn(() => ({
                drawImage: vi.fn()
            })),
            toBlob: vi.fn((cb, type) => cb(new Blob([], { type })))
        };
        document.createElement = vi.fn((el) => {
            if (el === 'canvas') return mockCanvas as any;
            return {};
        });

        // Mock Image class
        window.Image = class {
            onload: () => void = () => { };
            onerror: () => void = () => { };
            src: string = '';
            width: number = 2000;
            height: number = 1000;
            constructor() {
                setTimeout(() => this.onload(), 0);
            }
        } as any;
    });

    describe('getOptimizedImageUrl', () => {
        it('returns same url for any input', () => {
            const url = 'https://example.com/image.jpg';
            expect(getOptimizedImageUrl(url)).toBe(url);
        });

        it('returns empty string if no url', () => {
            expect(getOptimizedImageUrl(null)).toBe('');
            expect(getOptimizedImageUrl(undefined)).toBe('');
        });
    });

    describe('generateImageFilename', () => {
        it('includes userId in the filename', () => {
            const userId = 'user123';
            const filename = generateImageFilename(userId);
            expect(filename).toContain(userId);
            expect(filename.endsWith('.jpg')).toBe(true);
        });
    });

    describe('optimizePhoto', () => {
        it('returns original and thumbnails', async () => {
            const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            const result = await optimizePhoto(mockFile);

            expect(result.original).toBeInstanceOf(Blob);
            expect(result.thumbnailLarge).toBeInstanceOf(Blob);
            expect(result.thumbnailSmall).toBeInstanceOf(Blob);
            expect(result.original.type).toBe('image/webp');
        });

        it('makes a 96px square pin thumbnail, cropped from the centre', async () => {
            const draws: number[][] = [];
            const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: (...args: number[]) => draws.push(args.slice(1)) }), toBlob: (cb: (b: Blob) => void, type: string) => cb(new Blob([], { type })) };
            document.createElement = vi.fn(() => canvas as any);

            await pinThumbnail(new File(['x'], 'a.jpg')); // the Image mock is 2000x1000

            expect([canvas.width, canvas.height]).toEqual([96, 96]);
            expect(draws[0]).toEqual([500, 0, 1000, 1000, 0, 0, 96, 96]);
        });

        it('limits landscape photos by width, never upscaling', async () => {
            const sizes: number[][] = [];
            const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: vi.fn() }), toBlob: (cb: (b: Blob) => void, type: string) => { sizes.push([canvas.width, canvas.height]); cb(new Blob([], { type })); } };
            document.createElement = vi.fn(() => canvas as any);

            await optimizePhoto(new File(['x'], 'a.jpg')); // the Image mock is 2000x1000

            expect(sizes).toEqual(expect.arrayContaining([[1920, 960], [800, 400], [300, 150]]));
        });
    });

    describe('canvasToImageBlob', () => {
        const canvasReturning = (...types: string[]) => ({
            toBlob: vi.fn((cb: (b: Blob) => void) => cb(new Blob([], { type: types.shift() }))),
        }) as unknown as HTMLCanvasElement;

        it('uses WebP when the browser can encode it', async () => {
            const blob = await canvasToImageBlob(canvasReturning('image/webp'), 0.8);
            expect(blob.type).toBe('image/webp');
            expect(imageExtension(blob)).toBe('webp');
        });

        it('falls back to JPEG when the browser returns a PNG for WebP (Safari)', async () => {
            const canvas = canvasReturning('image/png', 'image/jpeg');
            const blob = await canvasToImageBlob(canvas, 0.8);
            expect(blob.type).toBe('image/jpeg');
            expect(imageExtension(blob)).toBe('jpg');
            expect(canvas.toBlob).toHaveBeenLastCalledWith(expect.any(Function), 'image/jpeg', 0.8);
        });

        it('throws when neither format can be encoded', async () => {
            await expect(canvasToImageBlob(canvasReturning('image/png', 'image/png'), 0.8)).rejects.toThrow('Canvas to Blob failed');
        });
    });
});
