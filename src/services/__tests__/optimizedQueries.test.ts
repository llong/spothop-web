import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizedQueries } from '../optimizedQueries';
import supabase from '../../supabase';

vi.mock('../../supabase', () => ({
    default: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    order: vi.fn(() => ({
                        range: vi.fn()
                    })),
                    is: vi.fn(() => ({
                        order: vi.fn(() => ({
                            range: vi.fn()
                        }))
                    }))
                })),
                order: vi.fn(() => ({
                    range: vi.fn()
                }))
            })),
            rpc: vi.fn()
        })),
        rpc: vi.fn()
    }
}));

describe('optimizedQueries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchLikedMediaOptimized', () => {
        it('fetches and formats liked media correctly', async () => {
            const mockData = [{
                id: 'l1',
                media_type: 'photo',
                spot_photos: [{ id: 'p1', url: 'photo.jpg', spots: [{ id: 's1', name: 'Spot 1' }] }],
                profiles: [{ id: 'u1', username: 'user1', avatarUrl: 'u1.jpg' }]
            }];

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            range: vi.fn().mockResolvedValue({ data: mockData, error: null })
                        })
                    })
                })
            } as any);

            const result = await optimizedQueries.fetchLikedMediaOptimized('u1');
            expect(result[0].mediaId).toBe('p1');
            expect(result[0].spot.name).toBe('Spot 1');
            expect(result[0].author.username).toBe('user1');
        });
    });

    describe('fetchUserContentOptimized', () => {
        it('fetches spots and media using Promise.all', async () => {
            const mockSpots = [{ id: 's1', name: 'Spot 1' }];
            const mockMedia = [{ id: 'm1', type: 'photo' }];

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            range: vi.fn().mockResolvedValue({ data: mockSpots, error: null })
                        })
                    })
                })
            } as any);

            vi.mocked(supabase.rpc).mockResolvedValue({ data: mockMedia, error: null } as any);

            const result = await optimizedQueries.fetchUserContentOptimized('u1');
            expect(result.createdSpots).toEqual(mockSpots);
            expect(result.userMedia).toEqual(mockMedia);
        });
    });
});
