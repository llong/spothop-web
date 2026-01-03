import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spotService } from './spotService';
import supabase from '../supabase';

// Mock Supabase
vi.mock('../supabase', () => ({
    default: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(),
        }))
    }
}));

// Mock geocoding
vi.mock('../utils/geocoding', () => ({
    reverseGeocode: vi.fn().mockResolvedValue({ city: 'Mock City', country: 'Mock Country' }),
}));

describe('spotService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchSpotDetails', () => {
        it('returns null if spot is not found', async () => {
            const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: mockMaybeSingle
            });

            const result = await spotService.fetchSpotDetails('123');
            expect(result).toBeNull();
        });

        it('fetches and formats spot details correctly', async () => {
            const mockSpotData = {
                id: '123',
                name: 'Test Spot',
                latitude: 1.23,
                longitude: 4.56,
                created_by: 'user1',
                spot_photos: [{
                    id: 'p1',
                    url: 'url1',
                    user_id: 'user1',
                    created_at: '2025-01-01',
                    media_likes: [{ user_id: 'user2' }]
                }],
                spot_videos: []
            };

            const mockProfiles = [
                { id: 'user1', username: 'userone', avatarUrl: 'avatar1' }
            ];

            // Setup complex chaining mock
            const mockFrom = supabase.from as any;
            mockFrom.mockImplementation((table: string) => {
                if (table === 'spots') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue({ data: mockSpotData, error: null })
                    };
                }
                if (table === 'user_favorite_spots' || table === 'content_reports') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        // Simulate count and head
                        then: (cb: any) => cb({ count: 5, data: [{ spot_id: '123' }], error: null })
                    };
                }
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null })
                    };
                }
                return {};
            });

            const result = await spotService.fetchSpotDetails('123', 'user2');

            expect(result).not.toBeNull();
            expect(result?.name).toBe('Test Spot');
            expect(result?.username).toBe('userone');
            expect(result?.media).toHaveLength(1);
            expect(result?.media[0].isLiked).toBe(true);
            expect(result?.isFavorited).toBe(true);
        });
    });
});
