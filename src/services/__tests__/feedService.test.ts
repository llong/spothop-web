import { describe, it, expect, vi, beforeEach } from 'vitest';
import { feedService } from '../feedService';
import supabase from '../../supabase';

vi.mock('../../supabase', () => ({
    default: {
        rpc: vi.fn(),
        from: vi.fn()
    }
}));

describe('feedService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchGlobalFeed', () => {
        it('fetches feed content successfully', async () => {
            const mockFeed = [
                { media_id: 'm1', spot_id: 's1', media_type: 'photo' }
            ];
            vi.mocked(supabase.rpc).mockResolvedValue({ data: mockFeed, error: null } as any);

            const result = await feedService.fetchGlobalFeed(10, 0);
            expect(result).toEqual(mockFeed);
            expect(supabase.rpc).toHaveBeenCalledWith('get_global_feed_content', {
                p_limit: 10,
                p_offset: 0
            });
        });

        it('enriches feed with user interaction status', async () => {
            const mockFeed = [
                { media_id: 'p1', spot_id: 's1', media_type: 'photo' },
                { media_id: 'v1', spot_id: 's2', media_type: 'video' }
            ];
            vi.mocked(supabase.rpc).mockResolvedValue({ data: mockFeed, error: null } as any);

            const mockSelect = vi.fn();
            const mockEq = vi.fn();
            const mockOr = vi.fn();
            const mockIn = vi.fn();

            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'media_likes') {
                    return {
                        select: mockSelect.mockReturnValue({
                            eq: mockEq.mockReturnValue({
                                or: mockOr.mockResolvedValue({ data: [{ photo_id: 'p1' }], error: null })
                            })
                        })
                    } as any;
                }
                if (table === 'user_favorite_spots') {
                    return {
                        select: mockSelect.mockReturnValue({
                            eq: mockEq.mockReturnValue({
                                in: mockIn.mockResolvedValue({ data: [{ spot_id: 's1' }], error: null })
                            })
                        })
                    } as any;
                }
                return {} as any;
            });

            const result = await feedService.fetchGlobalFeed(10, 0, 'u1');
            expect(result[0].is_liked_by_user).toBe(true);
            expect(result[0].is_favorited_by_user).toBe(true);
            expect(result[1].is_liked_by_user).toBe(false);
            expect(result[1].is_favorited_by_user).toBe(false);
        });
    });

    describe('toggleMediaLike', () => {
        it('calls handle_media_like RPC', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as any);

            await feedService.toggleMediaLike('m1', 'photo');
            expect(supabase.rpc).toHaveBeenCalledWith('handle_media_like', {
                p_media_id: 'm1',
                p_media_type: 'photo'
            });
        });
    });

    describe('fetchMediaComments', () => {
        it('fetches comments for photo', async () => {
            const mockComments = [{ id: 'c1', content: 'test' }];
            const mockFrom = vi.mocked(supabase.from);

            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: mockComments, error: null })
                    })
                })
            } as any);

            const result = await feedService.fetchMediaComments('p1', 'photo');
            expect(result).toEqual(mockComments);
        });
    });

    describe('postMediaComment', () => {
        it('inserts new comment successfully', async () => {
            const mockComment = { id: 'c1', content: 'new comment' };
            const mockFrom = vi.mocked(supabase.from);

            mockFrom.mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: mockComment, error: null })
                    })
                })
            } as any);

            const result = await feedService.postMediaComment('u1', 'p1', 'photo', 'new comment');
            expect(result).toEqual(mockComment);
            expect(supabase.from).toHaveBeenCalledWith('media_comments');
        });
    });
});
