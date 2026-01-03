import { renderHook, waitFor } from '@testing-library/react';
import { useProfileQuery, useSocialStatsQuery, useUserContentQuery } from '../useProfileQueries';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { profileService } from 'src/services/profileService';
import React from 'react';

// Mock profileService
vi.mock('src/services/profileService', () => ({
    profileService: {
        fetchIdentity: vi.fn(),
        fetchFavoriteSpots: vi.fn(),
        fetchLikedMedia: vi.fn(),
        fetchFollowStats: vi.fn(),
        fetchUserContent: vi.fn(),
    }
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('useProfileQueries hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    describe('useProfileQuery', () => {
        it('fetches identity when userId is provided', async () => {
            const mockIdentity = { id: 'user1', username: 'userone' } as any;
            vi.mocked(profileService.fetchIdentity).mockResolvedValue(mockIdentity);

            const { result } = renderHook(() => useProfileQuery('user1'), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockIdentity);
        });
    });

    describe('useSocialStatsQuery', () => {
        it('fetches social stats correctly', async () => {
            vi.mocked(profileService.fetchFavoriteSpots).mockResolvedValue([]);
            vi.mocked(profileService.fetchLikedMedia).mockResolvedValue([]);
            vi.mocked(profileService.fetchFollowStats).mockResolvedValue({ followerCount: 5, followingCount: 5 });

            const { result } = renderHook(() => useSocialStatsQuery('user1'), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.followerCount).toBe(5);
        });
    });

    describe('useUserContentQuery', () => {
        it('fetches user content correctly', async () => {
            const mockContent = { createdSpots: [], userMedia: [] };
            vi.mocked(profileService.fetchUserContent).mockResolvedValue(mockContent);

            const { result } = renderHook(() => useUserContentQuery('user1'), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockContent);
        });
    });
});
