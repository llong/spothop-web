import { describe, it, expect } from 'vitest';
import { getOptimizedImageUrl } from './imageOptimization';

describe('getOptimizedImageUrl', () => {
    const MOCK_PROJECT_URL = 'https://vmsvttqaxntvshatscmx.supabase.co';
    const MOCK_PATH = 'spots/123/photos/image.jpg';
    const MOCK_FULL_URL = `${MOCK_PROJECT_URL}/storage/v1/object/public/spot-media/${MOCK_PATH}`;

    it('returns the same URL when no transformation is needed or URL is not Supabase', () => {
        const externalUrl = 'https://example.com/image.jpg';
        expect(getOptimizedImageUrl(externalUrl)).toBe(externalUrl);
    });

    it('correctly transforms a valid Supabase URL to use the render API', () => {
        const optimized = getOptimizedImageUrl(MOCK_FULL_URL);
        expect(optimized).toContain('/storage/v1/render/image/public/spot-media/');
        expect(optimized).toContain('format=webp');
        expect(optimized).toContain('quality=80');
    });

    it('applies custom transformation options correctly', () => {
        const options = {
            width: 500,
            height: 300,
            quality: 90,
            format: 'avif' as const,
            resize: 'contain' as const
        };
        const optimized = getOptimizedImageUrl(MOCK_FULL_URL, options);
        expect(optimized).toContain('width=500');
        expect(optimized).toContain('height=300');
        expect(optimized).toContain('quality=90');
        expect(optimized).toContain('format=avif');
        expect(optimized).toContain('resize=contain');
    });

    it('handles empty or null inputs gracefully', () => {
        // @ts-ignore
        expect(getOptimizedImageUrl(null)).toBe(null);
        expect(getOptimizedImageUrl('')).toBe('');
    });

    it('preserves existing query parameters when adding new ones', () => {
        const urlWithParams = `${MOCK_FULL_URL}?token=123`;
        const optimized = getOptimizedImageUrl(urlWithParams, { width: 400 });
        expect(optimized).toContain('token=123');
        expect(optimized).toContain('width=400');
    });
});
