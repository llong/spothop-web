import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProfileQuery, useSocialStatsQuery } from '../useProfileQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { profileService } from 'src/services/profileService';

vi.mock('src/services/profileService', () => ({
    profileService: {
        fetchIdentity: vi.fn(),
        fetchFollowStats: vi.fn(),
        fetchFavoriteSpots: vi.fn(),
        fetchLikedMedia: vi.fn(),
    }
}));

describe('useProfileQueries', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    it('useProfileQuery fetches user identity', async () => {
        const mockProfile = { id: 'u1', username: 'testuser' };
        vi.mocked(profileService.fetchIdentity).mockResolvedValue(mockProfile as any);

        const { result } = renderHook(() => useProfileQuery('u1'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockProfile);
    });

    it('useSocialStatsQuery fetches combined social data', async () => {
        const mockStats = { followerCount: 10, followingCount: 5 };
        const mockFavorites = [{ id: 's1' }];
        const mockLikes = [{ id: 'l1' }];

        vi.mocked(profileService.fetchFollowStats).mockResolvedValue(mockStats);
        vi.mocked(profileService.fetchFavoriteSpots).mockResolvedValue(mockFavorites as any);
        vi.mocked(profileService.fetchLikedMedia).mockResolvedValue(mockLikes as any);

        const { result } = renderHook(() => useSocialStatsQuery('u1'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual({
            favorites: mockFavorites,
            likes: mockLikes,
            ...mockStats
        });
    });
});
