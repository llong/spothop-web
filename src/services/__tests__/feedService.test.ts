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
        const mockData = [{ media_id: '1', media_url: 'url1' }];
        (supabase.rpc as any).mockResolvedValue({ data: mockData, error: null });

        const result = await feedService.fetchGlobalFeed();

        expect(supabase.rpc).toHaveBeenCalledWith('get_global_feed_content', {
            p_limit: 10,
            p_offset: 0,
            p_user_id: null,
            p_lat: null,
            p_lng: null,
            p_max_dist_km: null,
            p_following_only: false,
            p_spot_types: null,
            p_difficulties: null,
            p_min_risk: null,
            p_max_risk: null,
            p_rider_types: null
        });
        expect(result).toEqual(mockData);
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
                p_parent_id: null
            });
            expect(result).toEqual(mockComment);
        });
    });
});
