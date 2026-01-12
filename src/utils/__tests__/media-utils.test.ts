import { describe, it, expect, vi } from 'vitest';
import { getSpotThumbnail, formatMediaItem, enrichLocation } from '../media-utils';

vi.mock('../geocoding', () => ({
    reverseGeocode: vi.fn(() => Promise.resolve({
        city: 'Enriched City',
        state: 'ES',
        country: 'Enriched Country'
    }))
}));

describe('media-utils', () => {
    describe('getSpotThumbnail', () => {
        it('returns a photo url if available', () => {
            const photos = [{ url: 'p1.jpg' }];
            expect(getSpotThumbnail(photos as any)).toBe('p1.jpg');
        });

        it('returns null if no photos', () => {
            expect(getSpotThumbnail([])).toBeNull();
        });
    });

    describe('enrichLocation', () => {
        it('skips geocoding if location is already complete', async () => {
            const item = { latitude: 1, longitude: 2, city: 'C', state: 'S', country: 'CO' };
            const result = await enrichLocation(item);
            expect(result).toEqual(item);
        });

        it('enriches missing location data using reverse geocoding', async () => {
            const item = { latitude: 1, longitude: 2 };
            const result: any = await enrichLocation(item as any);
            expect(result.city).toBe('Enriched City');
            expect(result.country).toBe('Enriched Country');
        });
    });

    describe('formatMediaItem', () => {
        it('formats a photo correctly', async () => {
            const raw = { id: 'm1', url: 'p.jpg', created_at: '2025-01-01', spots: { id: 's1', name: 'Spot' } };
            const result = await formatMediaItem(raw, 'photo');
            expect(result.type).toBe('photo');
            expect(result.spot.name).toBe('Spot');
        });

        it('formats a video with thumbnailUrl', async () => {
            const raw = { id: 'v1', url: 'v.mp4', thumbnail_url: 't.jpg', created_at: '2025-01-01' };
            const result = await formatMediaItem(raw, 'video');
            expect(result.thumbnailUrl).toBe('t.jpg');
            expect(result.type).toBe('video');
        });
    });
});
