import { describe, it, expect } from 'vitest';
import { getOptimizedImageUrl } from '../imageOptimization';

describe('imageOptimization', () => {
    it('returns the original URL without transformation parameters (Free Plan workaround)', () => {
        const url = 'https://example.supabase.co/storage/v1/object/public/spots/photo.jpg';
        // Should NOT append any ?width= or ?height=
        expect(getOptimizedImageUrl(url)).toBe(url);
    });

    it('returns the original URL even if we intend to pass options (Free Plan workaround)', () => {
        const url = 'https://example.supabase.co/storage/v1/object/public/spots/photo.jpg';
        expect(getOptimizedImageUrl(url)).toBe(url);
    });

    it('handles non-Supabase URLs correctly', () => {
        const url = 'https://other-site.com/image.png';
        expect(getOptimizedImageUrl(url)).toBe(url);
    });

    it('handles empty or null URLs', () => {
        expect(getOptimizedImageUrl('')).toBe('');
        expect(getOptimizedImageUrl(null as any)).toBe('');
    });
});
