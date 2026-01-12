import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOptimizedImageUrl, generateImageFilename, optimizePhoto } from '../imageOptimization';

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
            toBlob: vi.fn((cb) => cb(new Blob()))
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

            expect(result.original).toBeDefined();
            expect(result.thumbnailLarge).toBeDefined();
            expect(result.thumbnailSmall).toBeDefined();
            expect(result.original.url).toBe('blob:url');
        });
    });
});
