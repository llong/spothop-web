import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spotService } from './spotService';
import supabase from '../supabase';

// Mock Supabase
vi.mock('../supabase', () => ({
    default: {
        from: vi.fn(),
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
        }
    }
}));

// Mock geocoding
vi.mock('../utils/geocoding', () => ({
    reverseGeocode: vi.fn().mockResolvedValue({ city: 'Mock City', state: 'Mock State', country: 'Mock Country' }),
}));

describe('spotService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchSpotDetails', () => {
        it('returns null if spot is not found', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
            } as any);

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
                    media_likes: [{ user_id: 'user2' }],
                    media_comments: []
                }],
                spot_videos: [],
            };

            const mockProfiles = [
                { id: 'user1', username: 'userone', avatarUrl: 'avatar1', displayName: 'User One' }
            ];

            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockImplementation((table: string) => {
                const queryBuilder: any = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn(),
                    then: vi.fn().mockImplementation((onFulfilled) => {
                        let result: any = { data: [], error: null, count: 0 };
                        if (table === 'user_favorite_spots') {
                            // Check if it's the count query or the profiles query
                            const lastSelect = queryBuilder.select.mock.calls.at(-1);
                            if (lastSelect?.[1]?.count === 'exact') {
                                result = { count: 1, data: [], error: null };
                            } else if (lastSelect?.[0]?.includes('profiles')) {
                                result = { data: [{ user_id: 'user2', profiles: { username: 'userTwo', avatarUrl: 'avatar2' } }], error: null };
                            } else {
                                result = { data: [{ user_id: 'user2' }], error: null };
                            }
                        } else if (table === 'spot_comments') {
                            result = { count: 2, data: [], error: null };
                        } else if (table === 'content_reports') {
                            result = { count: 0, data: [], error: null };
                        } else if (table === 'profiles') {
                            result = { data: mockProfiles, error: null };
                        }
                        return Promise.resolve(onFulfilled(result));
                    })
                };
                
                if (table === 'spots') {
                    queryBuilder.maybeSingle.mockResolvedValue({ data: mockSpotData, error: null });
                }
                
                return queryBuilder;
            });

            const result = await spotService.fetchSpotDetails('123', 'user2');

            expect(result).not.toBeNull();
            expect(result?.name).toBe('Test Spot');
            expect(result?.creator?.displayName).toBe('User One');
            expect(result?.media).toHaveLength(1);
            expect(result?.media[0].isLiked).toBe(true);
            expect(result?.favoriteCount).toBe(1);
            expect(result?.isFavorited).toBe(true);
            expect(result?.favoritedByUsers?.[0].username).toBe('userTwo');
        });
    });
});