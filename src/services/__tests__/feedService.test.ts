import { describe, it, expect, vi, beforeEach } from 'vitest';
import { feedService } from '@/services/feedService';
import supabase from '@/supabase';
import { reverseGeocode } from '@/utils/geocoding';

vi.mock('@/supabase', () => ({
    default: {
        rpc: vi.fn(),
        from: vi.fn()
    }
}));

vi.mock('@/utils/geocoding', () => ({
    reverseGeocode: vi.fn()
}));

describe('feedService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchGlobalFeed', () => {
    it('fetches feed content successfully', async () => {
        const mockData = [{ media_id: '1', media_url: 'url1' }];
        (supabase.rpc as any).mockResolvedValue({ data: mockData, error: null });

        const result = await feedService.fetchGlobalFeed();

        expect(supabase.rpc).toHaveBeenCalledWith('get_global_feed_content', {
            p_limit: 10,
            p_cursor_timestamp: undefined,
            p_user_id: undefined,
            p_lat: undefined,
            p_lng: undefined,
            p_max_dist_km: undefined,
            p_following_only: false,
            p_spot_types: undefined,
            p_difficulties: undefined,
            p_min_risk: undefined,
            p_max_risk: undefined,
            p_rider_types: undefined,
            p_author_id: undefined
        });
        expect(result).toEqual(mockData);
    });

        it('receives user interaction status from RPC', async () => {
            const mockFeed = [
                { media_id: 'p1', spot_id: 's1', is_liked_by_user: true, is_favorited_by_user: true },
                { media_id: 'v1', spot_id: 's2', is_liked_by_user: false, is_favorited_by_user: false }
            ];
            vi.mocked(supabase.rpc).mockResolvedValue({ data: mockFeed, error: null } as any);

            const result = await feedService.fetchGlobalFeed(10, null, 'u1');
            
            expect(supabase.rpc).toHaveBeenCalledWith('get_global_feed_content', expect.objectContaining({
                p_user_id: 'u1'
            }));
            expect(result[0].is_liked_by_user).toBe(true);
            expect(result[0].is_favorited_by_user).toBe(true);
        });

        it('enriches feed items with missing location info via reverse geocoding', async () => {
            const mockFeed = [
                { media_id: 'm1', spot_id: 's1', latitude: 40.7128, longitude: -74.0060, city: 'New York', country: 'USA' } // missing state
            ];
            vi.mocked(supabase.rpc).mockResolvedValue({ data: mockFeed, error: null } as any);
            vi.mocked(reverseGeocode).mockResolvedValue({ state: 'NY' });

            const result = await feedService.fetchGlobalFeed();

            expect(reverseGeocode).toHaveBeenCalledWith(40.7128, -74.0060);
            expect(result[0].state).toBe('NY');
            expect(result[0].city).toBe('New York');
        });
    });

    describe('fetchFollowingFeed', () => {
        const query = (result: unknown) => {
            const chain: any = { then: (resolve: any) => resolve(result) };
            ['select', 'eq', 'or', 'in'].forEach(m => { chain[m] = vi.fn().mockReturnValue(chain); });
            return chain;
        };

        it('uses the interaction flags returned by the RPC without extra queries', async () => {
            const items = [
                { media_id: 'p1', spot_id: 's1', media_type: 'photo', is_liked_by_user: true, is_favorited_by_user: false },
                { media_id: 'v1', spot_id: 's1', media_type: 'video', is_liked_by_user: false, is_favorited_by_user: true },
            ];
            (supabase.rpc as any).mockResolvedValue({ data: items, error: null });

            const result = await feedService.fetchFollowingFeed(10, 0, 'u1');

            expect(supabase.rpc).toHaveBeenCalledWith('get_following_feed_content', { p_limit: 10, p_offset: 0, p_user_id: 'u1' });
            expect(supabase.from).not.toHaveBeenCalled();
            expect(result).toEqual(items);
        });

        it('falls back to enrichment against an RPC without flags, never sending an empty in() filter', async () => {
            // A feed with only photos: videoIds is empty, which used to produce "video_id.in.()"
            const items = [{ media_id: 'p1', spot_id: 's1', media_type: 'photo' }];
            (supabase.rpc as any).mockResolvedValue({ data: items, error: null });
            const likes = query({ data: [{ photo_id: 'p1', video_id: null }] });
            const favorites = query({ data: [{ spot_id: 's1' }] });
            (supabase.from as any).mockImplementation((table: string) => (table === 'media_likes' ? likes : favorites));

            const result = await feedService.fetchFollowingFeed(10, 0, 'u1');

            expect(likes.or).toHaveBeenCalledWith('photo_id.in.(p1)');
            expect((likes.or as any).mock.calls[0][0]).not.toContain('video_id');
            expect(result[0]).toMatchObject({ is_liked_by_user: true, is_favorited_by_user: true });
        });

        it('skips the likes query entirely when there is nothing to look up', async () => {
            (supabase.rpc as any).mockResolvedValue({ data: [], error: null });

            const result = await feedService.fetchFollowingFeed(10, 0, 'u1');

            expect(result).toEqual([]);
            expect(supabase.from).not.toHaveBeenCalled();
        });
    });

    describe('toggleMediaLike', () => {
        it('calls toggle_media_like RPC', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({ data: [{ new_is_liked: true, new_like_count: 5 }], error: null } as any);

            await feedService.toggleMediaLike('m1');
            expect(supabase.rpc).toHaveBeenCalledWith('toggle_media_like', {
                p_media_id: 'm1'
            });
        });
    });

    describe('fetchMediaComments', () => {
        it('fetches comments for photo', async () => {
            const mockComments = [{ 
                id: 'c1', 
                content: 'test',
                media_comment_reactions: [],
                reactions: {
                    likes: 0,
                    userReaction: null
                }
            }];
            const mockFrom = vi.mocked(supabase.from);

            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ 
                            data: [{ 
                                id: 'c1', 
                                content: 'test',
                                media_comment_reactions: []
                            }], 
                            error: null 
                        })
                    })
                })
            } as any);

            const result = await feedService.fetchMediaComments('p1', 'photo');
            expect(result).toEqual(mockComments);
        });
    });

    describe('postMediaComment', () => {
        it('inserts new comment successfully', async () => {
            const mockCommentId = 'new-id';
            const mockComment = { id: mockCommentId, content: 'test' };
            
            vi.mocked(supabase.rpc).mockResolvedValue({ data: mockCommentId, error: null } as any);
            
            const mockSelect = vi.fn().mockReturnThis();
            const mockEq = vi.fn().mockReturnThis();
            const mockSingle = vi.fn().mockResolvedValue({ data: mockComment, error: null });

            vi.mocked(supabase.from).mockReturnValue({
                select: mockSelect,
                eq: mockEq,
                single: mockSingle
            } as any);

            const result = await feedService.postMediaComment('m1', 'photo', 'test');
            
            expect(supabase.rpc).toHaveBeenCalledWith('post_comment', {
                p_media_id: 'm1',
                p_media_type: 'photo',
                p_content: 'test',
                p_parent_id: undefined
            });
            expect(result).toEqual(mockComment);
        });
    });
});
