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
        }))
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

            const result = await profileService.fetchFollowStats('user1');
            expect(result.followerCount).toBe(2);
            expect(result.followingCount).toBe(1);
        });
    });
});
