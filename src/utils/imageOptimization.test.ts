import { describe, it, expect } from 'vitest';
import { getOptimizedImageUrl, generateImageFilename } from './imageOptimization';

describe('getOptimizedImageUrl', () => {
    it('returns the same URL as provided', () => {
        const testUrl = 'https://example.com/image.jpg';
        expect(getOptimizedImageUrl(testUrl)).toBe(testUrl);

        const supabaseUrl = 'https://vmsvttqaxntvshatscmx.supabase.co/storage/v1/object/public/spot-media/image.jpg';
        expect(getOptimizedImageUrl(supabaseUrl)).toBe(supabaseUrl);
    });

    it('handles empty or null inputs gracefully', () => {
        // @ts-ignore
        expect(getOptimizedImageUrl(null)).toBe(null);
        expect(getOptimizedImageUrl('')).toBe('');
    });
});

describe('generateImageFilename', () => {
    it('generates a unique filename for an image', () => {
        const userId = 'user123';
        const filename = generateImageFilename(userId);
        expect(filename).toContain(userId);
        expect(filename).toMatch(/\.jpg$/);

        const anotherFilename = generateImageFilename(userId);
        expect(filename).not.toBe(anotherFilename);
    });
});
