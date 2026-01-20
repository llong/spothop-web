import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileService } from './profileService';
import supabase from '../supabase';

// Mock Supabase
vi.mock('../supabase', () => ({
    default: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn(),
        })),
        rpc: vi.fn(() => ({
            get_user_follow_stats: vi.fn().mockResolvedValue({ data: { follower_count: 1, following_count: 2 }, error: null }),
            get_user_followers_batch: vi.fn().mockResolvedValue({ 
                data: [
                    { user_id: 'user2', username: 'user2', avatar_url: 'avatar2.jpg', cursor: 'cursor1' },
                    { user_id: 'user3', username: 'user3', avatar_url: 'avatar3.jpg', cursor: 'cursor2' }
                ], 
                error: null 
            }),
            get_user_following_batch: vi.fn().mockResolvedValue({ 
                data: [
                    { user_id: 'user4', username: 'user4', avatar_url: 'avatar4.jpg', cursor: 'cursor3' },
                    { user_id: 'user5', username: 'user5', avatar_url: 'avatar5.jpg', cursor: 'cursor4' }
                ], 
                error: null 
            }),
        })),
    }
}));

describe('profileService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchIdentity', () => {
        it('fetches profile identity successfully', async () => {
            const mockProfile = { id: 'user1', username: 'userone', displayName: 'User One' };
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
            });

            const result = await profileService.fetchIdentity('user1');
            expect(result).toEqual(mockProfile);
        });

        it('returns null on 406 status (not found)', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not Found' }, status: 406 })
            });

            const result = await profileService.fetchIdentity('user1');
            expect(result).toBeNull();
        });
    });

    describe('fetchFollowStats', () => {
        it('calculates counts correctly', async () => {
            const mockFollowData = [
                { follower_id: 'user1', following_id: 'user2' }, // following
                { follower_id: 'user3', following_id: 'user1' }, // follower
                { follower_id: 'user4', following_id: 'user1' }, // follower
            ];

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                or: vi.fn().mockResolvedValue({ data: mockFollowData, error: null })
            });

            (supabase.rpc as any).mockResolvedValue({
                data: [{ follower_count: '1', following_count: '2' }],
                error: null
            });

            const result = await profileService.fetchFollowStats('user1');
            expect(result.followerCount).toBe(1);
            expect(result.followingCount).toBe(1);
        });
    });

    describe('fetchUserFollowers', () => {
        it('fetches followers with pagination', async () => {
            const result = await profileService.fetchUserFollowers('user1', null, 20);
            
            expect(result.followers).toHaveLength(2);
            expect(result.followers[0].user_id).toBe('user2');
            expect(result.followers[1].user_id).toBe('user3');
            expect(result.cursor).toBe('cursor2');
            expect(result.hasMore).toBe(true);
        });

        it('fetches followers with cursor', async () => {
            const result = await profileService.fetchUserFollowers('user1', 'cursor1', 20);
            
            expect(result.followers).toHaveLength(2);
            expect(result.followers[0].user_id).toBe('user3');
            expect(result.followers[1].user_id).toBe('user4');
            expect(result.cursor).toBe('cursor4');
            expect(result.hasMore).toBe(false);
        });

        it('handles empty result', async () => {
            (supabase.rpc as any).mockResolvedValueOnce({ data: [], error: null });
            
            const result = await profileService.fetchUserFollowers('user1', null, 20);
            
            expect(result.followers).toHaveLength(0);
            expect(result.cursor).toBeNull();
            expect(result.hasMore).toBe(false);
        });
    });

    describe('fetchUserFollowing', () => {
        it('fetches following with pagination', async () => {
            const result = await profileService.fetchUserFollowing('user1', null, 20);
            
            expect(result.following).toHaveLength(2);
            expect(result.following[0].user_id).toBe('user4');
            expect(result.following[1].user_id).toBe('user5');
            expect(result.cursor).toBe('cursor3');
            expect(result.hasMore).toBe(true);
        });

        it('fetches following with cursor', async () => {
            const result = await profileService.fetchUserFollowing('user1', 'cursor3', 20);
            
            expect(result.following).toHaveLength(2);
            expect(result.following[0].user_id).toBe('user4');
            expect(result.following[1].user_id).toBe('user5');
            expect(result.cursor).toBe('cursor4');
            expect(result.hasMore).toBe(false);
        });
    });
});
